import { useMemo } from 'react';
import { CheckCircle, Clock, AlertTriangle, Info, Zap } from 'lucide-react';
import { CARDS } from '../data/cards.js';
import { CardLogo } from '../components/Logos.jsx';
import { useToast } from '../components/Toast.jsx';

function urgencyClass(daysLeft, used) {
  if (used) return '';
  if (daysLeft <= 3) return 'credit-urgent';
  if (daysLeft <= 7) return 'credit-warning';
  return '';
}

function urgencyColor(daysLeft, used) {
  if (used) return '#253560';
  if (daysLeft <= 3) return '#ef4444';
  if (daysLeft <= 7) return '#f59e0b';
  return '#253560';
}

function fmtMoney(n) {
  const rounded = Math.round(n * 100) / 100;
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
}

function daysLabel(days) {
  if (days === 0) return 'Resets today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

function UrgencyBadge({ days, used, detectedViePlaid }) {
  if (used) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <CheckCircle size={13} color="#4ade80" />
        <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 600 }}>
          {detectedViePlaid ? 'Auto-detected ✓' : 'Used ✓'}
        </span>
      </div>
    );
  }
  if (days <= 3) {
    return (
      <div className="pulse-red" style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 4, padding: '2px 6px', background: 'rgba(239,68,68,0.1)' }}>
        <AlertTriangle size={11} color="#ef4444" />
        <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700 }}>{daysLabel(days)}</span>
      </div>
    );
  }
  if (days <= 7) {
    return (
      <div className="pulse-amber" style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 4, padding: '2px 6px', background: 'rgba(245,158,11,0.1)' }}>
        <Clock size={11} color="#f59e0b" />
        <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>{daysLabel(days)}</span>
      </div>
    );
  }
  return <span style={{ fontSize: '0.68rem', color: '#4a5568' }}>{daysLabel(days)}</span>;
}

function CreditCard({ credit, onToggle }) {
  return (
    <div
      className={`glass glass-hover ${urgencyClass(credit.daysUntilReset, credit.used)}`}
      style={{ padding: '12px 14px', borderLeft: `3px solid ${urgencyColor(credit.daysUntilReset, credit.used)}`, opacity: credit.used ? 0.65 : 1 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: credit.used ? '#4a5568' : '#e8eaf0' }}>
              {credit.label}
            </span>
            <span className="tag tag-info" style={{ fontSize: '0.6rem' }}>
              {credit.type === 'monthly' || credit.type === 'configurable' ? 'Monthly' : credit.type === 'quarterly' ? 'Quarterly' : credit.type === 'semi-annual' ? 'Semi-annual' : 'Annual'}
            </span>
            {credit.detectedViePlaid && <span className="tag tag-plaid">Auto-detected</span>}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#4a5568', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CardLogo cardId={credit.card} size="xs" />
            <span>{credit.description}</span>
          </div>
          {credit.note && (
            <div style={{ fontSize: '0.68rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Info size={10} />{credit.note}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div className="med-num" style={{ color: credit.used ? '#4a5568' : '#4ade80' }}>
            {credit.maxAmount != null ? `$${credit.maxAmount}` : 'Perk'}
          </div>
          <UrgencyBadge days={credit.daysUntilReset} used={credit.used} detectedViePlaid={credit.detectedViePlaid} />
          <button
            className={`btn btn-sm ${credit.used ? 'btn-ghost' : 'btn-success'}`}
            onClick={() => onToggle(credit)}
          >
            {credit.used ? 'Mark Unused' : '✓ Mark Used'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressCredit({ credit, usedAmount }) {
  const pct = Math.min(100, ((usedAmount || 0) / credit.maxAmount) * 100);
  const remaining = Math.max(0, credit.maxAmount - (usedAmount || 0));

  return (
    <div className="glass" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e8eaf0' }}>{credit.label}</div>
          <div style={{ fontSize: '0.7rem', color: '#4a5568', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CardLogo cardId={credit.card} size="xs" />
            <span>{credit.description}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
            <span className="mono" style={{ color: '#4ade80' }}>${usedAmount?.toFixed(0) || 0}</span>
            <span style={{ color: '#4a5568' }}> / </span>
            <span className="mono" style={{ color: '#e8eaf0' }}>${credit.maxAmount}</span>
          </div>
          {remaining > 0 && (
            <div style={{ fontSize: '0.68rem', color: '#f59e0b' }}>
              ${remaining.toFixed(0)} remaining
            </div>
          )}
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{
          width: `${pct}%`,
          background: pct >= 100 ? 'linear-gradient(90deg, #4ade80, #22c55e)' : 'linear-gradient(90deg, #60a5fa, #3b82f6)',
        }} />
      </div>
      {credit.isAutoApplied && (
        <div style={{ fontSize: '0.68rem', color: '#60a5fa', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={10} /> Auto-detected via Plaid when travel purchases are credited back
        </div>
      )}
    </div>
  );
}

export default function CreditTracker({ credits, userState, onToggleCredit }) {
  const toast = useToast();

  const monthly = useMemo(() => (credits || []).filter(c => c.type === 'monthly' || c.type === 'configurable'), [credits]);
  const quarterly = useMemo(() => (credits || []).filter(c => c.type === 'quarterly'), [credits]);
  const semiAnnual = useMemo(() => (credits || []).filter(c => c.type === 'semi-annual'), [credits]);
  const annual = useMemo(() => (credits || []).filter(c => c.type === 'annual'), [credits]);

  const unused = useMemo(() => (credits || []).filter(c => !c.used), [credits]);
  const urgent = useMemo(() => unused.filter(c => c.daysUntilReset <= 7), [unused]);

  const handleToggle = async (credit) => {
    await onToggleCredit(credit.id, credit.period, !credit.used);
    toast(credit.used ? `${credit.label} marked as unused` : `${credit.label} marked as used`, credit.used ? 'info' : 'success');
  };

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const total = monthly.reduce((s, c) => s + c.maxAmount, 0);
    const used = monthly.filter(c => c.used).reduce((s, c) => s + c.maxAmount, 0);
    return { total, used, remaining: total - used };
  }, [monthly]);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e8eaf0', marginBottom: 4 }}>Credit Tracker</h2>
        <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>
          Credits detected automatically via Plaid statement credits, or mark manually
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="glass" style={{ padding: 14 }}>
          <div className="section-label" style={{ marginBottom: 6 }}>Monthly Available</div>
          <div className="med-num" style={{ color: '#4ade80' }}>${fmtMoney(monthlyStats.total)}</div>
          <div style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 2 }}>per month across all cards</div>
        </div>
        <div className="glass" style={{ padding: 14 }}>
          <div className="section-label" style={{ marginBottom: 6 }}>Used This Month</div>
          <div className="med-num" style={{ color: '#60a5fa' }}>${fmtMoney(monthlyStats.used)}</div>
          <div style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 2 }}>${fmtMoney(monthlyStats.remaining)} still available</div>
        </div>
        {urgent.length > 0 && (
          <div className="glass pulse-amber" style={{ padding: 14, borderColor: 'rgba(245,158,11,0.4)' }}>
            <div className="section-label" style={{ marginBottom: 6, color: '#f59e0b' }}>Expiring Soon</div>
            <div className="med-num" style={{ color: '#fbbf24' }}>{urgent.length}</div>
            <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: 2 }}>credits expiring ≤7 days</div>
          </div>
        )}
      </div>

      {/* Monthly credits */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8892b0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#0c1224', border: '1px solid #253560', borderRadius: 4, padding: '2px 8px' }}>Monthly</span>
          <span style={{ color: '#4a5568' }}>Resets 1st of each month</span>
          <span className="tag tag-priority" style={{ marginLeft: 4 }}>${fmtMoney(monthlyStats.remaining)} unused</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {monthly.length === 0 ? (
            <div style={{ color: '#4a5568', fontSize: '0.8rem', padding: 16 }}>No monthly credits configured</div>
          ) : (
            monthly
              .sort((a, b) => a.used - b.used || a.daysUntilReset - b.daysUntilReset)
              .map(c => <CreditCard key={c.id} credit={c} onToggle={handleToggle} />)
          )}
        </div>
      </div>

      {/* Quarterly credits */}
      {quarterly.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8892b0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#0c1224', border: '1px solid #253560', borderRadius: 4, padding: '2px 8px' }}>Quarterly</span>
            <span style={{ color: '#4a5568' }}>Resets Jan/Apr/Jul/Oct</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quarterly.sort((a, b) => a.used - b.used || a.daysUntilReset - b.daysUntilReset).map(c =>
              <CreditCard key={c.id} credit={c} onToggle={handleToggle} />
            )}
          </div>
        </div>
      )}

      {/* Semi-annual credits */}
      {semiAnnual.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8892b0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#0c1224', border: '1px solid #253560', borderRadius: 4, padding: '2px 8px' }}>Semi-Annual</span>
            <span style={{ color: '#4a5568' }}>Resets Jan/Jul</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {semiAnnual.sort((a, b) => a.used - b.used || a.daysUntilReset - b.daysUntilReset).map(c =>
              <CreditCard key={c.id} credit={c} onToggle={handleToggle} />
            )}
          </div>
        </div>
      )}

      {/* Annual credits (with progress bars for partial-use ones) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8892b0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#0c1224', border: '1px solid #253560', borderRadius: 4, padding: '2px 8px' }}>Annual</span>
          <span style={{ color: '#4a5568' }}>Resets each calendar year</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {annual.map(c => {
            if (c.isAutoApplied || c.id === 'chase_travel_300') {
              // Use progress bar for Chase $300 travel credit
              const usedAmount = userState?.chaseTravel300Used || 0;
              return <ProgressCredit key={c.id} credit={c} usedAmount={usedAmount} />;
            }
            return <CreditCard key={c.id} credit={c} onToggle={handleToggle} />;
          })}
        </div>
      </div>

      {/* Annual value summary */}
      <div className="glass" style={{ padding: 16 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Annual Credit Summary (5 Cards)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {CARDS.map(card => {
            const cardCredits = [...(monthly || []), ...(quarterly || []), ...(semiAnnual || []), ...(annual || [])]
              .filter(c => c.card === card.id);
            const totalAnnual = cardCredits.reduce((s, c) => {
              const amt = c.maxAmount || 0;
              if (c.type === 'monthly' || c.type === 'configurable') return s + amt * 12;
              if (c.type === 'quarterly') return s + amt * 4;
              if (c.type === 'semi-annual') return s + amt * 2;
              return s + amt;
            }, 0);
            if (totalAnnual === 0) return null;
            return (
              <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#0c1224', borderRadius: 6, border: `1px solid ${card.color}22` }}>
                <CardLogo cardId={card.id} size="xs" />
                <span className="mono" style={{ fontSize: '0.85rem', color: '#4ade80' }}>${totalAnnual.toLocaleString()}</span>
              </div>
            );
          }).filter(Boolean)}
        </div>
      </div>
    </div>
  );
}
