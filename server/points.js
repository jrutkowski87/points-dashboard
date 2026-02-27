// Estimate points earned from Plaid transaction data based on card earn rates
// This is an approximation — actual points depend on Amex/Chase's internal categorization

// Plaid category → our spend category mapping
// More specific prefixes must come before less specific ones
const CATEGORY_MAP = {
  // Dining
  'Food and Drink > Restaurants': 'dining',
  'Food and Drink > Coffee Shop': 'dining',
  'Food and Drink > Bar': 'dining',
  'Food and Drink > Fast Food': 'dining',
  'Food and Drink > Food Truck': 'dining',
  'Food and Drink > Bakeries': 'dining',
  'Food and Drink > Catering Services': 'dining',
  'Food and Drink > Breweries': 'dining',
  'Food and Drink > Distilleries': 'dining',
  'Food and Drink > Delis': 'dining',
  'Food and Drink > Juice Bar': 'dining',
  'Food and Drink': 'dining',

  // Airlines
  'Travel > Airlines and Aviation Services': 'flights_other',
  'Travel > Delta Air Lines': 'flights_delta',

  // Ground transit
  'Travel > Car Service': 'transit',
  'Travel > Taxi': 'transit',
  'Travel > Ride Share': 'transit',
  'Travel > Limousine Service': 'transit',
  'Travel > Public Transportation Services': 'transit',
  'Travel > Subway': 'transit',
  'Travel > Railroad': 'transit',
  'Travel > Bus Lines': 'transit',
  'Travel > Boat': 'transit',
  'Travel > Ferry': 'transit',

  // Gas
  'Travel > Gas Stations': 'gas',

  // Hotels
  'Travel > Lodging > Hotels and Motels': 'hotels',
  'Travel > Lodging > Resorts': 'hotels',
  'Travel > Lodging > Vacation Rentals': 'hotels',
  'Travel > Lodging': 'hotels',

  // Travel catch-all
  'Travel > Car Rental': 'travel_other',
  'Travel > Parking': 'travel_other',
  'Travel > Tolls and Fees': 'travel_other',
  'Travel > Currency Exchange': 'travel_other',
  'Travel > Cruise Lines': 'travel_other',
  'Travel > Tours': 'travel_other',
  'Travel': 'travel_other',

  // Office / Business
  'Shops > Computers and Electronics': 'office_electronics',
  'Shops > Office Supplies': 'office_supplies',
  'Shops > Telecommunication Services': 'wireless',
  'Service > Telecommunication Services': 'wireless',
  'Service > Internet Services': 'wireless',
  'Service > Shipping and Freight': 'shipping',
  'Service > Printing and Publishing': 'office_supplies',
  'Service > Computer Repair': 'office_electronics',
  'Shops > Technology': 'office_electronics',

  // Rent
  'Transfer > Rent': 'rent',
  'Transfer > Third Party': 'rent',  // Bilt Rent via payment processor

  // Utilities (some cards give category credit)
  'Service > Utilities': 'other',

  // Default catch-alls for major categories
  'Shops': 'other',
  'Service': 'other',
  'Recreation': 'other',
  'Healthcare': 'other',
  'Education': 'other',
  'Personal Finance': 'other',
  'Community': 'other',
};

// Card earn rates by spend category (points per dollar)
export const EARN_RATES = {
  amexPlatBiz: {
    flights_direct: 5,    // direct with airline
    flights_amex_travel: 5,
    hotels_amex_travel: 5,
    office_electronics: 1.5,
    office_supplies: 1.5,
    wireless: 1.5,
    shipping: 1.5,
    dining: 1,
    travel_other: 1,
    hotels: 1,
    transit: 1,
    gas: 1,
    rent: 1,
    other: 1,
    pointCurrency: 'amexMR',
  },
  deltaReserveBusiness: {
    flights_delta: 3,
    transit: 1.5,
    shipping: 1.5,
    wireless: 1.5,
    office_supplies: 1.5,
    dining: 1,
    flights_other: 1,
    hotels: 1,
    travel_other: 1,
    gas: 1,
    rent: 1,
    other: 1,
    pointCurrency: 'deltaSkyMiles',
    earnsMQD: true,
    mqdsPerDollar: 0.1, // 1 MQD per $10
    mqdsPerDollarDelta: 0.2, // higher on Delta purchases
    mqdsCapPerYear: 15000,
  },
  deltaReservePersonal: {
    flights_delta: 3,
    dining: 2,
    hotels: 1,
    flights_other: 1,
    travel_other: 1,
    transit: 1,
    gas: 1,
    rent: 1,
    shipping: 1,
    wireless: 1,
    other: 1,
    pointCurrency: 'deltaSkyMiles',
    earnsMQD: true,
    mqdsPerDollar: 0.1,
    mqdsPerDollarDelta: 0.2,
    mqdsCapPerYear: 15000,
  },
  chaseSapphireReserve: {
    hotels_chase_travel: 10,
    car_rental_chase: 10,
    flights_chase_travel: 5,
    dining: 3,
    travel_other: 3,
    transit: 3,
    hotels: 3,
    flights_other: 3,
    gas: 1,
    rent: 1,
    shipping: 1,
    other: 1,
    pointCurrency: 'chaseUR',
  },
  biltPalladium: {
    dining: 3,
    travel_other: 2,
    flights_other: 2,
    hotels: 2,
    transit: 2,
    rent: 1,     // no transaction fee — key differentiator
    gas: 1,
    shipping: 1,
    wireless: 1,
    other: 1,
    pointCurrency: 'biltPoints',
  },
};

export function plaidCategoryToSpend(plaidCategory) {
  if (!plaidCategory) return 'other';
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (plaidCategory.startsWith(key)) return val;
  }
  return 'other';
}

function estimatePointsFromTransaction(txn) {
  if (txn.amount <= 0) return null; // skip credits
  if (!txn.card_id || !EARN_RATES[txn.card_id]) return null;

  const rates = EARN_RATES[txn.card_id];
  const category = plaidCategoryToSpend(txn.category);
  const earnRate = rates[category] || rates.other || 1;
  const points = Math.floor(txn.amount * earnRate);
  const currency = rates.pointCurrency;

  return { points, currency, earnRate, category };
}

export function calcCardSpendStats(transactions) {
  const stats = {};

  for (const txn of transactions) {
    if (!txn.card_id || txn.amount <= 0 || txn.pending) continue;
    if (!stats[txn.card_id]) {
      stats[txn.card_id] = {
        totalSpend: 0,
        estimatedPoints: 0,
        estimatedMQDs: 0,
        byCategory: {},
      };
    }

    const s = stats[txn.card_id];
    s.totalSpend += txn.amount;

    const pointsInfo = estimatePointsFromTransaction(txn);
    if (pointsInfo) {
      s.estimatedPoints += pointsInfo.points;
      s.byCategory[pointsInfo.category] = (s.byCategory[pointsInfo.category] || 0) + txn.amount;
    }

    // MQD calculation for Delta Reserve cards
    const rates = EARN_RATES[txn.card_id];
    if (rates?.earnsMQD) {
      const isDelta = /delta/i.test(txn.merchant_name || '');
      const mqdsPerDollar = isDelta ? rates.mqdsPerDollarDelta : rates.mqdsPerDollar;
      s.estimatedMQDs += txn.amount * mqdsPerDollar;
    }
  }

  // Cap MQDs at annual limit per card
  for (const cardId of Object.keys(stats)) {
    const rates = EARN_RATES[cardId];
    if (rates?.mqdsCapPerYear) {
      stats[cardId].estimatedMQDs = Math.min(stats[cardId].estimatedMQDs, rates.mqdsCapPerYear);
    }
  }

  return stats;
}
