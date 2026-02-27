import { useState, useMemo } from 'react';
import { Plane, Edit2, AlertCircle, CheckCircle, ArrowRight, Info, Plus, Trash2, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import EditModal from '../components/EditModal.jsx';
import { useToast } from '../components/Toast.jsx';

function fmtNum(n) { return Number(n || 0).toLocaleString(); }

const TRANSFER_POOLS = [
  { id: 'virginAtlantic', label: 'VA Flying Club', color: '#be1230', note: 'Already in VA — no transfer needed' },
  { id: 'amexMR', label: 'Amex MR', color: '#00a651', note: 'Transfer 1:1 to VA (2–3 business days)' },
  { id: 'chaseUR', label: 'Chase UR', color: '#1a56db', note: 'Transfer 1:1 to VA (1–2 business days)' },
  { id: 'biltPoints', label: 'Bilt Points', color: '#7c3aed', note: 'Transfer 1:1 to VA (1–3 business days)' },
];

const AWARD_LINKS = [
  { label: 'Virgin Atlantic Award Search', url: 'https://www.virginatlantic.com/us/en/flights/book-flights.html', color: '#be1230' },
  { label: 'Air France/KLM Flying Blue', url: 'https://www.airfranceklm.com/en/flying-blue/reward-flights', color: '#002157' },
  { label: 'BA Avios Calendar', url: 'https://www.britishairways.com/en-us/information/executive-club/using-avios/reward-flight-selector', color: '#1a56db' },
  { label: 'United MileagePlus', url: 'https://www.united.com/en/us/fsr/choose-flights', color: '#005daa' },
];

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

export default function LondonPlanner({ userState, onUpdateState }) {
  const toast = useToast();
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null); // null | 'new' | goal object
  const [showAwardLinks, setShowAwardLinks] = useState(false);

  const points = useMemo(() => userState?.points ?? {}, [userState]);
  const tripGoals = useMemo(() => userState?.tripGoals ?? [], [userState]);

  // Determine active goal
  const activeGoal = tripGoals.find(g => g.id === selectedGoalId) || tripGoals[0];

  const pool = {
    virginAtlantic: points.virginAtlantic?.balance || 0,
    amexMR: points.amexMR?.balance || 0,
    chaseUR: points.chaseUR?.balance || 0,
    biltPoints: points.biltPoints?.balance || 0,
  };

  const poolTotal = pool.virginAtlantic + pool.amexMR + pool.chaseUR + pool.biltPoints;

  // Goal-specific calculations
  const totalTarget = activeGoal ? activeGoal.people * activeGoal.milesPerPersonRT : 0;
  const gap = Math.max(0, totalTarget - poolTotal);
  const pct = totalTarget > 0 ? Math.min(100, (poolTotal / totalTarget) * 100) : 0;
  const isReady = gap === 0 && totalTarget > 0;

  // Transfer recommendation
  const transferRec = useMemo(() => {
    if (!activeGoal || isReady) return null;
    let needed = gap;
    const moves = [];
    const sources = [
      { key: 'amexMR', bal: pool.amexMR, label: 'Amex MR' },
      { key: 'chaseUR', bal: pool.chaseUR, label: 'Chase UR' },
      { key: 'biltPoints', bal: pool.biltPoints, label: 'Bilt' },
    ].sort((a, b) => b.bal - a.bal);
    for (const src of sources) {
      if (needed <= 0) break;
      const take = Math.min(src.bal, needed);
      if (take > 0) { moves.push({ ...src, transfer: take }); needed -= take; }
    }
    return { moves, stillNeeded: Math.max(0, needed) };
  }, [gap, pool.amexMR, pool.chaseUR, pool.biltPoints, isReady, activeGoal]);

  // VA expiry warning
  const vaLastActivity = points.virginAtlantic?.lastActivityDate;
  const vaDaysSinceActivity = daysSince(vaLastActivity);
  const vaExpiryWarning = vaLastActivity && vaDaysSinceActivity > 700;

  const chartData = TRANSFER_POOLS
    .map(p => ({ name: p.label, value: pool[p.id] || 0, color: p.color }))
    .filter(d => d.value > 0);

  const handleGoalSave = (values) => {
    const existing = typeof editingGoal === 'object' ? editingGoal : null;
    const goal = {
      id: existing?.id || `goal-${Date.now()}`,
      name: values.name || 'Trip Goal',
      destination: values.destination || '',
      people: parseInt(values.people) || 1,
      targetTrips: 1,
      milesPerPersonRT: parseInt(values.milesPerPersonRT) || 150000,
      estimatedTaxesFees: parseInt(values.estimatedTaxesFees) || 0,
    };
    const updated = existing
      ? tripGoals.map(g => g.id === goal.id ? goal : g)
      : [...tripGoals, goal];
    onUpdateState({ ...userState, tripGoals: updated });
    if (!existing) setSelectedGoalId(goal.id);
    toast(`${goal.name} ${existing ? 'updated' : 'added'}`, 'success');
    setEditingGoal(null);
  };

  const handleGoalDelete = (id) => {
    const updated = tripGoals.filter(g => g.id !== id);
    onUpdateState({ ...userState, tripGoals: updated });
    if (selectedGoalId === id) setSelectedGoalId(null);
    toast('Trip goal removed', 'info');
  };

  if (!userState) return null;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e8eaf0', marginBottom: 4 }}>
          <Plane size={18} style={{ display: 'inline', marginRight: 8, color: '#be1230' }} />
          Trip Planner
        </h2>
        <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>
          Track your Virgin Atlantic award gaps — Amex MR, Chase UR, and Bilt all transfer 1:1
        </div>
      </div>

      {/* Trip goal tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {tripGoals.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGoalId(g.id)}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
              border: `1px solid ${(activeGoal?.id === g.id) ? '#be1230' : '#1a2540'}`,
              background: (activeGoal?.id === g.id) ? 'rgba(190,18,48,0.12)' : '#0c1224',
              color: (activeGoal?.id === g.id) ? '#f87171' : '#8892b0',
            }}
          >
            {g.name}
            {g.destination && <span style={{ marginLeft: 5, opacity: 0.6 }}>· {g.destination}</span>}
          </button>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={() => setEditingGoal('new')}>
          <Plus size={12} /> Add Goal
        </button>
      </div>

      {!activeGoal ? (
        <div className="glass" style={{ padding: 32, textAlign: 'center', color: '#4a5568' }}>
          No trip goals yet — click "Add Goal" to get started
        </div>
      ) : (
        <>
          {/* VA Expiry Warning */}
          {vaExpiryWarning && (
            <div className="alert-warning alert-banner" style={{ marginBottom: 16 }}>
              <AlertCircle size={13} />
              <span>Virgin Atlantic miles may be close to expiry (36-month activity window). Last activity: {vaLastActivity}. Transfer a small amount or book any reward to reset the clock.</span>
            </div>
          )}

          {/* Target + Status */}
          <div className="glass" style={{ padding: 20, marginBottom: 16, borderLeft: `3px solid ${isReady ? '#4ade80' : '#be1230'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#e8eaf0', marginBottom: 4 }}>
                  {activeGoal.people} {activeGoal.people === 1 ? 'Person' : 'People'} — {activeGoal.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>
                  {activeGoal.destination && `Destination: ${activeGoal.destination} • `}
                  {fmtNum(activeGoal.milesPerPersonRT)} miles/person RT
                  {activeGoal.estimatedTaxesFees ? ` • ~$${activeGoal.estimatedTaxesFees} taxes/fees per person` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {isReady && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', fontWeight: 700, fontSize: '0.9rem' }}>
                    <CheckCircle size={16} /> READY TO BOOK
                  </div>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingGoal(activeGoal)}>
                  <Edit2 size={12} /> Edit
                </button>
                {tripGoals.length > 1 && (
                  <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }} onClick={() => handleGoalDelete(activeGoal.id)}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Main progress bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#8892b0', marginBottom: 6 }}>
                <span>Total transferable pool</span>
                <span className="mono">{fmtNum(poolTotal)} / {fmtNum(totalTarget)} miles</span>
              </div>
              <div className="progress-track" style={{ height: 10 }}>
                <div className="progress-fill" style={{
                  width: `${pct}%`,
                  background: isReady ? 'linear-gradient(90deg, #4ade80, #22c55e)' : 'linear-gradient(90deg, #be1230, #ef4444)',
                }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: isReady ? '#4ade80' : '#f87171', marginTop: 5 }}>
                {isReady ? '✓ Award gap fully covered by your transferable points' : `Gap: ${fmtNum(gap)} miles still needed`}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              <div style={{ background: '#0c1224', borderRadius: 8, padding: '10px 12px', border: '1px solid #1a2540' }}>
                <div style={{ fontSize: '0.62rem', color: '#4a5568', marginBottom: 4 }}>TARGET MILES</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#e8eaf0' }}>{fmtNum(totalTarget)}</div>
                <div style={{ fontSize: '0.62rem', color: '#4a5568' }}>{activeGoal.people} people × {fmtNum(activeGoal.milesPerPersonRT)}</div>
              </div>
              <div style={{ background: '#0c1224', borderRadius: 8, padding: '10px 12px', border: '1px solid #1a2540' }}>
                <div style={{ fontSize: '0.62rem', color: '#4a5568', marginBottom: 4 }}>TOTAL POOL</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>{fmtNum(poolTotal)}</div>
                <div style={{ fontSize: '0.62rem', color: '#4a5568' }}>across all transferable programs</div>
              </div>
              <div style={{ background: '#0c1224', borderRadius: 8, padding: '10px 12px', border: '1px solid #1a2540' }}>
                <div style={{ fontSize: '0.62rem', color: '#4a5568', marginBottom: 4 }}>{isReady ? 'SURPLUS' : 'GAP'}</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: isReady ? '#4ade80' : '#f87171' }}>
                  {isReady ? `+${fmtNum(poolTotal - totalTarget)}` : `-${fmtNum(gap)}`}
                </div>
              </div>
            </div>
          </div>

          {/* Point pool breakdown */}
          <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 14 }}>Transferable Points Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TRANSFER_POOLS.map(p => {
                const bal = pool[p.id] || 0;
                const barPct = totalTarget > 0 ? Math.min(100, (bal / totalTarget) * 100) : 0;
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e8eaf0' }}>{p.label}</span>
                        <span style={{ fontSize: '0.68rem', color: '#4a5568' }}>• {p.note}</span>
                      </div>
                      <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: bal === 0 ? '#4a5568' : p.color }}>
                        {fmtNum(bal)}
                      </span>
                    </div>
                    <div className="progress-track" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: `${barPct}%`, background: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {chartData.length > 0 && (
              <div style={{ marginTop: 16, height: 80 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8892b0' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0c1224', border: '1px solid #253560', borderRadius: 6, fontSize: '0.72rem' }}
                      formatter={(v) => [fmtNum(v) + ' miles', 'Balance']}
                    />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                      {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Transfer recommendation */}
          {transferRec && (
            <div className="glass" style={{ padding: 20, marginBottom: 16, borderColor: '#f59e0b44' }}>
              <div className="section-label" style={{ marginBottom: 12, color: '#f59e0b' }}>Recommended Transfer Plan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {transferRec.moves.map(m => (
                  <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#0c1224', borderRadius: 8, border: '1px solid #1a2540' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e8eaf0' }}>{m.label}</span>
                    <ArrowRight size={12} color="#4a5568" />
                    <span style={{ fontSize: '0.82rem', color: '#be1230', fontWeight: 600 }}>Virgin Atlantic</span>
                    <span className="mono" style={{ marginLeft: 'auto', color: '#4ade80', fontWeight: 700 }}>
                      {fmtNum(m.transfer)} miles
                    </span>
                  </div>
                ))}
                {transferRec.stillNeeded > 0 && (
                  <div className="alert-warning alert-banner" style={{ fontSize: '0.74rem' }}>
                    <AlertCircle size={11} />
                    Still {fmtNum(transferRec.stillNeeded)} miles short even after all transfers — keep earning!
                  </div>
                )}
                {transferRec.stillNeeded === 0 && transferRec.moves.length > 0 && (
                  <div className="alert-success alert-banner" style={{ fontSize: '0.74rem' }}>
                    <CheckCircle size={11} />
                    This transfer plan covers the full award! Remember to allow 1–3 business days for transfers to appear in VA.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Award availability quick-links */}
          <div className="glass" style={{ padding: 16, marginBottom: 16 }}>
            <button
              onClick={() => setShowAwardLinks(v => !v)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showAwardLinks ? 12 : 0 }}
            >
              <div className="section-label">Search Award Availability</div>
              <span style={{ fontSize: '0.7rem', color: '#4a5568' }}>{showAwardLinks ? '▲ hide' : '▼ show'}</span>
            </button>
            {showAwardLinks && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AWARD_LINKS.map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ color: link.color, borderColor: `${link.color}44` }}
                  >
                    <ExternalLink size={11} /> {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* VA Award chart info */}
          <div className="glass" style={{ padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>VA Upper Class Award Chart Reference (approximate)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              {[
                { route: 'JFK/EWR → LHR', cabin: 'Upper Class', peak: 'Off-peak', oneWay: 75000, roundTrip: 150000 },
                { route: 'JFK/EWR → LHR', cabin: 'Upper Class', peak: 'Peak', oneWay: 95000, roundTrip: 190000 },
              ].map((r, i) => (
                <div key={i} style={{ background: '#0c1224', border: '1px solid #1a2540', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#be1230', marginBottom: 4 }}>{r.peak}</div>
                  <div style={{ fontSize: '0.68rem', color: '#4a5568', marginBottom: 6 }}>{r.route} • {r.cabin}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>
                    One-way: <span className="mono" style={{ color: '#e8eaf0' }}>{fmtNum(r.oneWay)}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>
                    Round-trip: <span className="mono" style={{ color: '#e8eaf0' }}>{fmtNum(r.roundTrip)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <Info size={10} style={{ flexShrink: 0, marginTop: 1 }} />
              Award chart approximate — verify on Virgin Atlantic Flying Club before transferring. Peak/off-peak dates vary by travel date.
            </div>
          </div>
        </>
      )}

      {/* Goal edit modal */}
      {editingGoal && (
        <EditModal
          title={editingGoal === 'new' ? 'Add Trip Goal' : 'Edit Trip Goal'}
          fields={[
            { key: 'name', label: 'Goal Name', type: 'text', placeholder: 'e.g. Tokyo Business Class' },
            { key: 'destination', label: 'Destination (airport code)', type: 'text', placeholder: 'e.g. NRT, LHR' },
            { key: 'people', label: 'Number of People', type: 'number', min: 1 },
            { key: 'milesPerPersonRT', label: 'Miles per Person (Round Trip)', type: 'number', hint: 'VA award cost each', min: 1, step: 1000 },
            { key: 'estimatedTaxesFees', label: 'Est. Taxes/Fees per Person ($)', type: 'number', hint: 'Cash needed at booking', min: 0 },
          ]}
          values={typeof editingGoal === 'object' ? {
            name: editingGoal.name,
            destination: editingGoal.destination || '',
            people: editingGoal.people,
            milesPerPersonRT: editingGoal.milesPerPersonRT,
            estimatedTaxesFees: editingGoal.estimatedTaxesFees || 0,
          } : {
            name: '',
            destination: '',
            people: 2,
            milesPerPersonRT: 150000,
            estimatedTaxesFees: 0,
          }}
          onSave={handleGoalSave}
          onClose={() => setEditingGoal(null)}
        />
      )}
    </div>
  );
}
