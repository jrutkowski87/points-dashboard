import { useEffect } from 'react';

const LS_KEY = 'pd_notified_ids';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadNotified() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

function saveNotified(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

function shouldNotify(key) {
  const notified = loadNotified();
  const last = notified[key];
  return !last || Date.now() - last > COOLDOWN_MS;
}

function markNotified(key) {
  const notified = loadNotified();
  notified[key] = Date.now();
  saveNotified(notified);
}

function fire(title, body) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try { new Notification(title, { body, icon: '/icon-192.png' }); } catch { /* unsupported */ }
}

export function useNotifications({ credits = [], pointsData = {} }) {
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    // 1. Credits expiring ≤ 3 days and unused
    (credits || []).forEach(c => {
      if (!c.used && c.daysUntilReset <= 3) {
        const key = `credit-expiry-${c.id}-${c.period}`;
        if (shouldNotify(key)) {
          fire(
            'Credit expiring soon',
            `${c.description} (${c.card}) resets in ${c.daysUntilReset} day${c.daysUntilReset === 1 ? '' : 's'}`
          );
          markNotified(key);
        }
      }
    });

    // 2. Stale balances > 14 days
    Object.entries(pointsData || {}).forEach(([programId, pState]) => {
      if (!pState.lastUpdated) return;
      const days = Math.floor((Date.now() - new Date(pState.lastUpdated)) / 86400000);
      if (days > 14) {
        const key = `stale-balance-${programId}-week${Math.floor(days / 7)}`;
        if (shouldNotify(key)) {
          fire(
            'Balance may be stale',
            `Your ${programId} balance hasn't been updated in ${days} days`
          );
          markNotified(key);
        }
      }
    });
  }, [credits, pointsData]);
}
