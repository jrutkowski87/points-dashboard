// Spend categories with earn rates per card + advisor logic

export const SPEND_CATEGORIES = [
  { id: 'rent', label: 'Rent', icon: '🏠' },
  { id: 'dining', label: 'Dining / Restaurants', icon: '🍽️' },
  { id: 'flights_delta', label: 'Delta Flights', icon: '✈️' },
  { id: 'flights_other', label: 'Other Airline Flights', icon: '✈️' },
  { id: 'hotels_direct', label: 'Hotels (direct)', icon: '🏨' },
  { id: 'hotels_chase_travel', label: 'Hotels via Chase Travel', icon: '🏨' },
  { id: 'transit_rideshare', label: 'Transit / Rideshare', icon: '🚕' },
  { id: 'wireless', label: 'Wireless / Phone', icon: '📱' },
  { id: 'office_supplies', label: 'Office Supplies', icon: '📎' },
  { id: 'shipping', label: 'Shipping / Postage', icon: '📦' },
  { id: 'groceries', label: 'Groceries', icon: '🛒' },
  { id: 'gas', label: 'Gas / Fuel', icon: '⛽' },
  { id: 'online_shopping', label: 'Online Shopping', icon: '🛍️' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'travel_other', label: 'Other Travel', icon: '🌍' },
  { id: 'other', label: 'Other / Miscellaneous', icon: '💳' },
];

// Earn rates: { cardId: { categoryId: { rate, currency, notes } } }
const EARN_MATRIX = {
  amexPlatBiz: {
    rent: { rate: 1, currency: 'amexMR' },
    dining: { rate: 1, currency: 'amexMR' },
    flights_delta: { rate: 5, currency: 'amexMR', note: 'Book direct with Delta or via Amex Travel' },
    flights_other: { rate: 5, currency: 'amexMR', note: 'Book direct with airline or via Amex Travel' },
    hotels_direct: { rate: 1, currency: 'amexMR', note: '5x only via Amex Travel portal' },
    hotels_chase_travel: { rate: 1, currency: 'amexMR' },
    transit_rideshare: { rate: 1, currency: 'amexMR' },
    wireless: { rate: 1.5, currency: 'amexMR', note: 'Eligible wireless service providers' },
    office_supplies: { rate: 1.5, currency: 'amexMR', note: 'US office supply stores' },
    shipping: { rate: 1.5, currency: 'amexMR', note: 'US shipping providers' },
    groceries: { rate: 1, currency: 'amexMR' },
    gas: { rate: 1, currency: 'amexMR' },
    online_shopping: { rate: 1, currency: 'amexMR' },
    entertainment: { rate: 1, currency: 'amexMR' },
    travel_other: { rate: 1, currency: 'amexMR' },
    other: { rate: 1, currency: 'amexMR' },
  },
  deltaReserveBusiness: {
    rent: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    dining: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    flights_delta: { rate: 3, currency: 'deltaSkyMiles', mqdsRate: 0.2, note: 'Also earns MQDs on Delta spend' },
    flights_other: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    hotels_direct: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    hotels_chase_travel: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    transit_rideshare: { rate: 1.5, currency: 'deltaSkyMiles', mqdsRate: 0.1, note: 'Eligible transit' },
    wireless: { rate: 1.5, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    office_supplies: { rate: 1.5, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    shipping: { rate: 1.5, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    groceries: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    gas: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    online_shopping: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    entertainment: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    travel_other: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    other: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
  },
  deltaReservePersonal: {
    rent: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    dining: { rate: 2, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    flights_delta: { rate: 3, currency: 'deltaSkyMiles', mqdsRate: 0.2, note: 'Also earns MQDs toward Diamond' },
    flights_other: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    hotels_direct: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    hotels_chase_travel: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    transit_rideshare: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    wireless: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    office_supplies: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    shipping: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    groceries: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    gas: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    online_shopping: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    entertainment: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    travel_other: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
    other: { rate: 1, currency: 'deltaSkyMiles', mqdsRate: 0.1 },
  },
  chaseSapphireReserve: {
    rent: { rate: 1, currency: 'chaseUR' },
    dining: { rate: 3, currency: 'chaseUR' },
    flights_delta: { rate: 3, currency: 'chaseUR', note: '5x if booked via Chase Travel portal' },
    flights_other: { rate: 3, currency: 'chaseUR', note: '5x if booked via Chase Travel portal' },
    hotels_direct: { rate: 3, currency: 'chaseUR', note: '10x if booked via Chase Travel portal' },
    hotels_chase_travel: { rate: 10, currency: 'chaseUR', note: 'Book via Chase Travel for 10x!' },
    transit_rideshare: { rate: 3, currency: 'chaseUR' },
    wireless: { rate: 1, currency: 'chaseUR' },
    office_supplies: { rate: 1, currency: 'chaseUR' },
    shipping: { rate: 1, currency: 'chaseUR' },
    groceries: { rate: 1, currency: 'chaseUR' },
    gas: { rate: 1, currency: 'chaseUR' },
    online_shopping: { rate: 1, currency: 'chaseUR' },
    entertainment: { rate: 1, currency: 'chaseUR' },
    travel_other: { rate: 3, currency: 'chaseUR' },
    other: { rate: 1, currency: 'chaseUR' },
  },
  biltPalladium: {
    rent: { rate: 1, currency: 'biltPoints', note: 'NO TRANSACTION FEE — unique advantage' },
    dining: { rate: 3, currency: 'biltPoints' },
    flights_delta: { rate: 2, currency: 'biltPoints' },
    flights_other: { rate: 2, currency: 'biltPoints' },
    hotels_direct: { rate: 2, currency: 'biltPoints' },
    hotels_chase_travel: { rate: 1, currency: 'biltPoints' },
    transit_rideshare: { rate: 2, currency: 'biltPoints' },
    wireless: { rate: 1, currency: 'biltPoints' },
    office_supplies: { rate: 1, currency: 'biltPoints' },
    shipping: { rate: 1, currency: 'biltPoints' },
    groceries: { rate: 1, currency: 'biltPoints' },
    gas: { rate: 1, currency: 'biltPoints' },
    online_shopping: { rate: 1, currency: 'biltPoints' },
    entertainment: { rate: 1, currency: 'biltPoints' },
    travel_other: { rate: 2, currency: 'biltPoints' },
    other: { rate: 1, currency: 'biltPoints' },
  },
};

// Program CPP values for scoring (cents per point)
const CPP = {
  amexMR: 2.0,
  chaseUR: 2.0,
  biltPoints: 2.0,
  deltaSkyMiles: 1.2,
  hyattPoints: 1.7,
  marriottBonvoy: 0.8,
  hiltonHonors: 0.5,
  virginAtlantic: 1.8,
};

/**
 * Generate ranked card recommendations for a spend category
 * @param {string} categoryId - The spend category
 * @param {object} priorities - { biltWelcomeComplete, diamondPushActive }
 * @returns {Array} Ranked array of { cardId, earnRate, currency, score, tags, reasoning, note }
 */
export function getSpendRecommendations(categoryId, priorities = {}) {
  const { biltWelcomeComplete = false, diamondPushActive = true } = priorities;

  // Special case: rent is always Bilt
  if (categoryId === 'rent') {
    return [
      {
        cardId: 'biltPalladium',
        earnRate: 1,
        currency: 'biltPoints',
        score: 999,
        tags: ['ALWAYS USE', 'NO FEE'],
        reasoning: 'Bilt is the ONLY card that earns points on rent with zero transaction fees. Every other card typically charges 2.5–3% to pay rent.',
        note: 'Other cards are not listed — using them for rent either charges fees or earns nothing extra.',
      },
    ];
  }

  const results = [];

  for (const [cardId, categories] of Object.entries(EARN_MATRIX)) {
    const cat = categories[categoryId] || categories.other;
    const earnRate = cat.rate;
    const currency = cat.currency;
    const cpp = CPP[currency] || 1;
    const baseScore = earnRate * cpp;

    let score = baseScore;
    const tags = [];
    let reasoning = '';

    // Priority modifiers
    if (!biltWelcomeComplete && cardId === 'biltPalladium') {
      score += 1.5;
      tags.push('PRIORITY: WELCOME BONUS');
      reasoning = `Earning toward $4K welcome bonus. Every dollar spent brings you closer. At ${earnRate}x Bilt points (worth ~${(earnRate * cpp).toFixed(1)}¢/dollar).`;
    } else if (biltWelcomeComplete && diamondPushActive && cardId === 'deltaReservePersonal') {
      score += 0.8;
      tags.push('PRIORITY: DIAMOND MQD');
      reasoning = `Maximizing MQD boost toward Diamond status. Each $10 spent earns 1 MQD + ${earnRate}x Delta miles.`;
    }

    // Category-specific tags
    if (earnRate >= 5) tags.push(`${earnRate}x — EXCELLENT`);
    else if (earnRate >= 3) tags.push(`${earnRate}x — STRONG`);
    else if (earnRate >= 2) tags.push(`${earnRate}x — GOOD`);
    else if (earnRate >= 1.5) tags.push(`${earnRate}x — BONUS`);

    if (categoryId === 'hotels_chase_travel' && cardId === 'chaseSapphireReserve') {
      tags.push('BOOK VIA CHASE TRAVEL');
    }
    if ((categoryId === 'flights_delta' || categoryId === 'flights_other') && cardId === 'amexPlatBiz') {
      tags.push('BOOK DIRECT OR AMEX TRAVEL');
    }

    const mqdsNote = cat.mqdsRate && cardId !== 'amexPlatBiz'
      ? ` + earns ${(cat.mqdsRate * 100).toFixed(0)} MQDs per $10`
      : '';

    if (!reasoning) {
      reasoning = `Earns ${earnRate}x ${currency === 'deltaSkyMiles' ? 'Delta miles' : currency === 'chaseUR' ? 'Chase UR points' : currency === 'amexMR' ? 'Amex MR points' : 'Bilt points'} ≈ ${(earnRate * cpp).toFixed(1)}¢ per dollar${mqdsNote}.`;
    }

    results.push({
      cardId,
      earnRate,
      currency,
      estimatedCpp: earnRate * cpp,
      score,
      tags,
      reasoning,
      note: cat.note || null,
      mqdsRate: cat.mqdsRate || null,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}
