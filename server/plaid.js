import { PlaidApi, PlaidEnvironments, Configuration } from 'plaid';
import { savePlaidItem, saveTransactions, updateLastSynced, saveDetectedCredit, getPlaidItems } from './db.js';
import { CREDIT_PATTERNS, getPeriodKey, matchTransaction } from './creditPatterns.js';

let plaidClient = null;

function getPlaidClient() {
  if (!plaidClient) {
    const config = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });
    plaidClient = new PlaidApi(config);
  }
  return plaidClient;
}

export function isPlaidConfigured() {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

export async function createLinkToken(userId = 'points-dashboard-user') {
  const client = getPlaidClient();
  const response = await client.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'Points Dashboard',
    products: ['transactions'],
    country_codes: ['US'],
    language: 'en',
  });
  return response.data.link_token;
}

export async function exchangePublicToken(publicToken, cardId, institutionName) {
  const client = getPlaidClient();
  const response = await client.itemPublicTokenExchange({ public_token: publicToken });
  const { access_token, item_id } = response.data;
  savePlaidItem(item_id, access_token, institutionName, cardId);
  return { item_id, access_token };
}

export async function syncTransactions(item) {
  const client = getPlaidClient();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = new Date().toISOString().split('T')[0];

  try {
    const response = await client.transactionsGet({
      access_token: item.access_token,
      start_date: startDateStr,
      end_date: endDateStr,
      options: { count: 500, offset: 0 },
    });

    const transactions = response.data.transactions.map(t => ({
      transaction_id: t.transaction_id,
      item_id: item.item_id,
      card_id: item.card_id,
      amount: t.amount,
      merchant_name: t.merchant_name || t.name,
      category: (t.category || []).join(' > '),
      date: t.date,
      pending: t.pending,
    }));

    saveTransactions(transactions);
    updateLastSynced(item.item_id);

    // Run credit detection on credits (negative amount transactions)
    detectCreditUsage(transactions);

    return { synced: transactions.length };
  } catch (err) {
    console.error(`Sync failed for item ${item.item_id}:`, err.message);
    throw err;
  }
}

export async function syncAllItems() {
  const items = getPlaidItems();
  const results = [];
  for (const item of items) {
    try {
      const result = await syncTransactions(item);
      results.push({ item_id: item.item_id, card_id: item.card_id, ...result });
    } catch (err) {
      results.push({ item_id: item.item_id, card_id: item.card_id, error: err.message });
    }
  }
  return results;
}

function detectCreditUsage(transactions) {
  for (const txn of transactions) {
    if (txn.amount >= 0) continue; // only credits
    const matched = matchTransaction(txn, CREDIT_PATTERNS);
    for (const { pattern, amount } of matched) {
      const txnDate = new Date(txn.date);
      const period = getPeriodKey(pattern, txnDate);
      const wasNew = saveDetectedCredit(pattern.id, txn.transaction_id, txn.card_id, amount, period);
      if (wasNew) {
        console.log(`[Credit Detected] ${pattern.label} (${pattern.card}) — $${amount} in period ${period}`);
      }
    }
  }
}
