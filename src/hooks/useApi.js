import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { buildCreditStatus } from '../data/creditPatterns.js';

const api = axios.create({ baseURL: '/api' });

const LS_STATE_KEY = 'pd_user_state';

function loadLocalState() {
  try { return JSON.parse(localStorage.getItem(LS_STATE_KEY)); } catch { return null; }
}
function saveLocalState(s) {
  localStorage.setItem(LS_STATE_KEY, JSON.stringify(s));
}

// Migrate old londonTrips singleton → tripGoals array, and add manualSpend if missing
function migrateState(s) {
  if (!s) return s;
  let out = s;
  if (out.londonTrips && !out.tripGoals) {
    const { londonTrips, ...rest } = out;
    out = {
      ...rest,
      tripGoals: [{
        id: 'london',
        name: 'London Upper Class',
        destination: 'LHR',
        people: londonTrips.targetTrips || 2,
        targetTrips: 1,
        milesPerPersonRT: londonTrips.milesPerPersonRT || 150000,
        estimatedTaxesFees: londonTrips.estimatedTaxesFees || 500,
      }],
    };
  }
  if (!out.tripGoals) {
    out = { ...out, tripGoals: getDefaultState().tripGoals };
  }
  if (!out.manualSpend) {
    out = { ...out, manualSpend: getDefaultState().manualSpend };
  }
  return out;
}

export function useUserState() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/state');
      setState(migrateState(data));
      saveLocalState(migrateState(data));
    } catch {
      // Server unavailable — use localStorage or defaults
      const local = loadLocalState();
      setState(local ? migrateState(local) : getDefaultState());
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (updates) => {
    const next = typeof updates === 'function' ? updates(state) : { ...state, ...updates };
    setState(next);
    saveLocalState(next); // Always persist locally
    try { await api.post('/state', next); } catch { /* offline — localStorage saved */ }
  }, [state]);

  useEffect(() => { load(); }, [load]);
  return { state, setState: save, loading, reload: load };
}

const LS_SPEND_KEY = 'pd_spend_stats';

export function useSpendStats() {
  const [stats, setStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_SPEND_KEY)) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/spend-stats')
      .then(r => { setStats(r.data); localStorage.setItem(LS_SPEND_KEY, JSON.stringify(r.data)); })
      .catch(() => setStats(prev => prev || { byCard: {}, biltWelcomeSpend: 0, ytdSpend: {} }))
      .finally(() => setLoading(false));
  }, []);

  return { stats: stats || { byCard: {}, biltWelcomeSpend: 0, ytdSpend: {} }, loading };
}

// localStorage key for manual credit overrides (used when server is unavailable)
const LOCAL_CREDITS_KEY = 'pd_credits_override';

function loadLocalCredits() {
  try { return JSON.parse(localStorage.getItem(LOCAL_CREDITS_KEY) || '{}'); } catch { return {}; }
}
function saveLocalCredits(map) {
  localStorage.setItem(LOCAL_CREDITS_KEY, JSON.stringify(map));
}

export function useCreditStatus() {
  const [credits, setCredits] = useState(() => buildCreditStatus([]));
  const [loading, setLoading] = useState(true);

  const applyLocalOverrides = useCallback((serverCredits) => {
    // serverCredits is either from API or empty — merge with localStorage overrides
    const localOverrides = loadLocalCredits();
    // Rebuild with server data + local overrides
    const base = buildCreditStatus(serverCredits);
    return base.map(c => {
      const key = `${c.id}-${c.period}`;
      if (localOverrides[key] !== undefined) {
        return { ...c, used: localOverrides[key], manuallyMarked: true, detectedViePlaid: false };
      }
      return c;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/credits/status');
      // Server returns already-built credit objects — apply local overrides on top
      const localOverrides = loadLocalCredits();
      const merged = data.map(c => {
        const key = `${c.id}-${c.period}`;
        if (localOverrides[key] !== undefined) {
          return { ...c, used: localOverrides[key], manuallyMarked: true, detectedViePlaid: false };
        }
        return c;
      });
      setCredits(merged);
    } catch {
      // Server not available — use client-side patterns + local overrides
      setCredits(applyLocalOverrides([]));
    } finally {
      setLoading(false);
    }
  }, [applyLocalOverrides]);

  const markUsed = useCallback(async (patternId, period, used) => {
    // Optimistic update
    setCredits(prev => prev.map(c =>
      c.id === patternId && c.period === period
        ? { ...c, used, manuallyMarked: true, detectedViePlaid: false }
        : c
    ));
    // Save to localStorage as backup
    const local = loadLocalCredits();
    const key = `${patternId}-${period}`;
    if (used) { local[key] = true; } else { delete local[key]; }
    saveLocalCredits(local);
    // Try to sync to server
    try {
      await api.post('/credits/mark-used', { patternId, period, used });
    } catch { /* offline — localStorage is the fallback */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { credits, loading, reload: load, markUsed };
}

export function useBalanceHistory(programId) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!programId) return;
    api.get(`/balance-history/${programId}`)
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]));
  }, [programId]);

  return history;
}

export async function recordBalanceSnapshot(programId, balance) {
  try { await api.post('/balance-history', { programId, balance }); } catch { /* offline */ }
}

export function usePlaidItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/plaid/items');
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { items, loading, reload: load };
}

export async function syncPlaid() {
  const { data } = await api.post('/plaid/sync');
  return data;
}

export async function createLinkToken() {
  const { data } = await api.post('/plaid/create-link-token');
  return data.link_token;
}

export async function exchangeToken(publicToken, cardId, institutionName) {
  const { data } = await api.post('/plaid/exchange-token', {
    public_token: publicToken,
    card_id: cardId,
    institution_name: institutionName,
  });
  return data;
}

function getDefaultState() {
  return {
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
    tripGoals: [
      {
        id: 'london',
        name: 'London Upper Class',
        destination: 'LHR',
        people: 2,
        targetTrips: 1,
        milesPerPersonRT: 150000,
        estimatedTaxesFees: 1200,
      },
    ],
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
    transferBonuses: [],
    manualSpend: {
      lastUpdated: null,
      biltWelcomeTotal: 0,
      ytd: {
        amexPlatBiz: 0,
        deltaReserveBusiness: 0,
        deltaReservePersonal: 0,
        chaseSapphireReserve: 0,
        biltPalladium: 0,
      },
    },
  };
}
