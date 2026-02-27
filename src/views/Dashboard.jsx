import { useMemo } from 'react';
import { AlertTriangle, TrendingUp, Zap, Gift, Target, CheckCircle, ArrowRight } from 'lucide-react';
import { PROGRAMS } from '../data/programs.js';
import { CardLogo, ProgramMark } from '../components/Logos.jsx';

function fmtNum(n) {
  if (!n) return '0';
  return Number(n).toLocaleString();
}

function fmtCurrency(n) {
  return `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function StatCard({ label, value, sub, color = '#60a5fa', icon: Icon, glowClass = '' }) {
  return (
    <div className={`glass glass-hover ${glowClass}`} style={{
      padding: '22px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
      borderTop: `2px solid ${color}50`,
    }}>
      {/* Background radial glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120,
        background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div className="section-label">{label}</div>
        {Icon && (
          <div style={{
            background: `${color}18`,
            border: `1px solid ${color}30`,
            borderRadius: 8,
            padding: '6px 7px',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Icon size={13} color={color} />
          </div>
        )}
      </div>
      <div className="big-num" style={{ color, position: 'relative' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct, color, glow = true }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{
        width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}cc, ${color})`,
        boxShadow: glow ? `0 0 12px ${color}55` : 'none',
      }} />
    </div>
  );
}

function PriorityCard({ title, color, badge, children }) {
  return (
    <div className="glass glass-hover" style={{
      padding: '18px 20px',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span className="tag tag-priority">{badge}</span>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e8eaf0' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function Dashboard({ userState, spendStats, credits, onNavigate }) {
  const points = useMemo(() => userState?.points ?? {}, [userState]);
  const goals = useMemo(() => userState?.goals ?? {}, [userState]);
  const priorities = userState?.priorities ?? {};

  const totalValue = useMemo(() => {
    return PROGRAMS.reduce((sum, p) => {
      const bal = points[p.id]?.balance || 0;
      return sum + bal * (p.cpp / 100);
    }, 0);
  }, [points]);

  const vaPool = useMemo(() => {
    const chaseUR = points.chaseUR?.balance || 0;
    const amexMR = points.amexMR?.balance || 0;
    const bilt = points.biltPoints?.balance || 0;
    const va = points.virginAtlantic?.balance || 0;
    return { chaseUR, amexMR, bilt, va, total: chaseUR + amexMR + bilt + va };
  }, [points]);

  const biltSpend = spendStats?.biltWelcomeSpend || 0;
  const biltTarget = goals.biltWelcome?.targetSpend || 4000;
  const biltPct = Math.min(100, (biltSpend / biltTarget) * 100);

  const mqds = useMemo(() => {
    const flying = goals.deltaStatus?.currentMQDsFromFlying || 0;
    const headstart = goals.deltaStatus?.headstartClaimed ? (goals.deltaStatus?.headstartAmount || 5000) : 0;
    const drpSpend = spendStats?.ytdSpend?.deltaReservePersonal || 0;
    const drbSpend = spendStats?.ytdSpend?.deltaReserveBusiness || 0;
    const fromDrp = drpSpend * 0.1;
    const fromDrb = drbSpend * 0.1;
    const total = flying + headstart + fromDrp + fromDrb;
    const target = goals.deltaStatus?.targetMQDs || 28000;
    return { flying, headstart, fromDrp, fromDrb, total, target, remaining: Math.max(0, target - total) };
  }, [goals, spendStats]);

  const creditAlerts = useMemo(() => {
    return (credits || []).filter(c => !c.used && c.daysUntilReset <= 7);
  }, [credits]);

  const londonTarget = (userState.londonTrips?.targetTrips || 2) * (userState.londonTrips?.milesPerPersonRT || 150000);
  const londonGap = Math.max(0, londonTarget - vaPool.total);
  const londonPct = Math.min(100, (vaPool.total / londonTarget) * 100);
  const mqPct = Math.min(100, (mqds.total / mqds.target) * 100);

  const monthlyCredits = (credits || []).filter(c => c.type === 'monthly' || c.type === 'configurable');

  if (!userState) return <div style={{ color: '#8892b0', padding: 24 }}>Loading...</div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e8eaf0', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Command Center
        </h1>
        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Credit Alerts */}
      {creditAlerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="alert-warning alert-banner" style={{ marginBottom: 8 }}>
            <AlertTriangle size={15} />
            <span><strong>{creditAlerts.length} credit{creditAlerts.length > 1 ? 's' : ''}</strong> expiring within 7 days — use them now!</span>
            <button className="btn btn-warning btn-sm" style={{ marginLeft: 'auto' }} onClick={() => onNavigate('credits')}>
              View <ArrowRight size={11} />
            </button>
          </div>
          {creditAlerts.slice(0, 3).map(c => (
            <div key={c.id} className="alert-danger alert-banner" style={{ marginBottom: 4, fontSize: '0.76rem' }}>
              <span style={{ opacity: 0.7 }}>↳</span>
              <strong>{c.label}</strong> — <CardLogo cardId={c.card} size="xs" /> — {c.daysUntilReset}d left
              {c.maxAmount != null && (
                <span className="tag tag-alert" style={{ marginLeft: 8 }}>
                  ${c.maxAmount}{c.type === 'monthly' || c.type === 'configurable' ? '/mo' : c.type === 'quarterly' ? '/qtr' : ''} unused
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatCard label="Est. Portfolio Value" value={fmtCurrency(totalValue)}
          sub={`Across ${PROGRAMS.length} programs`} color="#4ade80" icon={TrendingUp} glowClass="stat-glow-green" />
        <StatCard label="VA Transfer Pool" value={fmtNum(vaPool.total)}
          sub="Points → Virgin Atlantic" color="#be1230" icon={Gift} glowClass="stat-glow-red" />
        <StatCard label="Delta MQDs" value={fmtNum(Math.round(mqds.total))}
          sub={`of ${fmtNum(mqds.target)} for Diamond`} color="#e31837" icon={Target} glowClass="stat-glow-red" />
        <StatCard label="Bilt Welcome Spend" value={fmtCurrency(biltSpend)}
          sub={`of ${fmtCurrency(biltTarget)} target`} color="#7c3aed" icon={Zap} glowClass="stat-glow-purple" />
      </div>

      {/* Active Priorities */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-label" style={{ marginBottom: 14 }}>Active Spending Priorities</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {!priorities?.biltWelcomeComplete && (
            <PriorityCard title={<><CardLogo cardId="biltPalladium" size="sm" /> Welcome Bonus</>} color="#7c3aed" badge="#1 PRIORITY">
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.74rem', color: '#8892b0' }}>Spend progress</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono" style={{ fontSize: '0.78rem', color: '#e8eaf0' }}>
                      {fmtCurrency(biltSpend)} / {fmtCurrency(biltTarget)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 700 }}>
                      {biltPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <ProgressBar pct={biltPct} color="#7c3aed" />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                <span className="mono" style={{ color: '#a78bfa' }}>{fmtCurrency(Math.max(0, biltTarget - biltSpend))}</span> more needed &bull;{' '}
                Earn <span className="mono" style={{ color: '#e8eaf0' }}>{fmtNum(goals.biltWelcome?.bonusPoints || 100000)}</span> bonus points on completion &bull;{' '}
                Use for dining (3x), travel (2x), and all other spend (1x)
              </div>
            </PriorityCard>
          )}

          {priorities?.diamondPushActive && (
            <PriorityCard title={<><CardLogo cardId="deltaReservePersonal" size="sm" /> Diamond MQD Boost</>} color="#c8102e"
              badge={priorities?.biltWelcomeComplete ? '#1 PRIORITY' : '#2 PRIORITY'}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.74rem', color: '#8892b0' }}>MQD progress</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="mono" style={{ fontSize: '0.78rem', color: '#e8eaf0' }}>
                      {fmtNum(Math.round(mqds.total))} / {fmtNum(mqds.target)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>
                      {mqPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <ProgressBar pct={mqPct} color="#c8102e" />
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.73rem', color: '#64748b' }}>
                <span>✓ Headstart: <span className="mono" style={{ color: '#e8eaf0' }}>+{fmtNum(mqds.headstart)}</span></span>
                <span>✈ Flying: <span className="mono" style={{ color: '#e8eaf0' }}>+{fmtNum(mqds.flying)}</span></span>
                <span>💳 Card spend: <span className="mono" style={{ color: '#e8eaf0' }}>+{fmtNum(Math.round(mqds.fromDrp + mqds.fromDrb))}</span></span>
                <span style={{ color: '#f87171' }}>Remaining: <span className="mono">{fmtNum(Math.round(mqds.remaining))}</span></span>
              </div>
            </PriorityCard>
          )}

          <PriorityCard title={<><CardLogo cardId="chaseSapphireReserve" size="sm" /> Maximize Bonus Categories</>} color="#0f4dc4" badge="#3 WATCH">
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
              Don't leave 10x on the table. Book hotels and car rentals via{' '}
              <span style={{ color: '#60a5fa' }}>Chase Travel</span> for 10x UR points &bull;{' '}
              Flights via Chase Travel earn 5x &bull;{' '}
              All dining + travel earn 3x automatically. Transfer UR → VA at 1:1 for London.
            </div>
          </PriorityCard>
        </div>
      </div>

      <div className="section-divider" />

      {/* This Month's Credits */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="section-label">This Month's Credits</div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('credits')}>
            View All <ArrowRight size={11} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
          {monthlyCredits.map(c => {
            const urgent = !c.used && c.daysUntilReset <= 3;
            const warning = !c.used && c.daysUntilReset <= 7 && !urgent;
            return (
              <div key={c.id} className={`glass ${urgent ? 'credit-urgent-bg' : warning ? 'credit-warning-bg' : ''}`} style={{
                padding: '14px 16px',
                borderTop: `2px solid ${c.used ? '#1e2d4a' : urgent ? '#ef4444' : warning ? '#f59e0b' : '#253560'}`,
                opacity: c.used ? 0.55 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: c.used ? '#64748b' : '#e8eaf0' }}>
                    {c.icon} {c.label}
                  </div>
                  <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: c.used ? '#64748b' : '#4ade80' }}>
                    ${c.maxAmount}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <CardLogo cardId={c.card} size="xs" />
                  {c.used ? (
                    <span style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 700 }}>
                      {c.detectedViePlaid ? '✓ auto' : '✓ used'}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: urgent ? '#ef4444' : warning ? '#f59e0b' : '#64748b', fontWeight: urgent || warning ? 700 : 400 }}>
                      {c.daysUntilReset}d left
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* London Planner Snapshot */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="section-label">London Business Class — Status</div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('london')}>
            Details <ArrowRight size={11} />
          </button>
        </div>
        <div className="glass" style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e8eaf0', marginBottom: 4 }}>
                {userState.londonTrips?.targetTrips || 2} × Round Trip Upper Class (JFK/EWR → LHR)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Target: <span className="mono" style={{ color: '#e8eaf0' }}>{fmtNum(londonTarget)}</span> VA miles
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {londonGap === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80' }}>
                  <CheckCircle size={16} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>READY TO BOOK</span>
                </div>
              ) : (
                <div>
                  <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                    -{fmtNum(londonGap)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>miles needed</div>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginBottom: 6 }}>
              <span>{londonPct.toFixed(0)}% funded</span>
              <span className="mono" style={{ color: '#e8eaf0' }}>{fmtNum(vaPool.total)} / {fmtNum(londonTarget)}</span>
            </div>
            <ProgressBar pct={londonPct} color="#be1230" />
          </div>
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #1e2d4a', paddingTop: 12 }}>
            {[
              { label: 'VA Direct', programId: 'virginAtlantic', val: vaPool.va, color: '#be1230' },
              { label: 'Amex MR', programId: 'amexMR', val: vaPool.amexMR, color: '#00a651' },
              { label: 'Chase UR', programId: 'chaseUR', val: vaPool.chaseUR, color: '#0f4dc4' },
              { label: 'Bilt', programId: 'biltPoints', val: vaPool.bilt, color: '#7c3aed' },
            ].map((src, i) => (
              <div key={src.label} style={{
                flex: 1, textAlign: 'center',
                borderRight: i < 3 ? '1px solid #1e2d4a' : 'none',
                padding: '0 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <ProgramMark programId={src.programId} size="sm" />
                <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: src.val > 0 ? src.color : '#374151' }}>
                  {fmtNum(src.val)}
                </div>
                <div style={{ fontSize: '0.58rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {src.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
