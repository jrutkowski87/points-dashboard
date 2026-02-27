// Credit detection patterns — matched against Plaid statement credit transactions (negative amounts)
export const CREDIT_PATTERNS = [
  // ─── MONTHLY CREDITS ─────────────────────────────────────────────────────
  {
    id: 'resy_personal',
    label: 'Resy Dining Credit',
    card: 'deltaReservePersonal',
    type: 'monthly',
    amountRange: [10, 25],
    merchantPattern: /resy/i,
    maxAmount: 20,
    resetDay: 1,
    description: '$20/month toward Resy restaurant reservations',
    category: 'dining',
  },
  {
    id: 'resy_business',
    label: 'Resy Dining Credit',
    card: 'deltaReserveBusiness',
    type: 'monthly',
    amountRange: [10, 25],
    merchantPattern: /resy/i,
    maxAmount: 20,
    resetDay: 1,
    description: '$20/month toward Resy restaurant reservations',
    category: 'dining',
  },
  {
    id: 'wireless_amexplat',
    label: 'Wireless Credit',
    card: 'amexPlatBiz',
    type: 'monthly',
    amountRange: [5, 12],
    merchantPattern: /at&t|verizon|t-mobile|sprint|wireless|cellular/i,
    maxAmount: 10,
    resetDay: 1,
    description: '$10/month toward wireless phone service',
    category: 'wireless',
  },
  // ─── ANNUAL CREDITS ───────────────────────────────────────────────────────
  {
    id: 'chase_travel_300',
    label: 'Travel Credit',
    card: 'chaseSapphireReserve',
    type: 'annual',
    // Chase auto-applies as statement credits on travel charges — detect cumulative credits
    amountRange: [1, 305],
    merchantPattern: /.*/,
    plaidCategories: ['Travel', 'Airlines', 'Hotels', 'Car Rental', 'Taxi'],
    maxAmount: 300,
    resetMonth: 1, // January
    description: '$300/year applied automatically to travel purchases',
    category: 'travel',
    isAutoApplied: true, // no action needed, auto-detected
  },
  {
    id: 'delta_statement_250',
    label: 'Delta Statement Credit',
    card: 'deltaReserveBusiness',
    type: 'annual',
    amountRange: [200, 260],
    merchantPattern: /delta/i,
    maxAmount: 250,
    resetMonth: 1,
    description: '$250/year as statement credit on Delta purchases',
    category: 'travel',
  },
  {
    id: 'airline_fee_200',
    label: 'Airline Fee Credit',
    card: 'amexPlatBiz',
    type: 'annual',
    amountRange: [1, 210],
    merchantPattern: /delta|united|american airlines|southwest|alaska|jetblue/i,
    maxAmount: 200,
    resetMonth: 1,
    description: '$200/year toward incidental airline fees (bag fees, seat upgrades, lounge passes)',
    category: 'travel',
    note: 'Select your qualifying airline in Amex account settings',
  },
  {
    id: 'dell_h1',
    label: 'Dell Credit (Jan–Jun)',
    card: 'amexPlatBiz',
    type: 'semi-annual',
    amountRange: [80, 125],
    merchantPattern: /dell/i,
    maxAmount: 120,
    resetMonth: 1,
    period: 'H1',
    description: '$120 semi-annually (Jan–Jun) toward Dell.com purchases',
    category: 'tech',
  },
  {
    id: 'dell_h2',
    label: 'Dell Credit (Jul–Dec)',
    card: 'amexPlatBiz',
    type: 'semi-annual',
    amountRange: [80, 125],
    merchantPattern: /dell/i,
    maxAmount: 120,
    resetMonth: 7,
    period: 'H2',
    description: '$120 semi-annually (Jul–Dec) toward Dell.com purchases',
    category: 'tech',
  },
  {
    id: 'indeed_q1',
    label: 'Indeed Credit (Q1)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    amountRange: [75, 95],
    merchantPattern: /indeed/i,
    maxAmount: 90,
    quarter: 1,
    description: '$90/quarter toward Indeed recruiting credits',
    category: 'business',
  },
  {
    id: 'indeed_q2',
    label: 'Indeed Credit (Q2)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    amountRange: [75, 95],
    merchantPattern: /indeed/i,
    maxAmount: 90,
    quarter: 2,
    description: '$90/quarter toward Indeed recruiting credits',
    category: 'business',
  },
  {
    id: 'indeed_q3',
    label: 'Indeed Credit (Q3)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    amountRange: [75, 95],
    merchantPattern: /indeed/i,
    maxAmount: 90,
    quarter: 3,
    description: '$90/quarter toward Indeed recruiting credits',
    category: 'business',
  },
  {
    id: 'indeed_q4',
    label: 'Indeed Credit (Q4)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    amountRange: [75, 95],
    merchantPattern: /indeed/i,
    maxAmount: 90,
    quarter: 4,
    description: '$90/quarter toward Indeed recruiting credits',
    category: 'business',
  },
  {
    id: 'adobe_annual',
    label: 'Adobe Credit',
    card: 'amexPlatBiz',
    type: 'annual',
    amountRange: [130, 160],
    merchantPattern: /adobe/i,
    maxAmount: 150,
    resetMonth: 1,
    description: '$150/year toward Adobe Creative Cloud subscriptions',
    category: 'business',
  },
  {
    id: 'clear_annual',
    label: 'Clear+ Credit',
    card: 'amexPlatBiz',
    type: 'annual',
    amountRange: [175, 200],
    merchantPattern: /clear/i,
    maxAmount: 189,
    resetMonth: 1,
    description: '$189/year toward Clear+ membership',
    category: 'travel',
  },
  {
    id: 'opentable_csr',
    label: 'Dining Credit (OpenTable)',
    card: 'chaseSapphireReserve',
    type: 'configurable', // user sets amount and cadence
    amountRange: [1, 100],
    merchantPattern: /opentable/i,
    maxAmount: 50, // default; user can edit
    description: 'Dining credit via OpenTable reservations — verify current terms with Chase',
    category: 'dining',
    userConfigurable: true,
  },
];

// Get the current period key for a given pattern
export function getPeriodKey(pattern, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);

  switch (pattern.type) {
    case 'monthly': return `${year}-${String(month).padStart(2, '0')}`;
    case 'quarterly': return `${year}-Q${quarter}`;
    case 'semi-annual': return month <= 6 ? `${year}-H1` : `${year}-H2`;
    case 'annual': return `${year}`;
    case 'configurable': return `${year}-${String(month).padStart(2, '0')}`;
    default: return `${year}`;
  }
}

// Get days until reset for a pattern
export function getDaysUntilReset(pattern, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();

  switch (pattern.type) {
    case 'monthly': {
      const nextReset = new Date(year, month + 1, 1);
      return Math.ceil((nextReset - date) / 86400000);
    }
    case 'quarterly': {
      const quarter = Math.ceil((month + 1) / 3);
      const nextQuarterMonth = quarter * 3; // 3, 6, 9, 12
      const nextReset = new Date(year, nextQuarterMonth, 1);
      return Math.ceil((nextReset - date) / 86400000);
    }
    case 'semi-annual': {
      const nextReset = month < 6 ? new Date(year, 6, 1) : new Date(year + 1, 0, 1);
      return Math.ceil((nextReset - date) / 86400000);
    }
    case 'annual':
    case 'configurable': {
      const nextReset = new Date(year + 1, 0, 1);
      return Math.ceil((nextReset - date) / 86400000);
    }
    default: return 365;
  }
}

// Filter to only current-period credits (e.g., only show Q1 credits in Q1)
export function isCurrentPeriod(pattern, date = new Date()) {
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  if (pattern.type === 'quarterly' && pattern.quarter !== quarter) return false;
  if (pattern.type === 'semi-annual') {
    if (pattern.period === 'H1' && month > 6) return false;
    if (pattern.period === 'H2' && month <= 6) return false;
  }
  return true;
}

// Match a Plaid transaction against patterns
export function matchTransaction(transaction, patterns) {
  const matched = [];
  for (const pattern of patterns) {
    const amount = Math.abs(transaction.amount); // Plaid credits are negative
    if (transaction.amount >= 0) continue; // only process credits

    const amountOk = amount >= pattern.amountRange[0] && amount <= (pattern.amountRange[1] || 9999);
    const merchantOk = pattern.merchantPattern.test(transaction.merchant_name || '');

    if (amountOk && merchantOk) {
      matched.push({ pattern, amount });
    }
  }
  return matched;
}
