import { useState } from 'react';
import { Star, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { CARDS } from '../data/cards.js';

function BenefitRow({ benefit }) {
  const typeColor = { credit: '#4ade80', perk: '#60a5fa', status: '#f59e0b' };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #0c1224' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: '0.8rem', color: '#e8eaf0', fontWeight: 500 }}>
            {benefit.icon} {benefit.label}
          </span>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: typeColor[benefit.type] || '#4a5568', background: `${typeColor[benefit.type] || '#253560'}11`, border: `1px solid ${typeColor[benefit.type] || '#253560'}33`, borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase' }}>
            {benefit.type}
          </span>
        </div>
        {benefit.note && (
          <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>{benefit.note}</div>
        )}
      </div>
      {benefit.amount && (
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <div className="mono" style={{ fontWeight: 700, color: '#4ade80', fontSize: '0.85rem' }}>
            ${benefit.amount.toLocaleString()}
          </div>
          {benefit.cadence && (
            <div style={{ fontSize: '0.65rem', color: '#4a5568' }}>{benefit.cadence}</div>
          )}
        </div>
      )}
    </div>
  );
}

function EarnRateRow({ rate }) {
  const pointColor = rate.rate >= 5 ? '#4ade80' : rate.rate >= 3 ? '#60a5fa' : rate.rate >= 2 ? '#a78bfa' : rate.rate >= 1.5 ? '#fbbf24' : '#8892b0';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid #0c1224' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: '#e8eaf0' }}>{rate.icon} {rate.category}</div>
        {rate.note && <div style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 2 }}>{rate.note}</div>}
      </div>
      <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: pointColor, flexShrink: 0, marginLeft: 12 }}>
        {rate.rate}x
      </div>
    </div>
  );
}

function TransferPartner({ partner }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', borderRadius: 5,
      background: partner.highlight ? 'rgba(190,18,48,0.12)' : '#0c1224',
      border: `1px solid ${partner.highlight ? 'rgba(190,18,48,0.3)' : '#1a2540'}`,
      fontSize: '0.72rem', fontWeight: partner.highlight ? 700 : 500,
      color: partner.highlight ? '#f87171' : '#8892b0',
    }}>
      {partner.icon} {partner.name}
      {partner.ratio && <span style={{ color: '#4a5568', marginLeft: 2 }}>({partner.ratio})</span>}
    </div>
  );
}

export default function CardsView({ credits = [] }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e8eaf0', marginBottom: 4 }}>
          <Star size={18} style={{ display: 'inline', marginRight: 8, color: '#f59e0b' }} />
          Cards & Benefits
        </h2>
        <div style={{ fontSize: '0.78rem', color: '#8892b0' }}>Complete benefit reference for all 5 cards</div>
      </div>

      {/* Annual fee ROI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
        {CARDS.map(card => {
          const fullCreditValue = card.benefits
            .filter(b => b.type === 'credit' && b.amount)
            .reduce((s, b) => {
              if (b.cadence?.includes('monthly')) return s + b.amount * 12;
              if (b.cadence?.includes('quarterly')) return s + b.amount * 4;
              if (b.cadence?.includes('semi')) return s + b.amount * 2;
              return s + (b.amount || 0);
            }, 0);
          const captured = credits
            .filter(c => c.card === card.id && c.used && c.maxAmount != null)
            .reduce((s, c) => s + (c.maxAmount || 0), 0);
          const netRoi = captured - card.annualFee;
          const hasCapture = captured > 0;
          return (
            <div key={card.id} className="glass" style={{ padding: '12px 14px', borderLeft: `3px solid ${card.color}` }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: card.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {card.shortName}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#4a5568', marginBottom: 2 }}>Annual fee</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
                −${card.annualFee.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#4a5568', marginBottom: 2 }}>Credits captured YTD</div>
              <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: hasCapture ? '#4ade80' : '#4a5568', marginBottom: 4 }}>
                {hasCapture ? `+$${captured.toLocaleString()}` : '—'}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#4a5568', marginBottom: 2 }}>Full annual potential</div>
              <div className="mono" style={{ fontSize: '0.82rem', color: '#60a5fa' }}>
                +${fullCreditValue.toLocaleString()}
              </div>
              {hasCapture && (
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #1a2540', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.62rem', color: '#4a5568' }}>Net ROI</span>
                  <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: netRoi >= 0 ? '#4ade80' : '#f87171' }}>
                    {netRoi >= 0 ? '+' : ''}${netRoi.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Card details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CARDS.map(card => {
          const isExpanded = expanded === card.id;
          const creditValue = card.benefits
            .filter(b => b.type === 'credit' && b.amount)
            .reduce((s, b) => {
              if (b.cadence?.includes('monthly')) return s + b.amount * 12;
              if (b.cadence?.includes('quarterly')) return s + b.amount * 4;
              if (b.cadence?.includes('semi')) return s + b.amount * 2;
              return s + b.amount;
            }, 0);

          return (
            <div key={card.id} className="glass" style={{ overflow: 'hidden' }}>
              {/* Header */}
              <div
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderLeft: `4px solid ${card.color}` }}
                onClick={() => setExpanded(isExpanded ? null : card.id)}
              >
                <div style={{
                  width: 44, height: 32, borderRadius: 6, flexShrink: 0,
                  background: `${card.color}22`, border: `1px solid ${card.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800, color: card.color,
                  fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em',
                }}>
                  {card.issuer === 'American Express' ? 'AMEX' : card.issuer === 'Chase' ? 'CHASE' : 'BILT'}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e8eaf0' }}>{card.name}</span>
                    {card.currentPriority && <span className="tag tag-priority">CURRENT PRIORITY</span>}
                    {card.type === 'business' && <span className="tag tag-info">Business</span>}
                    {card.earnsMQD && <span className="tag" style={{ background: 'rgba(227,24,55,0.12)', color: '#f87171', border: '1px solid rgba(227,24,55,0.25)' }}>Earns MQDs</span>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#4a5568', marginTop: 2 }}>
                    ${card.annualFee}/yr • {card.pointCurrency} • Up to ${creditValue.toLocaleString()} annual credits
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4ade80' }}>${creditValue.toLocaleString()}</div>
                    <div style={{ fontSize: '0.62rem', color: '#4a5568' }}>credits/yr</div>
                  </div>
                  {isExpanded ? <ChevronDown size={16} color="#4a5568" /> : <ChevronRight size={16} color="#4a5568" />}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid #1a2540' }}>
                  <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                    {/* Earn rates */}
                    <div>
                      <div className="section-label" style={{ marginBottom: 8 }}>Earn Rates</div>
                      {card.earnRates.map((r, i) => <EarnRateRow key={i} rate={r} />)}
                    </div>

                    {/* Benefits */}
                    <div>
                      <div className="section-label" style={{ marginBottom: 8 }}>Benefits & Credits</div>
                      {card.benefits.map(b => <BenefitRow key={b.id} benefit={b} />)}
                    </div>
                  </div>

                  {/* Transfer partners */}
                  {card.transferPartners && (
                    <div style={{ marginTop: 16 }}>
                      <div className="section-label" style={{ marginBottom: 8 }}>Transfer Partners</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {card.transferPartners.map(p => <TransferPartner key={p.name} partner={p} />)}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {card.requirements && (
                    <div style={{ marginTop: 12 }}>
                      {card.requirements.map(r => (
                        <div key={r} className="alert-warning alert-banner" style={{ fontSize: '0.74rem', marginBottom: 4 }}>
                          ⚠️ {r}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {card.priorityNote && (
                    <div className="alert-info alert-banner" style={{ marginTop: 10, fontSize: '0.74rem' }}>
                      💡 {card.priorityNote}
                    </div>
                  )}

                  {/* Quick links */}
                  {card.quickLinks && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {card.quickLinks.map(l => (
                        <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                          <ExternalLink size={11} /> {l.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
