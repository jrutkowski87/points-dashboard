import { useState } from 'react';
import { Settings, CheckCircle, AlertCircle, RefreshCw, ExternalLink, Link2, Zap, Bell } from 'lucide-react';
import { CARDS } from '../data/cards.js';
import { syncPlaid, createLinkToken, exchangeToken } from '../hooks/useApi.js';
import { useToast } from '../components/Toast.jsx';

const PLAID_SCRIPT_URL = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';

export default function ConnectSync({ plaidItems, onReloadPlaid }) {
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);
  const [linkingCard, setLinkingCard] = useState(null);

  const connectedCards = new Set(plaidItems.map(i => i.card_id));

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncPlaid();
      toast(`Synced ${result.results?.length || 0} accounts`, 'success');
      onReloadPlaid();
    } catch {
      toast('Sync failed — check server logs', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = async (card) => {
    setLinkingCard(card.id);
    try {
      const linkToken = await createLinkToken();
      // Load Plaid Link script dynamically
      if (!document.getElementById('plaid-link-script')) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.id = 'plaid-link-script';
          s.src = PLAID_SCRIPT_URL;
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      // eslint-disable-next-line no-undef
      const handler = Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken, metadata) => {
          try {
            await exchangeToken(publicToken, card.id, metadata.institution.name);
            toast(`${card.name} connected via ${metadata.institution.name}!`, 'success');
            onReloadPlaid();
          } catch {
            toast('Failed to exchange token — check server', 'error');
          }
        },
        onExit: (err) => {
          if (err) toast('Plaid connection cancelled', 'info');
        },
      });
      handler.open();
    } catch (err) {
      if (err.response?.data?.error?.includes('not configured')) {
        toast('Add Plaid keys to server/.env first', 'warning');
      } else {
        toast('Failed to start Plaid Link — check server/.env', 'error');
      }
    } finally {
      setLinkingCard(null);
    }
  };

  const notifPermission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  const handleEnableNotifications = () => {
    if (typeof Notification === 'undefined') {
      toast('Notifications not supported in this browser', 'warning');
      return;
    }
    Notification.requestPermission().then(result => {
      if (result === 'granted') toast('Notifications enabled!', 'success');
      else if (result === 'denied') toast('Notifications blocked — check browser settings', 'warning');
    });
  };

  const lastSynced = plaidItems.reduce((latest, i) => {
    if (!i.last_synced) return latest;
    return !latest || i.last_synced > latest ? i.last_synced : latest;
  }, null);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e8eaf0', marginBottom: 4 }}>
          <Settings size={18} style={{ display: 'inline', marginRight: 8, color: '#60a5fa' }} />
          Connect & Sync
        </h2>
        <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>
          Connect your cards via Plaid for automatic spend tracking and statement credit detection
        </div>
      </div>

      {/* Setup instructions */}
      <div className="glass" style={{ padding: 16, marginBottom: 20, borderColor: '#60a5fa44' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa', marginBottom: 8 }}>
          🔧 One-time Plaid Setup (5 minutes)
        </div>
        <ol style={{ color: '#8892b0', fontSize: '0.78rem', lineHeight: 2, paddingLeft: 20 }}>
          <li>Go to <a href="https://dashboard.plaid.com/signup" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>dashboard.plaid.com</a> — create a free developer account</li>
          <li>Under "Keys" → copy your <code style={{ background: '#0c1224', padding: '1px 5px', borderRadius: 3 }}>client_id</code> and <code style={{ background: '#0c1224', padding: '1px 5px', borderRadius: 3 }}>sandbox</code> secret</li>
          <li>Open <code style={{ background: '#0c1224', padding: '1px 5px', borderRadius: 3 }}>server/.env</code> and paste them in</li>
          <li>Restart the server: <code style={{ background: '#0c1224', padding: '1px 5px', borderRadius: 3 }}>npm run dev</code></li>
          <li>Click "Connect" below for each card</li>
        </ol>
        <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#4a5568' }}>
          All data stays on your local machine — Plaid connects via secure OAuth, no credentials are stored here.
        </div>
      </div>

      {/* Sync now */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-label">Connected Cards</div>
          {lastSynced && (
            <div style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 2 }}>
              Last synced: {new Date(lastSynced).toLocaleString()}
            </div>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSync}
          disabled={syncing || plaidItems.length === 0}
          style={{ opacity: plaidItems.length === 0 ? 0.4 : 1 }}
        >
          <RefreshCw size={13} className={syncing ? 'spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync All Now'}
        </button>
      </div>

      {/* Card connect list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CARDS.map(card => {
          const connected = connectedCards.has(card.id);
          const item = plaidItems.find(i => i.card_id === card.id);

          return (
            <div key={card.id} className="glass" style={{ padding: '14px 16px', borderLeft: `3px solid ${connected ? card.color : '#1a2540'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 7, flexShrink: 0,
                  background: `${card.color}${connected ? '33' : '11'}`,
                  border: `1px solid ${card.color}${connected ? '55' : '22'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }}>
                  {connected ? '✓' : ''}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e8eaf0' }}>{card.name}</span>
                    {connected ? (
                      <span className="tag tag-excellent"><CheckCircle size={9} style={{ marginRight: 2 }} /> Connected</span>
                    ) : (
                      <span className="tag tag-info">Not connected</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>
                    {connected
                      ? `via ${item?.institution_name || 'Plaid'} • Last sync: ${item?.last_synced ? new Date(item.last_synced).toLocaleDateString() : 'Never'}`
                      : 'Connect to enable auto spend tracking + credit detection'}
                  </div>
                </div>

                <button
                  className={`btn btn-sm ${connected ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => handleConnect(card)}
                  disabled={linkingCard === card.id}
                >
                  <Link2 size={11} />
                  {linkingCard === card.id ? 'Connecting...' : connected ? 'Reconnect' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notifications */}
      <div className="glass" style={{ padding: 16, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={14} color="#60a5fa" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60a5fa' }}>Browser Notifications</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: notifPermission === 'granted' ? '#4ade80' : notifPermission === 'denied' ? '#f87171' : '#f59e0b' }}>
            {notifPermission === 'granted' ? '✓ Enabled' : notifPermission === 'denied' ? '✗ Blocked' : notifPermission === 'unsupported' ? 'Not supported' : 'Not enabled'}
          </span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#8892b0', marginBottom: 10 }}>
          Get notified about expiring credits (≤3 days), stale balances ({'>'}14 days), and goal milestones.
        </div>
        {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
          <button className="btn btn-primary btn-sm" onClick={handleEnableNotifications}>
            <Bell size={12} /> Enable Notifications
          </button>
        )}
        {notifPermission === 'denied' && (
          <div style={{ marginTop: 8, fontSize: '0.68rem', color: '#4a5568' }}>
            To re-enable: click the lock icon in your browser address bar → Notifications → Allow
          </div>
        )}
      </div>

      {/* What Plaid tracks */}
      <div className="glass" style={{ padding: 16, marginTop: 20 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>What Auto-Syncs via Plaid</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {[
            { icon: '📊', title: 'Bilt $4K welcome spend', desc: 'Total card spend toward welcome bonus' },
            { icon: '✈️', title: 'Delta MQD card spend', desc: 'Delta Reserve Personal/Business YTD spend for MQD math' },
            { icon: '🔍', title: 'Statement credit detection', desc: 'Resy $20, Chase $300 travel, and more auto-detected' },
            { icon: '💰', title: 'Points earned estimate', desc: 'Estimated points earned per card based on transactions' },
            { icon: '🏷️', title: 'Spend category breakdown', desc: 'See where you\'re spending on each card' },
            { icon: '🔄', title: 'Nightly auto-refresh', desc: 'Transactions update automatically at 2am' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#0c1224', borderRadius: 8, border: '1px solid #1a2540' }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e8eaf0', marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: '0.68rem', color: '#4a5568' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loyalty quick-sync reminder */}
      <div className="glass" style={{ padding: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Zap size={14} color="#f59e0b" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>Loyalty Program Balances</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#8892b0', marginBottom: 10 }}>
          Loyalty program balances (SkyMiles, Chase UR, Hyatt, etc.) must be updated manually — no public API exists.
          Use the Quick Sync buttons in Points & Miles to open each program directly and paste your balance in ~5 minutes.
        </div>
        <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>
          Tip: Stale balances turn yellow after 7 days and red after 30 days as a reminder.
        </div>
      </div>
    </div>
  );
}
