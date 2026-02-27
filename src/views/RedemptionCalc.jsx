import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { PROGRAMS } from '../data/programs.js';
import { ProgramMark } from '../components/Logos.jsx';

function fmtNum(n) { return Number(n || 0).toLocaleString(); }

export default function RedemptionCalc() {
  const [programId, setProgramId] = useState('virginAtlantic');
  const [miles, setMiles] = useState('');
  const [cash, setCash] = useState('');

  const program = PROGRAMS.find(p => p.id === programId);
  const milesNum = parseFloat(miles) || 0;
  const cashNum = parseFloat(cash) || 0;

  const effectiveCpp = milesNum > 0 && cashNum > 0 ? (cashNum / milesNum) * 100 : null;
  const baselineCpp = program?.cpp || null;
  const premium = effectiveCpp != null && baselineCpp ? ((effectiveCpp - baselineCpp) / baselineCpp) * 100 : null;

  const rating = premium == null ? null
    : premium >= 50 ? { label: 'Excellent', color: '#4ade80', note: 'Outstanding redemption — far above typical value' }
    : premium >= 20 ? { label: 'Good', color: '#60a5fa', note: 'Above average — solid redemption' }
    : premium >= 0  ? { label: 'Fair', color: '#f59e0b', note: 'At or near typical value' }
    : { label: 'Below average', color: '#f87171', note: 'Below typical value — consider other options' };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e8eaf0', marginBottom: 4 }}>
          <Calculator size={18} style={{ display: 'inline', marginRight: 8, color: '#f59e0b' }} />
          Redemption Value Calculator
        </h2>
        <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>
          Enter an award's cost in points and equivalent cash price to see your effective cents-per-point
        </div>
      </div>

      <div className="glass" style={{ padding: 24, marginBottom: 16, maxWidth: 560 }}>
        {/* Program selector */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#8892b0', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Program
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PROGRAMS.map(p => (
              <button
                key={p.id}
                onClick={() => setProgramId(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${programId === p.id ? p.color : '#1a2540'}`,
                  background: programId === p.id ? `${p.color}18` : '#0c1224',
                  color: programId === p.id ? p.color : '#4a5568',
                  fontSize: '0.74rem', fontWeight: programId === p.id ? 700 : 500,
                  transition: 'all 0.15s',
                }}
              >
                <ProgramMark programId={p.id} size="xs" />
                {p.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#8892b0', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Points / Miles needed
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 75000"
              value={miles}
              onChange={e => setMiles(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0c1224', border: '1px solid #253560',
                borderRadius: 8, padding: '9px 12px',
                color: '#e8eaf0', fontSize: '0.9rem',
                fontFamily: 'JetBrains Mono, monospace',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#8892b0', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Equivalent cash price ($)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 1500"
              value={cash}
              onChange={e => setCash(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0c1224', border: '1px solid #253560',
                borderRadius: 8, padding: '9px 12px',
                color: '#e8eaf0', fontSize: '0.9rem',
                fontFamily: 'JetBrains Mono, monospace',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Results */}
        {effectiveCpp != null ? (
          <div style={{ borderTop: '1px solid #1a2540', paddingTop: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ background: '#0c1224', borderRadius: 8, padding: '12px 14px', border: `1px solid ${rating?.color || '#253560'}44` }}>
                <div style={{ fontSize: '0.62rem', color: '#4a5568', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your CPP</div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: rating?.color || '#e8eaf0' }}>
                  {effectiveCpp.toFixed(2)}¢
                </div>
                <div style={{ fontSize: '0.65rem', color: '#4a5568' }}>per point/mile</div>
              </div>
              <div style={{ background: '#0c1224', borderRadius: 8, padding: '12px 14px', border: '1px solid #1a2540' }}>
                <div style={{ fontSize: '0.62rem', color: '#4a5568', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Baseline CPP</div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#8892b0' }}>
                  {baselineCpp?.toFixed(1)}¢
                </div>
                <div style={{ fontSize: '0.65rem', color: '#4a5568' }}>{program?.shortName} typical</div>
              </div>
            </div>

            <div style={{ background: `${rating?.color}14`, border: `1px solid ${rating?.color}33`, borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: rating?.color, fontSize: '0.9rem' }}>{rating?.label}</span>
                <span className="mono" style={{ color: rating?.color, fontSize: '0.82rem' }}>
                  {premium >= 0 ? '+' : ''}{premium?.toFixed(0)}% vs. baseline
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#8892b0' }}>{rating?.note}</div>
            </div>

            <div style={{ marginTop: 14, fontSize: '0.72rem', color: '#4a5568' }}>
              <span>{fmtNum(Math.round(milesNum))} {program?.isMiles ? 'miles' : 'points'} </span>
              <span>at {effectiveCpp.toFixed(2)}¢/pt = </span>
              <span style={{ color: '#e8eaf0', fontWeight: 600 }}>${cashNum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} cash equivalent</span>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid #1a2540', paddingTop: 18, textAlign: 'center', color: '#4a5568', fontSize: '0.8rem' }}>
            Enter miles/points and cash price above to calculate value
          </div>
        )}
      </div>

      {/* CPP reference table */}
      <div className="glass" style={{ padding: 16 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Estimated CPP Reference (industry baselines)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PROGRAMS.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#0c1224', border: '1px solid #1a2540', borderRadius: 6 }}>
              <ProgramMark programId={p.id} size="xs" />
              <span style={{ fontSize: '0.72rem', color: '#8892b0' }}>{p.shortName}</span>
              <span className="mono" style={{ fontSize: '0.72rem', color: p.color, fontWeight: 700 }}>{p.cpp}¢</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: '0.65rem', color: '#4a5568' }}>
          Baselines are estimates — actual value depends on specific award and redemption path.
        </div>
      </div>
    </div>
  );
}
