import { useState } from 'react';
import { CalendarCheck, Save, Check } from 'lucide-react';
import { PROGRAM_MAP } from '../data/programs.js';
import { CARD_MAP } from '../data/cards.js';
import { ProgramMark, CardLogo } from '../components/Logos.jsx';
import { useToast } from '../components/Toast.jsx';
import { recordBalanceSnapshot } from '../hooks/useApi.js';

// stateKey = key used in userState.points
// programId = key used in PROGRAM_MAP (slight historical inconsistency for Delta)
const PROGRAM_ORDER = [
  { stateKey: 'deltaSkymiles',  programId: 'deltaSkyMiles' },
  { stateKey: 'chaseUR',        programId: 'chaseUR' },
  { stateKey: 'amexMR',         programId: 'amexMR' },
  { stateKey: 'biltPoints',     programId: 'biltPoints' },
  { stateKey: 'hiltonHonors',   programId: 'hiltonHonors' },
  { stateKey: 'hyattPoints',    programId: 'hyattPoints' },
  { stateKey: 'marriottBonvoy', programId: 'marriottBonvoy' },
  { stateKey: 'virginAtlantic', programId: 'virginAtlantic' },
];

const CARD_ORDER = [
  'amexPlatBiz', 'deltaReserveBusiness', 'deltaReservePersonal',
  'chaseSapphireReserve', 'biltPalladium',
];

const DELTA_STATUSES = ['Diamond', 'Platinum', 'Gold', 'Silver', 'General Member'];

const TODAY = Date.now();

function daysSince(isoDate) {
  if (!isoDate) return null;
  return Math.floor((TODAY - new Date(isoDate).getTime()) / 86400000);
}

function Section({ number, title, children }) {
  return (
    <div style={{
      background: '#0a1628',
      border: '1px solid #1a2540',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        borderBottom: '1px solid #1a2540',
        background: '#060e1c',
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.6rem',
          fontWeight: 800,
          color: '#1a56db',
          background: '#1a56db12',
          border: '1px solid #1a56db25',
          borderRadius: 4,
          padding: '2px 6px',
          letterSpacing: '0.04em',
        }}>{number}</span>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: '#4a6080',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ children, last }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 20px',
      borderBottom: last ? 'none' : '1px solid #0d1a2e',
      minHeight: 46,
    }}>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, prefix }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {prefix && (
        <span style={{
          fontSize: '0.68rem',
          color: '#3a4e6a',
          fontFamily: 'JetBrains Mono, monospace',
          userSelect: 'none',
        }}>{prefix}</span>
      )}
      <input
        type="number"
        value={value === '' ? '' : value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        style={{
          width: 118,
          background: '#060e1c',
          border: '1px solid #1a2e4a',
          borderRadius: 6,
          color: '#c8d4e8',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.82rem',
          padding: '6px 10px',
          textAlign: 'right',
          outline: 'none',
        }}
        onFocus={e => { e.target.style.borderColor = '#1a56db'; }}
        onBlur={e => { e.target.style.borderColor = '#1a2e4a'; }}
      />
    </div>
  );
}

export default function WeeklyUpdate({ userState, onUpdateState, credits, onToggleCredit }) {
  const { toast } = useToast();

  const [balances, setBalances] = useState(() => {
    const pts = userState?.points || {};
    return Object.fromEntries(
      PROGRAM_ORDER.map(({ stateKey }) => [stateKey, pts[stateKey]?.balance > 0 ? pts[stateKey].balance : ''])
    );
  });

  const [deltaStatus, setDeltaStatus] = useState(
    () => userState?.points?.deltaSkymiles?.statusLevel || 'Platinum'
  );

  const [ytdSpend, setYtdSpend] = useState(() => {
    const s = userState?.manualSpend?.ytd || {};
    return Object.fromEntries(
      CARD_ORDER.map(id => [id, s[id] > 0 ? s[id] : ''])
    );
  });

  const [biltWelcomeTotal, setBiltWelcomeTotal] = useState(() => {
    const v = userState?.manualSpend?.biltWelcomeTotal;
    return v > 0 ? v : '';
  });

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const lastSaved = userState?.manualSpend?.lastUpdated;
  const daysSinceLastSave = daysSince(lastSaved);

  const monthlyCreditItems = (credits || []).filter(
    c => c.type === 'monthly' || c.type === 'configurable'
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const newPoints = { ...(userState?.points || {}) };
      for (const { stateKey } of PROGRAM_ORDER) {
        const val = balances[stateKey] === '' ? null : Number(balances[stateKey]);
        if (val !== null && !isNaN(val)) {
          newPoints[stateKey] = {
            ...(newPoints[stateKey] || {}),
            balance: val,
            lastUpdated: new Date().toISOString(),
          };
        }
      }
      newPoints.deltaSkymiles = { ...newPoints.deltaSkymiles, statusLevel: deltaStatus };

      const newManualSpend = {
        biltWelcomeTotal: Number(biltWelcomeTotal) || 0,
        lastUpdated: new Date().toISOString(),
        ytd: Object.fromEntries(
          CARD_ORDER.map(id => [id, Number(ytdSpend[id]) || 0])
        ),
      };

      await onUpdateState({ ...userState, points: newPoints, manualSpend: newManualSpend });

      for (const { stateKey } of PROGRAM_ORDER) {
        const val = Number(balances[stateKey]);
        if (!isNaN(val) && val > 0) {
          try { await recordBalanceSnapshot(stateKey, val); } catch { /* offline */ }
        }
      }

      setSavedAt(new Date());
      toast('Snapshot saved ✓');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 660, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarCheck size={17} color="#1a56db" strokeWidth={2.2} />
            <h1 style={{
              margin: 0,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#e8eaf0',
              letterSpacing: '-0.02em',
            }}>Weekly Update</h1>
          </div>
          {daysSinceLastSave != null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.62rem', color: '#3a4e6a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Last snapshot
              </div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: daysSinceLastSave > 10 ? '#e31837' : '#4a6080',
              }}>
                {daysSinceLastSave === 0 ? 'today' : `${daysSinceLastSave}d ago`}
              </div>
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#3a4e6a', paddingLeft: 27 }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          })}
        </div>
      </div>

      {/* 01 · Points & Miles Balances */}
      <Section number="01" title="Points & Miles Balances">
        {PROGRAM_ORDER.map(({ stateKey, programId }, i) => {
          const prog = PROGRAM_MAP[programId];
          const last = i === PROGRAM_ORDER.length - 1;
          return (
            <Row key={stateKey} last={last}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <ProgramMark programId={programId} size="sm" />
                <span style={{ fontSize: '0.8rem', color: '#c8d0e0', fontWeight: 600 }}>
                  {prog?.shortName}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {stateKey === 'deltaSkymiles' && (
                  <select
                    value={deltaStatus}
                    onChange={e => setDeltaStatus(e.target.value)}
                    style={{
                      background: '#060e1c',
                      border: '1px solid #1a2e4a',
                      borderRadius: 6,
                      color: '#6a7fa0',
                      fontSize: '0.68rem',
                      padding: '6px 8px',
                      outline: 'none',
                    }}
                  >
                    {DELTA_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                )}
                <NumInput
                  value={balances[stateKey]}
                  onChange={v => setBalances(prev => ({ ...prev, [stateKey]: v }))}
                />
              </div>
            </Row>
          );
        })}
      </Section>

      {/* 02 · Card Spend YTD */}
      <Section number="02" title="Year-to-Date Card Spend">
        {CARD_ORDER.map((id, i) => {
          const card = CARD_MAP[id];
          const isBilt = id === 'biltPalladium';
          const isLastCard = i === CARD_ORDER.length - 1;
          return (
            <div key={id}>
              <Row last={isLastCard && !isBilt}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CardLogo cardId={id} size="sm" />
                  <span style={{ fontSize: '0.8rem', color: '#c8d0e0', fontWeight: 600 }}>
                    {card?.shortName}
                  </span>
                </div>
                <NumInput
                  value={ytdSpend[id]}
                  onChange={v => setYtdSpend(prev => ({ ...prev, [id]: v }))}
                  prefix="$"
                />
              </Row>
              {isBilt && (
                <Row last>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 34 }}>
                    <span style={{ fontSize: '0.72rem', color: '#7c3aed' }}>
                      Welcome bonus spend (all-time)
                    </span>
                  </div>
                  <NumInput
                    value={biltWelcomeTotal}
                    onChange={v => setBiltWelcomeTotal(v)}
                    prefix="$"
                  />
                </Row>
              )}
            </div>
          );
        })}
      </Section>

      {/* 03 · Monthly Credits */}
      {monthlyCreditItems.length > 0 && (
        <Section number="03" title="Credits This Month">
          {monthlyCreditItems.map((credit, i) => {
            const last = i === monthlyCreditItems.length - 1;
            return (
              <Row key={`${credit.id}-${credit.period}`} last={last}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CardLogo cardId={credit.card} size="xs" />
                  <span style={{ fontSize: '0.78rem', color: '#c8d0e0' }}>{credit.label}</span>
                  {credit.maxAmount != null && (
                    <span style={{
                      fontSize: '0.62rem',
                      color: '#3a4e6a',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      ${credit.maxAmount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onToggleCredit(credit.id, credit.period, !credit.used)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 6,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: credit.used ? '1px solid #16803428' : '1px solid #1a2e4a',
                    background: credit.used ? '#16803415' : 'transparent',
                    color: credit.used ? '#4ade80' : '#3a4e6a',
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {credit.used && <Check size={10} />}
                  {credit.used ? 'USED' : 'MARK USED'}
                </button>
              </Row>
            );
          })}
        </Section>
      )}

      {/* Save */}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 10,
            background: saving
              ? '#0a1628'
              : 'linear-gradient(135deg, #1a56db 0%, #7c3aed 100%)',
            border: saving ? '1px solid #1a2540' : 'none',
            color: saving ? '#3a4e6a' : '#fff',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: saving ? 'default' : 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Save size={13} />
          {saving ? 'Saving…' : 'Save Snapshot'}
        </button>
        {savedAt && (
          <div style={{
            textAlign: 'center',
            fontSize: '0.65rem',
            color: '#4ade80',
            marginTop: 10,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            ✓ Saved at {savedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}
