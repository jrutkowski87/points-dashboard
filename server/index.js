import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: join(__dirname, '.env') });
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import {
  getUserState, setUserState, getPlaidItems,
  getTransactions, getCardSpend, getDetectedCredits,
  markCreditUsed, removeCreditUsed, recordBalance, getBalanceHistory,
} from './db.js';
import {
  isPlaidConfigured, createLinkToken, exchangePublicToken,
  syncAllItems, syncTransactions,
} from './plaid.js';
import { calcCardSpendStats, plaidCategoryToSpend, EARN_RATES } from './points.js';
import { CREDIT_PATTERNS, getPeriodKey, getDaysUntilReset, isCurrentPeriod } from './creditPatterns.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ─── HEALTH ──────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    plaidConfigured: isPlaidConfigured(),
    timestamp: new Date().toISOString(),
  });
});

// ─── USER STATE ───────────────────────────────────────────────────────────────
app.get('/api/state', (req, res) => {
  const defaultState = {
    points: {
      deltaSkymiles: { balance: 0, statusLevel: 'Platinum', lastUpdated: null },
      chaseUR: { balance: 0, lastUpdated: null },
      amexMR: { balance: 0, lastUpdated: null },
      biltPoints: { balance: 0, lastUpdated: null },
      hiltonHonors: { balance: 0, lastUpdated: null },
      hyattPoints: { balance: 0, lastUpdated: null },
      marriottBonvoy: { balance: 0, lastUpdated: null },
      virginAtlantic: { balance: 0, lastUpdated: null, lastActivityDate: null },
    },
    goals: {
      biltWelcome: { targetSpend: 4000, bonusPoints: 100000, complete: false },
      deltaStatus: {
        currentMQDsFromFlying: 0,
        targetMQDs: 28000,
        headstartClaimed: true,
        headstartAmount: 5000,
      },
    },
    londonTrips: {
      targetTrips: 2,
      milesPerPersonRT: 150000,
      estimatedTaxesFees: 500,
    },
    priorities: {
      biltWelcomeComplete: false,
      diamondPushActive: true,
    },
    cardMeta: {
      amexPlatBiz: { anniversaryMonth: 1 },
      deltaReserveBusiness: { anniversaryMonth: 1 },
      deltaReservePersonal: { anniversaryMonth: 1 },
      chaseSapphireReserve: { anniversaryMonth: 1 },
      biltPalladium: { anniversaryMonth: 1 },
    },
    openTableCredit: { amount: 50, type: 'monthly' },
  };

  const saved = getUserState('userState', defaultState);
  res.json(saved);
});

app.post('/api/state', (req, res) => {
  setUserState('userState', req.body);
  res.json({ ok: true });
});

// ─── PLAID ────────────────────────────────────────────────────────────────────
app.post('/api/plaid/create-link-token', async (req, res) => {
  if (!isPlaidConfigured()) {
    return res.status(400).json({ error: 'Plaid not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to server/.env' });
  }
  try {
    const linkToken = await createLinkToken();
    res.json({ link_token: linkToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plaid/exchange-token', async (req, res) => {
  const { public_token, card_id, institution_name } = req.body;
  try {
    const result = await exchangePublicToken(public_token, card_id, institution_name);
    // Immediately sync
    const items = getPlaidItems();
    const newItem = items.find(i => i.item_id === result.item_id);
    if (newItem) await syncTransactions(newItem);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plaid/sync', async (req, res) => {
  if (!isPlaidConfigured()) {
    return res.json({ results: [], message: 'Plaid not configured' });
  }
  try {
    const results = await syncAllItems();
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plaid/items', (req, res) => {
  const items = getPlaidItems().map(i => ({
    item_id: i.item_id,
    institution_name: i.institution_name,
    card_id: i.card_id,
    last_synced: i.last_synced,
  }));
  res.json(items);
});

// ─── TRANSACTIONS + SPEND STATS ───────────────────────────────────────────────
app.get('/api/transactions', (req, res) => {
  const { cardId, since, limit = 100 } = req.query;
  const sinceDate = since || new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
  const txns = getTransactions({ cardId, since: sinceDate, limit: parseInt(limit) });
  res.json(txns);
});

app.get('/api/spend-stats', (req, res) => {
  const year = new Date().getFullYear();
  const sinceDate = `${year}-01-01`;
  const txns = getTransactions({ since: sinceDate });
  const stats = calcCardSpendStats(txns);

  // Add Bilt welcome spend (all time since card added)
  const biltSince = '2024-01-01'; // approximate; adjust to actual card open date
  const biltYtdSpend = getCardSpend('biltPalladium', sinceDate);
  const biltAllTimeSpend = getCardSpend('biltPalladium', biltSince);

  res.json({
    byCard: stats,
    biltWelcomeSpend: biltAllTimeSpend,
    ytdSpend: {
      biltPalladium: biltYtdSpend,
      deltaReservePersonal: getCardSpend('deltaReservePersonal', sinceDate),
      deltaReserveBusiness: getCardSpend('deltaReserveBusiness', sinceDate),
      chaseSapphireReserve: getCardSpend('chaseSapphireReserve', sinceDate),
      amexPlatBiz: getCardSpend('amexPlatBiz', sinceDate),
    },
  });
});

// ─── EARN HISTORY ─────────────────────────────────────────────────────────────
app.get('/api/earn-history', (req, res) => {
  const { limit = 30 } = req.query;
  const txns = getTransactions({ limit: parseInt(limit) });
  const result = txns
    .filter(t => t.amount > 0)
    .map(t => {
      if (!t.card_id || !EARN_RATES[t.card_id]) return { ...t, estimated: null };
      const rates = EARN_RATES[t.card_id];
      const cat = plaidCategoryToSpend(t.category);
      const earnRate = rates[cat] || rates.other || 1;
      return {
        ...t,
        estimated: { points: Math.floor(t.amount * earnRate), currency: rates.pointCurrency, earnRate, category: cat },
      };
    });
  res.json(result);
});

// ─── BALANCE HISTORY ──────────────────────────────────────────────────────────
app.post('/api/balance-history', (req, res) => {
  const { programId, balance } = req.body;
  if (!programId || balance == null) return res.status(400).json({ error: 'programId and balance required' });
  recordBalance(programId, parseInt(balance) || 0);
  res.json({ ok: true });
});

app.get('/api/balance-history/:programId', (req, res) => {
  const history = getBalanceHistory(req.params.programId);
  res.json(history);
});

// ─── CREDITS ──────────────────────────────────────────────────────────────────
app.get('/api/credits/status', (req, res) => {
  const now = new Date();
  const detectedCredits = getDetectedCredits();

  const creditStatus = CREDIT_PATTERNS.filter(p => isCurrentPeriod(p, now)).map(pattern => {
    const period = getPeriodKey(pattern, now);
    const daysUntilReset = getDaysUntilReset(pattern, now);
    const detected = detectedCredits.find(
      d => d.credit_pattern_id === pattern.id && d.period === period
    );

    return {
      ...pattern,
      merchantPattern: pattern.merchantPattern.toString(),
      plaidCategories: pattern.plaidCategories,
      period,
      daysUntilReset,
      used: !!detected,
      usedAmount: detected?.amount || null,
      detectedViePlaid: !!detected && !detected.manually_overridden,
      manuallyMarked: !!detected && !!detected.manually_overridden,
    };
  });

  res.json(creditStatus);
});

app.post('/api/credits/mark-used', (req, res) => {
  const { patternId, period, used } = req.body;
  if (used) {
    markCreditUsed(patternId, period, true);
  } else {
    removeCreditUsed(patternId, period);
  }
  res.json({ ok: true });
});

// ─── CRON: nightly sync ───────────────────────────────────────────────────────
cron.schedule('0 2 * * *', async () => {
  if (!isPlaidConfigured()) return;
  console.log('[Cron] Running nightly Plaid sync...');
  await syncAllItems();
  console.log('[Cron] Nightly sync complete');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Points Dashboard server running at http://localhost:${PORT}`);
  if (!isPlaidConfigured()) {
    console.log('⚠️  Plaid not configured — add keys to server/.env to enable auto-sync');
  }
});
