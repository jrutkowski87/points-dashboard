import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ExternalLink, Edit2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { PROGRAMS, PROGRAM_MAP } from '../data/programs.js';
import { ProgramMark } from '../components/Logos.jsx';
import EditModal from '../components/EditModal.jsx';
import Sparkline from '../components/Sparkline.jsx';
import { useToast } from '../components/Toast.jsx';
import { useBalanceHistory, recordBalanceSnapshot } from '../hooks/useApi.js';

function fmtNum(n) { return Number(n || 0).toLocaleString(); }
function fmtCurrency(n) { return `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

function ProgramRow({ program, pState, onSync, onEdit }) {
  const bal = pState.balance || 0;
  const estValue = bal * (program.cpp / 100);
  const days = daysSince(pState.lastUpdated);
  const isStale = days === null || days > 14;
  const history = useBalanceHistory(program.id);
  const sparkData = history.map(h => h.balance);

  return (
    <div key={program.id} className={`glass glass-hover ${isStale ? '' : ''}`} style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ProgramMark programId={program.id} size="lg" />

        {/* Name + details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e8eaf0' }}>{program.name}</span>
            {program.highlight && <span className="tag tag-priority">London 🇬🇧</span>}
            {program.canExpire && <span className="tag tag-alert">Expires</span>}
            {program.isTransferable && <span className="tag tag-plaid">Transferable</span>}
            {pState.statusLevel && <span className="tag tag-good">{pState.statusLevel}</span>}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#4a5568', marginTop: 3 }}>
            {program.cpp}¢/pt est. value
            {program.canExpire && ` • ${program.expirationNote}`}
            {program.transferSources?.length > 0 && ` • Sources: ${program.transferSources.join(', ')}`}
          </div>
        </div>

        {/* Balance + sparkline */}
        <div style={{ textAlign: 'right', marginRight: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
            {sparkData.length >= 2 && (
              <Sparkline data={sparkData} width={72} height={22} color={program.color} />
            )}
            <div className="med-num" style={{ color: bal === 0 ? '#4a5568' : program.color }}>
              {fmtNum(bal)}
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>
            ≈ {fmtCurrency(estValue)}
          </div>
        </div>

        {/* Freshness + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', minWidth: 120 }}>
          <FreshnessBadge lastUpdated={pState.lastUpdated} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onSync(program)}
              title={program.quickSyncInstructions}
            >
              <ExternalLink size={11} /> Sync
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(program)}>
              <Edit2 size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Expiry countdown for programs with inactivity expiry */}
      {program.expiryMonths && pState.lastActivityDate && (() => {
        const expiry = new Date(pState.lastActivityDate);
        expiry.setMonth(expiry.getMonth() + program.expiryMonths);
        const daysLeft = Math.floor((expiry - TODAY) / 86400000);
        const color = daysLeft < 30 ? '#f87171' : daysLeft < 90 ? '#f59e0b' : '#4ade80';
        const icon = daysLeft < 30 ? '🔴' : daysLeft < 90 ? '🟡' : '✅';
        return (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #1a2540' }}>
            <div style={{ fontSize: '0.7rem', color, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={11} />
              {icon} {daysLeft > 0
                ? `${daysLeft} days until expiry (${expiry.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}) — last activity ${pState.lastActivityDate}`
                : `Points may have expired! Last activity ${pState.lastActivityDate} — check your account`}
            </div>
          </div>
        );
      })()}
      {program.expiryMonths && !pState.lastActivityDate && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #1a2540' }}>
          <div style={{ fontSize: '0.7rem', color: '#4a5568', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={11} />
            Set last activity date to track {program.expiryMonths}-month expiry window
          </div>
        </div>
      )}
    </div>
  );
}

function FreshnessBadge({ lastUpdated }) {
  const days = daysSince(lastUpdated);
  if (days === null) return <span style={{ fontSize: '0.65rem', color: '#4a5568' }}>Never synced</span>;
  if (days === 0) return <span style={{ fontSize: '0.65rem', color: '#4ade80' }}>Updated TODAY</span>;
  if (days <= 7) return <span style={{ fontSize: '0.65rem', color: '#4ade80' }}>Updated {days}d ago</span>;
  if (days <= 30) return <span style={{ fontSize: '0.65rem', color: '#f59e0b' }}>Updated {days}d ago</span>;
  return <span style={{ fontSize: '0.65rem', color: '#f87171' }}>{days}d ago — update soon</span>;
}

const TODAY = Date.now();

const CHART_COLORS = {
  deltaSkymiles: '#e31837',
  chaseUR: '#1a56db',
  amexMR: '#00a651',
  biltPoints: '#7c3aed',
  hiltonHonors: '#003087',
  hyattPoints: '#c8a84b',
  marriottBonvoy: '#b5975a',
  virginAtlantic: '#be1230',
};

export default function PointsMiles({ userState, onUpdateState }) {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [editingBonus, setEditingBonus] = useState(null); // null | 'new' | bonus object

  if (!userState) return null;
  const { points } = userState;
  const transferBonuses = userState.transferBonuses || [];

  const totalValue = PROGRAMS.reduce((sum, p) => {
    const bal = points[p.id]?.balance || 0;
    return sum + bal * (p.cpp / 100);
  }, 0);

  const totalPoints = PROGRAMS.reduce((sum, p) => sum + (points[p.id]?.balance || 0), 0);

  const chartData = PROGRAMS
    .filter(p => points[p.id]?.balance > 0)
    .map(p => ({ name: p.shortName, value: points[p.id]?.balance || 0, color: CHART_COLORS[p.id] || '#253560' }));

  const handleSyncClick = (program) => {
    window.open(program.quickSyncUrl, '_blank');
    toast(`${program.name}: ${program.quickSyncInstructions}`, 'info', 8000);
  };

  const handleEdit = (program) => {
    setEditing(program);
  };

  const handleBonusSave = (values) => {
    const existing = typeof editingBonus === 'object' ? editingBonus : null;
    const bonus = {
      id: existing?.id || `bonus-${Date.now()}`,
      fromProgramId: values.fromProgramId,
      toProgramId: values.toProgramId,
      bonusPct: parseFloat(values.bonusPct) || 0,
      expiresDate: values.expiresDate || '',
      url: values.url || '',
      note: values.note || '',
    };
    const updated = existing
      ? transferBonuses.map(b => b.id === bonus.id ? bonus : b)
      : [...transferBonuses, bonus];
    onUpdateState({ ...userState, transferBonuses: updated });
    toast('Transfer bonus saved', 'success');
    setEditingBonus(null);
  };

  const handleBonusDelete = (id) => {
    onUpdateState({ ...userState, transferBonuses: transferBonuses.filter(b => b.id !== id) });
    toast('Bonus removed', 'info');
  };

  const handleSave = (program, values) => {
    const updated = {
      ...userState,
      points: {
        ...userState.points,
        [program.id]: {
          ...userState.points[program.id],
          balance: parseInt(values.balance) || 0,
          lastUpdated: new Date().toISOString(),
          ...(values.statusLevel ? { statusLevel: values.statusLevel } : {}),
          ...(values.lastActivityDate ? { lastActivityDate: values.lastActivityDate } : {}),
        },
      },
    };
    onUpdateState(updated);
    recordBalanceSnapshot(program.id, parseInt(values.balance) || 0);
    toast(`${program.name} balance updated to ${fmtNum(values.balance)}`, 'success');
    setEditing(null);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e8eaf0', marginBottom: 4 }}>Points & Miles</h2>
        <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>Update balances via quick-sync, then track estimated value across all programs</div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="glass" style={{ padding: 16 }}>
          <div className="section-label" style={{ marginBottom: 6 }}>Total Points (All Programs)</div>
          <div className="big-num" style={{ color: '#60a5fa' }}>{fmtNum(totalPoints)}</div>
        </div>
        <div className="glass" style={{ padding: 16 }}>
          <div className="section-label" style={{ marginBottom: 6 }}>Estimated Portfolio Value</div>
          <div className="big-num" style={{ color: '#4ade80' }}>{fmtCurrency(totalValue)}</div>
          <div style={{ fontSize: '0.7rem', color: '#4a5568', marginTop: 4 }}>Based on estimated CPP per program</div>
        </div>
        <div className="glass" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={28} outerRadius={44} dataKey="value" stroke="none">
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0c1224', border: '1px solid #253560', borderRadius: 6, fontSize: '0.72rem' }}
                  formatter={(v, name) => [fmtNum(v) + ' pts', name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: '0.75rem', color: '#4a5568', textAlign: 'center' }}>Update balances to see chart</div>
          )}
        </div>
      </div>

      {/* Programs table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PROGRAMS.map(program => (
          <ProgramRow
            key={program.id}
            program={program}
            pState={points[program.id] || {}}
            onSync={handleSyncClick}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* VA Transfer info */}
      <div className="glass" style={{ padding: 16, marginTop: 16, borderColor: '#be123044' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#be1230', marginBottom: 8 }}>
          🇬🇧 Virgin Atlantic Transfer Sources (all 1:1)
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.75rem', color: '#8892b0' }}>
          <span>Amex MR → VA: 1:1 (allow 2–3 days)</span>
          <span>Chase UR → VA: 1:1 (allow 1–2 days)</span>
          <span>Bilt → VA: 1:1 (allow 1–3 days)</span>
        </div>
      </div>

      {/* Transfer Bonus Tracker */}
      <div className="glass" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>Active Transfer Bonuses</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingBonus('new')}>
            <Plus size={12} /> Add Bonus
          </button>
        </div>
        {transferBonuses.length === 0 ? (
          <div style={{ fontSize: '0.74rem', color: '#4a5568', textAlign: 'center', padding: '12px 0' }}>
            No active transfer bonuses — add one when programs run promotions (e.g. Amex MR → VA +30%)
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transferBonuses.map(bonus => {
              const from = PROGRAM_MAP[bonus.fromProgramId];
              const to = PROGRAM_MAP[bonus.toProgramId];
              const daysLeft = bonus.expiresDate
                ? Math.floor((new Date(bonus.expiresDate) - TODAY) / 86400000)
                : null;
              const expired = daysLeft != null && daysLeft < 0;
              return (
                <div key={bonus.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0c1224', borderRadius: 8, border: `1px solid ${expired ? '#f8717144' : '#1a2540'}` }}>
                  <ProgramMark programId={bonus.fromProgramId} size="sm" />
                  <span style={{ fontSize: '0.7rem', color: '#4a5568' }}>→</span>
                  <ProgramMark programId={bonus.toProgramId} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4ade80' }}>+{bonus.bonusPct}% bonus</div>
                    <div style={{ fontSize: '0.68rem', color: '#4a5568' }}>
                      {from?.shortName} → {to?.shortName}
                      {bonus.note && ` • ${bonus.note}`}
                    </div>
                  </div>
                  {daysLeft != null && (
                    <span style={{ fontSize: '0.68rem', color: expired ? '#f87171' : daysLeft < 7 ? '#f59e0b' : '#8892b0', flexShrink: 0 }}>
                      {expired ? 'Expired' : `${daysLeft}d left`}
                    </span>
                  )}
                  {bonus.url && (
                    <a href={bonus.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                      <ExternalLink size={11} />
                    </a>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => setEditingBonus(bonus)}>
                    <Edit2 size={11} />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0, color: '#f87171' }} onClick={() => handleBonusDelete(bonus.id)}>
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          title={`Update ${editing.name}`}
          fields={[
            { key: 'balance', label: 'Current Balance', type: 'number', placeholder: '0', min: 0 },
            ...(editing.statusProgram ? [{
              key: 'statusLevel', label: 'Status Level', type: 'select',
              options: editing.statusLevels?.map(s => ({ value: s.name, label: `${s.name} (${fmtNum(s.mqds)} MQDs)` })) || [],
            }] : []),
            ...(editing.canExpire ? [{
              key: 'lastActivityDate', label: 'Last Activity Date', type: 'date',
            }] : []),
          ]}
          values={{
            balance: points[editing.id]?.balance || 0,
            statusLevel: points[editing.id]?.statusLevel || '',
            lastActivityDate: points[editing.id]?.lastActivityDate || '',
          }}
          onSave={(v) => handleSave(editing, v)}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Transfer bonus edit modal */}
      {editingBonus && (
        <EditModal
          title={editingBonus === 'new' ? 'Add Transfer Bonus' : 'Edit Transfer Bonus'}
          fields={[
            { key: 'fromProgramId', label: 'From Program', type: 'select', options: PROGRAMS.map(p => ({ value: p.id, label: p.shortName })) },
            { key: 'toProgramId', label: 'To Program', type: 'select', options: PROGRAMS.map(p => ({ value: p.id, label: p.shortName })) },
            { key: 'bonusPct', label: 'Bonus %', type: 'number', hint: 'e.g. 30 for a 30% bonus', min: 1 },
            { key: 'expiresDate', label: 'Expiry Date', type: 'date' },
            { key: 'url', label: 'Promo URL (optional)', type: 'text', placeholder: 'https://...' },
            { key: 'note', label: 'Notes (optional)', type: 'text', placeholder: 'e.g. Amex MR → VA limited-time' },
          ]}
          values={typeof editingBonus === 'object' ? {
            fromProgramId: editingBonus.fromProgramId,
            toProgramId: editingBonus.toProgramId,
            bonusPct: editingBonus.bonusPct,
            expiresDate: editingBonus.expiresDate,
            url: editingBonus.url,
            note: editingBonus.note,
          } : {
            fromProgramId: 'amexMR',
            toProgramId: 'virginAtlantic',
            bonusPct: '',
            expiresDate: '',
            url: '',
            note: '',
          }}
          onSave={handleBonusSave}
          onClose={() => setEditingBonus(null)}
        />
      )}
    </div>
  );
}
