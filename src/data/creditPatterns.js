// Client-side credit pattern definitions — used for display, countdown logic, and fallback
// The server adds `used: true` and `detectedViePlaid: true` when statement credits are detected

const CREDIT_PATTERNS = [

  // ─── MONTHLY ──────────────────────────────────────────────────────────────

  // Delta Reserve Personal
  {
    id: 'resy_personal',
    label: 'Resy Dining Credit',
    card: 'deltaReservePersonal',
    type: 'monthly',
    maxAmount: 20,
    resetDay: 1,
    description: '$20/month toward Resy restaurant reservations',
    category: 'dining',
    note: 'Use on Resy app or resy.com at eligible U.S. restaurants. Enrollment required.',
  },
  {
    id: 'rideshare_personal',
    label: 'Rideshare Credit',
    card: 'deltaReservePersonal',
    type: 'monthly',
    maxAmount: 10,
    resetDay: 1,
    description: '$10/month on U.S. rideshare — Uber, Lyft, Curb, Revel, Alto',
    category: 'rideshare',
    note: 'Enrollment required. Applies to rideshare only, not Uber Eats.',
  },
  {
    id: 'uber_one_personal',
    label: 'Uber One Membership Credit',
    card: 'deltaReservePersonal',
    type: 'monthly',
    maxAmount: 9.99,
    resetDay: 1,
    description: 'Up to $9.99/month for Uber One monthly membership (limited offer through Jun 25, 2026)',
    category: 'rideshare',
    note: 'Must use monthly plan — not annual. Limited to 12 consecutive months. Offer expires June 25, 2026.',
  },

  // Delta Reserve Business
  {
    id: 'resy_business',
    label: 'Resy Dining Credit',
    card: 'deltaReserveBusiness',
    type: 'monthly',
    maxAmount: 20,
    resetDay: 1,
    description: '$20/month toward Resy restaurant reservations',
    category: 'dining',
    note: 'Combined with personal card = $480/year in Resy credits. Enrollment required.',
  },
  {
    id: 'rideshare_business',
    label: 'Rideshare Credit',
    card: 'deltaReserveBusiness',
    type: 'monthly',
    maxAmount: 10,
    resetDay: 1,
    description: '$10/month on U.S. rideshare — Uber, Lyft, Curb, Revel, Alto',
    category: 'rideshare',
    note: 'Enrollment required.',
  },
  {
    id: 'uber_one_business',
    label: 'Uber One Membership Credit',
    card: 'deltaReserveBusiness',
    type: 'monthly',
    maxAmount: 9.99,
    resetDay: 1,
    description: 'Up to $9.99/month for Uber One monthly membership (limited offer through Jun 25, 2026)',
    category: 'rideshare',
    note: 'Must use monthly plan — not annual. Offer expires June 25, 2026.',
  },

  // Amex Business Platinum
  {
    id: 'wireless_amexplat',
    label: 'Wireless Credit',
    card: 'amexPlatBiz',
    type: 'monthly',
    maxAmount: 10,
    resetDay: 1,
    description: '$10/month toward U.S. wireless phone service providers',
    category: 'wireless',
    note: 'Must be billed directly by wireless provider. Enrollment required.',
  },

  // Chase Sapphire Reserve
  {
    id: 'csr_lyft',
    label: 'Lyft Credit',
    card: 'chaseSapphireReserve',
    type: 'monthly',
    maxAmount: 10,
    resetDay: 1,
    description: '$10/month in-app Lyft credit (valid through Sep 30, 2027)',
    category: 'rideshare',
    note: 'Activation required in the Lyft app. Also earns 5x points on Lyft.',
  },
  {
    id: 'csr_peloton',
    label: 'Peloton Credit',
    card: 'chaseSapphireReserve',
    type: 'monthly',
    maxAmount: 10,
    resetDay: 1,
    description: 'Up to $10/month on eligible Peloton memberships (valid through Dec 31, 2027)',
    category: 'fitness',
    note: 'Covers All-Access, App One, App+, Guide, Strength+, Rental. Activation required. Also earns 10x points on Peloton hardware.',
  },
  {
    id: 'csr_doordash',
    label: 'DoorDash Credit',
    card: 'chaseSapphireReserve',
    type: 'monthly',
    maxAmount: 25,
    resetDay: 1,
    description: 'Up to $25/month: $5 off restaurant orders + $10 off two grocery/retail orders (valid through Dec 31, 2027)',
    category: 'dining',
    note: 'Includes complimentary DashPass. Activation required. Grocery credits: $10 off each of 2 orders/month.',
  },

  // Bilt Palladium — monthly Bilt Cash allowances
  {
    id: 'bilt_fitness',
    label: 'Fitness Credit',
    card: 'biltPalladium',
    type: 'monthly',
    maxAmount: 40,
    resetDay: 1,
    description: 'Up to $40/month in Bilt Cash toward fitness classes (SoulCycle, Barry\'s, and Bilt fitness network)',
    category: 'fitness',
    note: 'Bilt Cash — must redeem in Bilt app. Unused monthly allowance does not roll over.',
  },
  {
    id: 'bilt_dining',
    label: 'Bilt Dining Credit',
    card: 'biltPalladium',
    type: 'monthly',
    maxAmount: 25,
    resetDay: 1,
    description: 'Up to $25/month in Bilt Cash via Bilt Dining mobile checkout (1 visit per month)',
    category: 'dining',
    note: 'Bilt Cash — must pay via Bilt app at participating restaurants. One use per month.',
  },


  // ─── QUARTERLY ────────────────────────────────────────────────────────────

  // Amex Business Platinum — Indeed
  {
    id: 'indeed_q1',
    label: 'Indeed Recruiting Credit (Q1)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    maxAmount: 90,
    quarter: 1,
    description: '$90 (Jan–Mar) toward Indeed recruiting services',
    category: 'business',
    note: 'Enrollment required. Use on Indeed job postings, sponsored jobs, etc.',
  },
  {
    id: 'indeed_q2',
    label: 'Indeed Recruiting Credit (Q2)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    maxAmount: 90,
    quarter: 2,
    description: '$90 (Apr–Jun) toward Indeed recruiting services',
    category: 'business',
  },
  {
    id: 'indeed_q3',
    label: 'Indeed Recruiting Credit (Q3)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    maxAmount: 90,
    quarter: 3,
    description: '$90 (Jul–Sep) toward Indeed recruiting services',
    category: 'business',
  },
  {
    id: 'indeed_q4',
    label: 'Indeed Recruiting Credit (Q4)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    maxAmount: 90,
    quarter: 4,
    description: '$90 (Oct–Dec) toward Indeed recruiting services',
    category: 'business',
  },

  // Amex Business Platinum — Hilton
  {
    id: 'hilton_q1',
    label: 'Hilton Credit (Q1)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    maxAmount: 50,
    quarter: 1,
    description: '$50 (Jan–Mar) on eligible direct Hilton purchases (rooms, dining, spa, gift cards)',
    category: 'hotel',
    note: 'Must charge directly to a Hilton property or buy Hilton gift cards. Enrollment + Hilton for Business enrollment required.',
  },
  {
    id: 'hilton_q2',
    label: 'Hilton Credit (Q2)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    maxAmount: 50,
    quarter: 2,
    description: '$50 (Apr–Jun) on eligible direct Hilton purchases',
    category: 'hotel',
  },
  {
    id: 'hilton_q3',
    label: 'Hilton Credit (Q3)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    maxAmount: 50,
    quarter: 3,
    description: '$50 (Jul–Sep) on eligible direct Hilton purchases',
    category: 'hotel',
  },
  {
    id: 'hilton_q4',
    label: 'Hilton Credit (Q4)',
    card: 'amexPlatBiz',
    type: 'quarterly',
    maxAmount: 50,
    quarter: 4,
    description: '$50 (Oct–Dec) on eligible direct Hilton purchases',
    category: 'hotel',
  },


  // ─── SEMI-ANNUAL ──────────────────────────────────────────────────────────

  // Amex Business Platinum — Fine Hotels + Resorts / Hotel Collection
  {
    id: 'fhr_hotel_h1',
    label: 'Fine Hotels + Resorts Credit (Jan–Jun)',
    card: 'amexPlatBiz',
    type: 'semi-annual',
    maxAmount: 300,
    period: 'H1',
    description: '$300 (Jan 1–Jun 30) on prepaid Fine Hotels+Resorts or The Hotel Collection bookings via AmexTravel.com',
    category: 'hotel',
    note: 'FHR: no minimum stay. Hotel Collection: 2-night minimum. Book through amextravel.com only. Enrollment required.',
  },
  {
    id: 'fhr_hotel_h2',
    label: 'Fine Hotels + Resorts Credit (Jul–Dec)',
    card: 'amexPlatBiz',
    type: 'semi-annual',
    maxAmount: 300,
    period: 'H2',
    description: '$300 (Jul 1–Dec 31) on prepaid Fine Hotels+Resorts or The Hotel Collection bookings via AmexTravel.com',
    category: 'hotel',
    note: 'FHR: no minimum stay. Hotel Collection: 2-night minimum.',
  },

  // Chase Sapphire Reserve — The Edit Hotel Credit
  {
    id: 'csr_edit_hotel_h1',
    label: 'The Edit Hotel Credit (Jan–Jun)',
    card: 'chaseSapphireReserve',
    type: 'semi-annual',
    maxAmount: 250,
    period: 'H1',
    description: '$250 (Jan 1–Jun 30) on prepaid stays at The Edit by Chase Travel hotels',
    category: 'hotel',
    note: '2-night minimum stay required. Book through Chase Travel. Purchases at The Edit do NOT earn Chase points.',
  },
  {
    id: 'csr_edit_hotel_h2',
    label: 'The Edit Hotel Credit (Jul–Dec)',
    card: 'chaseSapphireReserve',
    type: 'semi-annual',
    maxAmount: 250,
    period: 'H2',
    description: '$250 (Jul 1–Dec 31) on prepaid stays at The Edit by Chase Travel hotels',
    category: 'hotel',
    note: '2-night minimum stay required. Book through Chase Travel.',
  },

  // Chase Sapphire Reserve — Exclusive Tables Dining
  {
    id: 'csr_dining_h1',
    label: 'Exclusive Tables Dining Credit (Jan–Jun)',
    card: 'chaseSapphireReserve',
    type: 'semi-annual',
    maxAmount: 150,
    period: 'H1',
    description: '$150 (Jan 1–Jun 30) on dining via Chase Sapphire Reserve Exclusive Tables on OpenTable',
    category: 'dining',
    note: 'Must book through Exclusive Tables program on Chase Travel portal (select partner restaurants). Limited to certain cities.',
  },
  {
    id: 'csr_dining_h2',
    label: 'Exclusive Tables Dining Credit (Jul–Dec)',
    card: 'chaseSapphireReserve',
    type: 'semi-annual',
    maxAmount: 150,
    period: 'H2',
    description: '$150 (Jul 1–Dec 31) on dining via Chase Sapphire Reserve Exclusive Tables on OpenTable',
    category: 'dining',
  },

  // Chase Sapphire Reserve — StubHub / Viagogo
  {
    id: 'csr_stubhub_h1',
    label: 'StubHub / Viagogo Credit (Jan–Jun)',
    card: 'chaseSapphireReserve',
    type: 'semi-annual',
    maxAmount: 150,
    period: 'H1',
    description: '$150 (Jan 1–Jun 30) on ticket purchases at StubHub or Viagogo (valid through Dec 31, 2027)',
    category: 'entertainment',
    note: 'Activation required. Valid on stubhub.com or viagogo.com.',
  },
  {
    id: 'csr_stubhub_h2',
    label: 'StubHub / Viagogo Credit (Jul–Dec)',
    card: 'chaseSapphireReserve',
    type: 'semi-annual',
    maxAmount: 150,
    period: 'H2',
    description: '$150 (Jul 1–Dec 31) on ticket purchases at StubHub or Viagogo',
    category: 'entertainment',
  },

  // Bilt Palladium — Hotel Credit
  {
    id: 'bilt_hotel_h1',
    label: 'Bilt Hotel Credit (Jan–Jun)',
    card: 'biltPalladium',
    type: 'semi-annual',
    maxAmount: 200,
    period: 'H1',
    description: '$200 (Jan 1–Jun 30) on hotel bookings of 2+ nights through Bilt Travel portal',
    category: 'hotel',
    note: 'Statement credit (not Bilt Cash). 2-night minimum stay. Book through Bilt Travel portal.',
  },
  {
    id: 'bilt_hotel_h2',
    label: 'Bilt Hotel Credit (Jul–Dec)',
    card: 'biltPalladium',
    type: 'semi-annual',
    maxAmount: 200,
    period: 'H2',
    description: '$200 (Jul 1–Dec 31) on hotel bookings of 2+ nights through Bilt Travel portal',
    category: 'hotel',
    note: '2-night minimum. Book through Bilt Travel portal.',
  },


  // ─── ANNUAL ───────────────────────────────────────────────────────────────

  // Chase Sapphire Reserve
  {
    id: 'chase_travel_300',
    label: '$300 Travel Credit',
    card: 'chaseSapphireReserve',
    type: 'annual',
    maxAmount: 300,
    description: '$300/year auto-applied to virtually any travel purchase (flights, hotels, Uber, parking, tolls, transit, car rental, cruises)',
    category: 'travel',
    isAutoApplied: true,
    note: 'Extremely broad definition of travel — posts automatically. No action needed.',
  },
  {
    id: 'csr_hotel_2026',
    label: 'Select Chase Travel Hotels Credit (2026)',
    card: 'chaseSapphireReserve',
    type: 'annual',
    maxAmount: 250,
    description: '$250 in 2026 on prepaid Chase Travel hotels: IHG, Montage, Pendry, Omni, Virgin Hotels, Minor Hotels, Pan Pacific (2026 only)',
    category: 'hotel',
    note: '2026-only benefit. 2-night minimum stay. Book through Chase Travel portal.',
  },

  // Delta Reserve Personal
  {
    id: 'delta_stays_personal',
    label: 'Delta Stays Credit',
    card: 'deltaReservePersonal',
    type: 'annual',
    maxAmount: 200,
    description: '$200/year on prepaid hotels or vacation rentals booked through Delta Stays (delta.com/stays)',
    category: 'hotel',
    note: 'No minimum stay required. Must be prepaid (not pay-at-hotel). Resets calendar year.',
  },

  // Delta Reserve Business
  {
    id: 'delta_stays_business',
    label: 'Delta Stays Credit',
    card: 'deltaReserveBusiness',
    type: 'annual',
    maxAmount: 250,
    description: '$250/year on prepaid hotels or vacation rentals booked through Delta Stays (delta.com/stays)',
    category: 'hotel',
    note: 'No minimum stay required. Must be prepaid. Resets calendar year. $50 more than personal card.',
  },

  // Amex Business Platinum
  {
    id: 'airline_fee_200',
    label: 'Airline Fee Credit',
    card: 'amexPlatBiz',
    type: 'annual',
    maxAmount: 200,
    description: '$200/year toward incidental airline fees on one selected U.S. airline',
    category: 'travel',
    note: 'Select your airline in Amex account each January. Covers bags, seat upgrades, in-flight purchases, lounge day passes. Does NOT cover airfare.',
  },
  {
    id: 'clear_annual',
    label: 'CLEAR Plus Credit',
    card: 'amexPlatBiz',
    type: 'annual',
    maxAmount: 209,
    description: '$209/year toward CLEAR Plus biometric security membership (excludes taxes/fees)',
    category: 'travel',
    note: 'Enrollment required. Covers full CLEAR Plus membership cost.',
  },
  {
    id: 'adobe_annual',
    label: 'Adobe Credit',
    card: 'amexPlatBiz',
    type: 'annual',
    maxAmount: 250,
    description: '$250/year after spending $600+ directly with Adobe (Creative Cloud, Acrobat, etc.)',
    category: 'business',
    note: 'Enrollment required. Spend $600+ at Adobe to trigger the $250 credit.',
  },
  {
    id: 'dell_annual',
    label: 'Dell Credit',
    card: 'amexPlatBiz',
    type: 'annual',
    maxAmount: 150,
    description: '$150/year on U.S. Dell.com purchases (hardware, electronics, software)',
    category: 'tech',
    note: 'Enrollment required. Applies to dell.com purchases.',
  },
  {
    id: 'dell_milestone',
    label: 'Dell Milestone Credit ($1,000)',
    card: 'amexPlatBiz',
    type: 'annual',
    maxAmount: 1000,
    description: '$1,000 additional Dell credit — unlocked after $5,000 in total card purchases',
    category: 'tech',
    note: 'Enrollment required. Triggered by $5K in total card spend (not Dell-specific). Use at dell.com after milestone is hit.',
  },

  // Bilt Palladium
  {
    id: 'bilt_cash_annual',
    label: 'Annual Bilt Cash',
    card: 'biltPalladium',
    type: 'annual',
    maxAmount: 200,
    description: '$200 Bilt Cash credited to your Bilt account each January 1',
    category: 'general',
    note: 'Bilt Cash (not a statement credit). Credits to Bilt wallet automatically. Use before Dec 31 — amounts over $100 expire at year-end.',
  },

  // Companion Certificates
  {
    id: 'companion_cert_personal',
    label: 'Companion Certificate',
    card: 'deltaReservePersonal',
    type: 'annual',
    maxAmount: null,
    description: 'Annual companion certificate for domestic/Caribbean round-trip (First, Comfort+, or Main Cabin)',
    category: 'travel',
    isPerk: true,
    note: 'Earned after card anniversary. Taxes/fees up to ~$250. Book any domestic or Caribbean first class — companion flies free.',
  },
  {
    id: 'companion_cert_business',
    label: 'Companion Certificate',
    card: 'deltaReserveBusiness',
    type: 'annual',
    maxAmount: null,
    description: 'Annual companion certificate for domestic/Caribbean round-trip (First, Comfort+, or Main Cabin)',
    category: 'travel',
    isPerk: true,
    note: 'Taxes/fees capped at $80 on Business card (better than personal). Earned after anniversary.',
  },

  // Global Entry / TSA PreCheck
  {
    id: 'global_entry_csr',
    label: 'Global Entry / TSA PreCheck',
    card: 'chaseSapphireReserve',
    type: 'annual',
    maxAmount: 120,
    cadence: 'every 4 years',
    description: '$120 toward Global Entry (or $85 toward TSA PreCheck/NEXUS) — every 4 years',
    category: 'travel',
    note: 'Auto-applies when you charge the application fee to this card. Can be used for any authorized user.',
  },
  {
    id: 'global_entry_amexplat',
    label: 'Global Entry / TSA PreCheck',
    card: 'amexPlatBiz',
    type: 'annual',
    maxAmount: 120,
    cadence: 'every 4.5 years',
    description: '$120 toward Global Entry (or $85 toward TSA PreCheck) — every 4 years',
    category: 'travel',
    note: 'Auto-applies when you charge the application fee to this card.',
  },
  {
    id: 'global_entry_delta_personal',
    label: 'Global Entry / TSA PreCheck',
    card: 'deltaReservePersonal',
    type: 'annual',
    maxAmount: 120,
    cadence: 'every 4 years',
    description: '$120 toward Global Entry (or $85 toward TSA PreCheck) — every 4 years',
    category: 'travel',
    note: 'Auto-applies when you charge the application fee to this card.',
  },
  {
    id: 'global_entry_delta_business',
    label: 'Global Entry / TSA PreCheck',
    card: 'deltaReserveBusiness',
    type: 'annual',
    maxAmount: 120,
    cadence: 'every 4 years',
    description: '$120 toward Global Entry (or $85 toward TSA PreCheck) — every 4 years',
    category: 'travel',
    note: 'Auto-applies when you charge the application fee to this card.',
  },

];

// Get current period key for a given pattern
function getPeriodKey(pattern, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  switch (pattern.type) {
    case 'monthly':
    case 'configurable':
      return `${year}-${String(month).padStart(2, '0')}`;
    case 'quarterly':
      return `${year}-Q${quarter}`;
    case 'semi-annual':
      return month <= 6 ? `${year}-H1` : `${year}-H2`;
    case 'annual':
    default:
      return `${year}`;
  }
}

// Get days until this credit resets
function getDaysUntilReset(pattern, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  switch (pattern.type) {
    case 'monthly':
    case 'configurable': {
      const nextReset = new Date(year, month + 1, 1);
      return Math.ceil((nextReset - date) / 86400000);
    }
    case 'quarterly': {
      const nextQuarterMonth = Math.ceil((month + 1) / 3) * 3;
      const nextReset = new Date(year, nextQuarterMonth, 1);
      return Math.ceil((nextReset - date) / 86400000);
    }
    case 'semi-annual': {
      const nextReset = month < 6 ? new Date(year, 6, 1) : new Date(year + 1, 0, 1);
      return Math.ceil((nextReset - date) / 86400000);
    }
    case 'annual':
    default: {
      const nextReset = new Date(year + 1, 0, 1);
      return Math.ceil((nextReset - date) / 86400000);
    }
  }
}

// Filter to only current-period credits (e.g., only show Q2 credits in Q2)
function isCurrentPeriod(pattern, date = new Date()) {
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  if (pattern.type === 'quarterly' && pattern.quarter !== quarter) return false;
  if (pattern.type === 'semi-annual') {
    if (pattern.period === 'H1' && month > 6) return false;
    if (pattern.period === 'H2' && month <= 6) return false;
  }
  return true;
}

// Build full credit status from patterns + server detection data
export function buildCreditStatus(serverData = []) {
  const now = new Date();
  const serverMap = new Map(serverData.map(d => [`${d.credit_pattern_id}-${d.period}`, d]));

  return CREDIT_PATTERNS
    .filter(p => isCurrentPeriod(p, now))
    .map(pattern => {
      const period = getPeriodKey(pattern, now);
      const daysUntilReset = getDaysUntilReset(pattern, now);
      const serverRecord = serverMap.get(`${pattern.id}-${period}`);

      return {
        ...pattern,
        period,
        daysUntilReset,
        used: !!serverRecord,
        usedAmount: serverRecord?.amount || null,
        detectedViePlaid: !!serverRecord && !serverRecord.manually_overridden,
        manuallyMarked: !!serverRecord && !!serverRecord.manually_overridden,
      };
    });
}
