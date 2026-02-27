import { useState, useMemo } from 'react';
import { Zap, Info, CheckCircle } from 'lucide-react';
import { SPEND_CATEGORIES, getSpendRecommendations } from '../data/spendAdvisor.js';
import { CARD_MAP } from '../data/cards.js';
import { CardLogo } from '../components/Logos.jsx';

function tagClassName(tag) {
  if (tag.includes('PRIORITY')) return 'tag-priority';
  if (tag.includes('EXCELLENT') || tag.includes('10x')) return 'tag-excellent';
  if (tag.includes('STRONG') || tag.includes('5x') || tag.includes('3x')) return 'tag-strong';
  if (tag.includes('GOOD') || tag.includes('2x') || tag.includes('1.5x')) return 'tag-good';
  return 'tag-info';
}

function RankBadge({ rank }) {
  const colors = ['#f59e0b', '#94a3b8', '#b5975a'];
  const labels = ['1st', '2nd', '3rd'];
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
      background: `${colors[rank - 1] || '#253560'}22`,
      border: `1px solid ${colors[rank - 1] || '#253560'}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.68rem', fontWeight: 800, color: colors[rank - 1] || '#4a5568',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {labels[rank - 1] || `${rank}`}
    </div>
  );
}

function RecommendationRow({ rec, rank }) {
  const card = CARD_MAP[rec.cardId];
  const isTop = rank === 1;

  return (
    <div className={`glass ${rank === 1 ? 'glass-hover' : ''}`} style={{
      padding: '12px 14px',
      borderLeft: `3px solid ${isTop ? card?.color || '#60a5fa' : '#1a2540'}`,
      opacity: rank > 3 ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <RankBadge rank={rank} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <CardLogo cardId={rec.cardId} size="sm" />
            {rec.tags.map(tag => (
              <span key={tag} className={`tag ${tagClassName(tag)}`}>{tag}</span>
            ))}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#8892b0', marginBottom: rec.note ? 6 : 0 }}>
            {rec.reasoning}
          </div>
          {rec.note && (
            <div style={{ fontSize: '0.7rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Info size={10} />{rec.note}
            </div>
          )}
          {rec.mqdsRate && (
            <div style={{ fontSize: '0.68rem', color: '#e31837', marginTop: 4 }}>
              + {(rec.mqdsRate * 100).toFixed(0)} MQDs per $10 toward Diamond status
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: isTop ? '#4ade80' : '#8892b0' }}>
            {rec.earnRate}x
          </div>
          <div style={{ fontSize: '0.65rem', color: '#4a5568' }}>
            ≈{rec.estimatedCpp.toFixed(1)}¢/$ value
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpendAdvisor({ userState, spendStats }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const priorities = userState?.priorities || {};

  const biltSpend = spendStats?.biltWelcomeSpend || 0;
  const biltTarget = userState?.goals?.biltWelcome?.targetSpend || 4000;
  const biltComplete = priorities.biltWelcomeComplete || biltSpend >= biltTarget;

  const recommendations = useMemo(() => {
    if (!selectedCategory) return [];
    return getSpendRecommendations(selectedCategory, {
      biltWelcomeComplete: biltComplete,
      diamondPushActive: priorities.diamondPushActive !== false,
    });
  }, [selectedCategory, biltComplete, priorities.diamondPushActive]);

  const activePriorities = [];
  if (!biltComplete) activePriorities.push({ label: 'Bilt Welcome Bonus', color: '#7c3aed', desc: `$${Math.max(0, biltTarget - biltSpend).toLocaleString()} to goal` });
  if (priorities.diamondPushActive && biltComplete) activePriorities.push({ label: 'Delta Diamond MQD Push', color: '#e31837', desc: 'Maximize Delta Reserve Personal spend' });

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e8eaf0', marginBottom: 4 }}>
          <Zap size={18} style={{ display: 'inline', marginRight: 8, color: '#f59e0b' }} />
          Spend Advisor
        </h2>
        <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>
          Get ranked card recommendations based on your current priorities and spend category
        </div>
      </div>

      {/* Active priorities */}
      {activePriorities.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Active Priorities (affecting recommendations)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {activePriorities.map(p => (
              <div key={p.label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: `${p.color}11`, border: `1px solid ${p.color}33`,
                borderRadius: 6, padding: '6px 10px',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: p.color }}>{p.label}</span>
                <span style={{ fontSize: '0.72rem', color: '#8892b0' }}>— {p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category picker */}
      <div style={{ marginBottom: 20 }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Select Spend Category</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 6 }}>
          {SPEND_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {selectedCategory && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <div className="section-label" style={{ marginBottom: 4 }}>
              Recommendations for: {SPEND_CATEGORIES.find(c => c.id === selectedCategory)?.label}
            </div>
            {biltComplete === false && (
              <div className="alert-warning alert-banner" style={{ fontSize: '0.75rem', padding: '7px 12px' }}>
                <Zap size={12} />
                Bilt is ranked higher than usual due to active welcome bonus priority
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recommendations.map((rec, i) => (
              <RecommendationRow key={rec.cardId} rec={rec} rank={i + 1} />
            ))}
          </div>

          {/* Quick note for special cases */}
          {selectedCategory === 'rent' && (
            <div className="alert-success alert-banner" style={{ marginTop: 12, fontSize: '0.75rem' }}>
              <CheckCircle size={12} />
              Rent: Bilt wins by default — it's the only card that earns points with zero transaction fees
            </div>
          )}
          {(selectedCategory === 'hotels_chase_travel') && (
            <div className="alert-info alert-banner" style={{ marginTop: 12, fontSize: '0.75rem' }}>
              <Info size={12} />
              10x on Chase Sapphire Reserve is only available when booking through Chase Travel portal (travel.chase.com)
            </div>
          )}
          {(selectedCategory === 'flights_delta' || selectedCategory === 'flights_other') && (
            <div className="alert-info alert-banner" style={{ marginTop: 12, fontSize: '0.75rem' }}>
              <Info size={12} />
              Amex Platinum earns 5x only when booking direct with the airline or through Amex Travel. Chase 5x requires Chase Travel portal.
              Delta Reserve cards earn MQDs on Delta purchases for Diamond push.
            </div>
          )}
        </div>
      )}

      {!selectedCategory && (
        <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
          <Zap size={24} color="#253560" style={{ margin: '0 auto 12px' }} />
          <div style={{ color: '#4a5568', fontSize: '0.85rem' }}>Select a spend category above to get personalized card recommendations</div>
        </div>
      )}

      {/* Quick reference table */}
      <div style={{ marginTop: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Quick Reference — Earn Rates by Category</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2540' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px', color: '#4a5568', fontWeight: 700 }}>Category</th>
                {['amexPlatBiz', 'deltaReserveBusiness', 'deltaReservePersonal', 'chaseSapphireReserve', 'biltPalladium'].map(cid => (
                  <th key={cid} style={{ textAlign: 'center', padding: '6px 8px' }}>
                    <CardLogo cardId={cid} size="xs" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPEND_CATEGORIES.slice(0, 8).map(cat => {
                const getRate = (cardId) => {
                  const matrix = {
                    amexPlatBiz: { rent:1, dining:1, flights_delta:5, flights_other:5, hotels_direct:1, hotels_chase_travel:1, transit_rideshare:1, wireless:1.5 },
                    deltaReserveBusiness: { rent:1, dining:1, flights_delta:3, flights_other:1, hotels_direct:1, hotels_chase_travel:1, transit_rideshare:1.5, wireless:1.5 },
                    deltaReservePersonal: { rent:1, dining:2, flights_delta:3, flights_other:1, hotels_direct:1, hotels_chase_travel:1, transit_rideshare:1, wireless:1 },
                    chaseSapphireReserve: { rent:1, dining:3, flights_delta:3, flights_other:3, hotels_direct:3, hotels_chase_travel:10, transit_rideshare:3, wireless:1 },
                    biltPalladium: { rent:1, dining:3, flights_delta:2, flights_other:2, hotels_direct:2, hotels_chase_travel:1, transit_rideshare:2, wireless:1 },
                  };
                  return matrix[cardId]?.[cat.id] || 1;
                };
                return (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #0c1224' }}>
                    <td style={{ padding: '5px 10px', color: '#8892b0' }}>{cat.icon} {cat.label}</td>
                    {['amexPlatBiz','deltaReserveBusiness','deltaReservePersonal','chaseSapphireReserve','biltPalladium'].map(cid => {
                      const r = getRate(cid);
                      const color = r >= 5 ? '#4ade80' : r >= 3 ? '#60a5fa' : r >= 2 ? '#a78bfa' : r >= 1.5 ? '#fbbf24' : '#4a5568';
                      return (
                        <td key={cid} style={{ textAlign: 'center', padding: '5px 8px' }}>
                          <span className="mono" style={{ color, fontWeight: r > 1 ? 700 : 400 }}>{r}x</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
