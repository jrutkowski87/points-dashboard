import { useState } from 'react';
import { Target, TrendingUp, Edit2, CheckCircle, Info, Zap } from 'lucide-react';
import EditModal from '../components/EditModal.jsx';
import { useToast } from '../components/Toast.jsx';

function fmtNum(n) { return Number(n || 0).toLocaleString(); }
function fmtCurrency(n) { return `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

function ProgressSection({ label, current, target, color, note, sublabel }) {
  const pct = Math.min(100, (current / target) * 100);
  const remaining = Math.max(0, target - current);
  const complete = pct >= 100;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>
          {label}
          {sublabel && <span style={{ color: '#4a5568', marginLeft: 6 }}>{sublabel}</span>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: complete ? '#4ade80' : color }}>
            {fmtNum(Math.round(current))}
          </span>
          <span style={{ fontSize: '0.78rem', color: '#4a5568' }}> / {fmtNum(target)}</span>
        </div>
      </div>
      <div className="progress-track" style={{ height: 8 }}>
        <div className="progress-fill" style={{
          width: `${pct}%`,
          background: complete ? 'linear-gradient(90deg, #4ade80, #22c55e)' : `linear-gradient(90deg, ${color}, ${color}88)`,
        }} />
      </div>
      {!complete && (
        <div style={{ fontSize: '0.7rem', color: '#4a5568', marginTop: 5 }}>
          {fmtNum(Math.round(remaining))} more needed · {pct.toFixed(0)}% complete
        </div>
      )}
      {complete && (
        <div style={{ fontSize: '0.7rem', color: '#4ade80', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle size={10} /> Complete!
        </div>
      )}
      {note && <div style={{ fontSize: '0.68rem', color: '#60a5fa', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Info size={10} />{note}</div>}
    </div>
  );
}

const TODAY = Date.now();

function StatLine({ label, value, color = '#e8eaf0', mono = true, note }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #0c1224' }}>
      <span style={{ fontSize: '0.78rem', color: '#8892b0' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span className={mono ? 'mono' : ''} style={{ fontSize: '0.85rem', fontWeight: 600, color }}>{value}</span>
        {note && <div style={{ fontSize: '0.65rem', color: '#4a5568' }}>{note}</div>}
      </div>
    </div>
  );
}

export default function Goals({ userState, spendStats, onUpdateState }) {
  const toast = useToast();
  const [editingBilt, setEditingBilt] = useState(false);
  const [editingMQD, setEditingMQD] = useState(false);

  if (!userState) return null;
  const { goals, priorities } = userState;

  // ── BILT WELCOME BONUS ────────────────────────────────────────────────
  const biltTarget = goals.biltWelcome?.targetSpend || 4000;
  const biltBonus = goals.biltWelcome?.bonusPoints || 100000;
  const biltSpend = spendStats?.biltWelcomeSpend || 0;
  const biltComplete = priorities?.biltWelcomeComplete || biltSpend >= biltTarget;

  // Spend velocity (Bilt)
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const daysSinceJan1 = Math.max(1, Math.floor((TODAY - yearStart) / 86400000));
  const biltDailyRate = biltSpend / daysSinceJan1;
  const biltDaysToComplete = biltDailyRate > 0 ? Math.ceil((biltTarget - biltSpend) / biltDailyRate) : null;
  const biltProjectedDate = biltDaysToComplete != null
    ? new Date(TODAY + biltDaysToComplete * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  // ── DELTA DIAMOND MQD ─────────────────────────────────────────────────
  const targetMQDs = goals.deltaStatus?.targetMQDs || 28000;
  const flyingMQDs = goals.deltaStatus?.currentMQDsFromFlying || 0;
  const headstart = goals.deltaStatus?.headstartClaimed ? (goals.deltaStatus?.headstartAmount || 5000) : 0;

  const drpYtd = spendStats?.ytdSpend?.deltaReservePersonal || 0;
  const drbYtd = spendStats?.ytdSpend?.deltaReserveBusiness || 0;
  const mqdsFromDrp = drpYtd * 0.1; // $1 MQD per $10 spend, no annual cap
  const mqdsFromDrb = drbYtd * 0.1;
  const mqdsFromCards = mqdsFromDrp + mqdsFromDrb;

  const totalMQDs = flyingMQDs + headstart + mqdsFromCards;
  const remainingMQDs = Math.max(0, targetMQDs - totalMQDs);

  // MQD breakeven — no cap on MQD Boost from Delta Reserve card spend
  const totalCardSpendNeeded = remainingMQDs > 0 ? Math.ceil(remainingMQDs * 10) : 0;
  const estimatedSegments = remainingMQDs > 0 ? Math.ceil(remainingMQDs / 1500) : 0;


  const handleBiltSave = (v) => {
    onUpdateState({
      ...userState,
      goals: {
        ...goals,
        biltWelcome: {
          ...goals.biltWelcome,
          targetSpend: parseFloat(v.targetSpend) || 4000,
          bonusPoints: parseInt(v.bonusPoints) || 100000,
        },
      },
      priorities: { ...priorities, biltWelcomeComplete: v.complete === 'true' },
    });
    toast('Bilt goal updated', 'success');
  };

  const handleMQDSave = (v) => {
    onUpdateState({
      ...userState,
      goals: {
        ...goals,
        deltaStatus: {
          ...goals.deltaStatus,
          currentMQDsFromFlying: parseInt(v.flyingMQDs) || 0,
          targetMQDs: parseInt(v.targetMQDs) || 28000,
          headstartAmount: parseInt(v.headstartAmount) || 5000,
          headstartClaimed: v.headstartClaimed === 'true',
        },
      },
      priorities: { ...priorities, diamondPushActive: v.diamondPushActive === 'true' },
    });
    toast('Delta MQD tracker updated', 'success');
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e8eaf0', marginBottom: 4 }}>
          <Target size={18} style={{ display: 'inline', marginRight: 8, color: '#f59e0b' }} />
          Goals Tracker
        </h2>
        <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>
          Track your active spending goals — Bilt welcome bonus and Delta Diamond MQD push
        </div>
      </div>

      {/* ── BILT WELCOME BONUS ─────────────────────────────────────────── */}
      <div className="glass" style={{ padding: 20, marginBottom: 16, borderLeft: `3px solid ${biltComplete ? '#4ade80' : '#7c3aed'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#e8eaf0' }}>Bilt Palladium</span>
              <span className="tag tag-priority">#1 Priority</span>
              {biltComplete && <span className="tag tag-excellent">✓ Complete</span>}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>Welcome Bonus — ${fmtNum(biltTarget)} spend requirement</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingBilt(true)}>
            <Edit2 size={12} /> Edit
          </button>
        </div>

        <ProgressSection
          label="Card spend toward welcome bonus"
          current={biltSpend}
          target={biltTarget}
          color="#7c3aed"
          sublabel="(auto-tracked via Plaid)"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 12 }}>
          <div style={{ background: '#0c1224', borderRadius: 8, padding: '10px 12px', border: '1px solid #1a2540' }}>
            <div style={{ fontSize: '0.65rem', color: '#4a5568', marginBottom: 4 }}>SPENT SO FAR</div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7c3aed' }}>{fmtCurrency(biltSpend)}</div>
          </div>
          <div style={{ background: '#0c1224', borderRadius: 8, padding: '10px 12px', border: '1px solid #1a2540' }}>
            <div style={{ fontSize: '0.65rem', color: '#4a5568', marginBottom: 4 }}>REMAINING</div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: biltComplete ? '#4ade80' : '#e8eaf0' }}>
              {biltComplete ? 'DONE!' : fmtCurrency(biltTarget - biltSpend)}
            </div>
          </div>
          <div style={{ background: '#0c1224', borderRadius: 8, padding: '10px 12px', border: '1px solid #1a2540' }}>
            <div style={{ fontSize: '0.65rem', color: '#4a5568', marginBottom: 4 }}>BONUS EARNED</div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: biltComplete ? '#4ade80' : '#4a5568' }}>
              {biltComplete ? `${fmtNum(biltBonus)} pts` : '—'}
            </div>
          </div>
        </div>

        {!biltComplete && biltSpend > 0 && biltProjectedDate && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#0c1224', borderRadius: 8, border: '1px solid #1a2540', fontSize: '0.74rem' }}>
            <span style={{ color: '#8892b0' }}>At your pace </span>
            <span className="mono" style={{ color: '#7c3aed', fontWeight: 700 }}>{fmtCurrency(Math.round(biltDailyRate))}/day</span>
            <span style={{ color: '#8892b0' }}> → projected completion </span>
            <span style={{ color: '#4ade80', fontWeight: 700 }}>{biltProjectedDate}</span>
          </div>
        )}
        {!biltComplete && biltSpend === 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#0c1224', borderRadius: 8, border: '1px solid #1a2540', fontSize: '0.74rem', color: '#4a5568' }}>
            No Bilt spend detected yet — connect card or add transactions to see pace projection
          </div>
        )}
        {!biltComplete && (
          <div className="alert-info alert-banner" style={{ marginTop: 12, fontSize: '0.74rem' }}>
            <Zap size={12} />
            <div>
              <strong>Strategy:</strong> Use Bilt for dining (3x), travel (2x), and all other daily spend (1x) until {fmtCurrency(biltTarget - biltSpend)} is reached.
              Don't forget: must make <strong>5+ transactions/month</strong> to earn points.
            </div>
          </div>
        )}
      </div>

      {/* ── DELTA DIAMOND MQD ─────────────────────────────────────────── */}
      <div className="glass" style={{ padding: 20, marginBottom: 16, borderLeft: `3px solid ${totalMQDs >= targetMQDs ? '#4ade80' : '#e31837'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#e8eaf0' }}>Delta Diamond Status</span>
              <span className="tag tag-priority">{biltComplete ? '#1 Priority' : '#2 Priority'}</span>
              {totalMQDs >= targetMQDs && <span className="tag tag-excellent">✓ Diamond!</span>}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>Medallion Qualifying Dollars (MQDs) tracker</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingMQD(true)}>
            <Edit2 size={12} /> Edit
          </button>
        </div>

        {/* Main progress */}
        <ProgressSection
          label="Total MQDs earned"
          current={totalMQDs}
          target={targetMQDs}
          color="#e31837"
        />

        {/* MQD breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 12, marginBottom: 16 }}>
          <StatLine label="✈ MQDs from flying (manual)" value={`+${fmtNum(flyingMQDs)}`} color="#e8eaf0" note="Enter your YTD flying MQDs" />
          <StatLine label="🎯 Card headstart (both Delta Reserve cards)" value={`+${fmtNum(headstart)}`} color="#4ade80" note="2,500 per card = 5,000 total" />
          <StatLine label="💳 Delta Reserve Personal — card spend MQDs" value={`+${fmtNum(Math.round(mqdsFromDrp))}`} color="#c8102e" note={`from $${fmtNum(drpYtd)} YTD spend ($1 MQD per $10, no cap)`} />
          <StatLine label="💳 Delta Reserve Business — card spend MQDs" value={`+${fmtNum(Math.round(mqdsFromDrb))}`} color="#e31837" note={`from $${fmtNum(drbYtd)} YTD spend ($1 MQD per $10, no cap)`} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 2px', borderTop: '1px solid #1a2540', marginTop: 4 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8892b0' }}>Total MQDs</span>
            <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e8eaf0' }}>{fmtNum(Math.round(totalMQDs))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8892b0' }}>Diamond threshold</span>
            <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4a5568' }}>{fmtNum(targetMQDs)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: remainingMQDs > 0 ? '#f87171' : '#4ade80' }}>Remaining needed</span>
            <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: remainingMQDs > 0 ? '#f87171' : '#4ade80' }}>
              {remainingMQDs > 0 ? `-${fmtNum(Math.round(remainingMQDs))}` : '✓ Done!'}
            </span>
          </div>
        </div>

        {/* Card spend sub-trackers */}
        <div style={{ borderTop: '1px solid #1a2540', paddingTop: 14, marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Delta Reserve Card MQD Boost ($1 MQD per $10 spent, no annual cap)</div>
          <ProgressSection
            label="Delta Reserve Personal"
            current={mqdsFromDrp}
            target={targetMQDs}
            color="#c8102e"
            sublabel={`$${fmtNum(drpYtd)} YTD spend`}
            note={drpYtd > 0 ? null : 'No spend data yet — enter card spend in Weekly Update to track'}
          />
          <ProgressSection
            label="Delta Reserve Business"
            current={mqdsFromDrb}
            target={targetMQDs}
            color="#e31837"
            sublabel={`$${fmtNum(drbYtd)} YTD spend`}
          />
        </div>

        {/* Breakeven breakdown */}
        {remainingMQDs > 0 && (
          <div style={{ background: '#0c1224', borderRadius: 8, border: '1px solid #1a2540', padding: '12px 14px', fontSize: '0.76rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: '#f59e0b', fontWeight: 700 }}>
              <TrendingUp size={12} /> How to close the gap
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8892b0' }}>MQDs still needed</span>
                <span className="mono" style={{ color: '#f87171', fontWeight: 700 }}>{fmtNum(Math.round(remainingMQDs))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4a5568' }}>→ Spend on Delta Reserve cards to close gap</span>
                <span className="mono" style={{ color: '#60a5fa', fontWeight: 700 }}>{fmtCurrency(totalCardSpendNeeded)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4a5568' }}>→ Or fly ~{estimatedSegments} Delta segments (avg 1,500 MQDs/seg)</span>
              </div>
              <div style={{ paddingLeft: 12, fontSize: '0.7rem', color: '#4ade80', marginTop: 2 }}>
                Card spend can cover the entire gap (no annual cap on MQD Boost)
              </div>
            </div>
          </div>
        )}

        {totalMQDs >= targetMQDs && (
          <div className="alert-success alert-banner" style={{ fontSize: '0.74rem' }}>
            <CheckCircle size={12} />
            🎉 Diamond status threshold reached! Congratulations. Keep flying to maintain a comfortable buffer.
          </div>
        )}
      </div>

      {/* Bilt edit modal */}
      {editingBilt && (
        <EditModal
          title="Edit Bilt Welcome Bonus Goal"
          fields={[
            { key: 'targetSpend', label: 'Spend Target ($)', type: 'number', hint: 'Required to earn bonus', min: 1 },
            { key: 'bonusPoints', label: 'Bonus Points Earned', type: 'number', hint: 'Points earned on completion', min: 1 },
            { key: 'complete', label: 'Mark Complete?', type: 'select', options: [{ value: 'false', label: 'No — still working toward it' }, { value: 'true', label: 'Yes — bonus already earned' }] },
          ]}
          values={{ targetSpend: biltTarget, bonusPoints: biltBonus, complete: priorities?.biltWelcomeComplete ? 'true' : 'false' }}
          onSave={handleBiltSave}
          onClose={() => setEditingBilt(false)}
        />
      )}

      {/* MQD edit modal */}
      {editingMQD && (
        <EditModal
          title="Edit Delta Diamond MQD Tracker"
          fields={[
            { key: 'flyingMQDs', label: 'MQDs from Flying (YTD)', type: 'number', hint: 'Find in your Delta account', min: 0 },
            { key: 'targetMQDs', label: 'Diamond Threshold', type: 'number', hint: '28,000 MQDs for Diamond (2026)', min: 0, step: 1000 },
            { key: 'headstartAmount', label: 'Card Headstart MQDs', type: 'number', hint: '5,000 with both Delta Reserves', min: 0 },
            { key: 'headstartClaimed', label: 'Headstart Active?', type: 'select', options: [{ value: 'true', label: 'Yes — cards are open and active' }, { value: 'false', label: 'No' }] },
            { key: 'diamondPushActive', label: 'Diamond Push Active?', type: 'select', options: [{ value: 'true', label: 'Yes — prioritizing MQD spend' }, { value: 'false', label: 'No' }] },
          ]}
          values={{
            flyingMQDs: flyingMQDs,
            targetMQDs: targetMQDs,
            headstartAmount: goals.deltaStatus?.headstartAmount || 5000,
            headstartClaimed: goals.deltaStatus?.headstartClaimed !== false ? 'true' : 'false',
            diamondPushActive: priorities?.diamondPushActive !== false ? 'true' : 'false',
          }}
          onSave={handleMQDSave}
          onClose={() => setEditingMQD(false)}
        />
      )}
    </div>
  );
}
