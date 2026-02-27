import { LayoutDashboard, Gem, CreditCard, Zap, Target, Plane, Star, Calculator, Settings, CalendarCheck } from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'weekly', label: 'Weekly Update', icon: CalendarCheck },
  { id: 'points', label: 'Points & Miles', icon: Gem },
  { id: 'credits', label: 'Credit Tracker', icon: CreditCard },
  { id: 'advisor', label: 'Spend Advisor', icon: Zap },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'london', label: 'Trip Planner', icon: Plane },
  { id: 'cards', label: 'Cards & Benefits', icon: Star },
  { id: 'calc', label: 'Redemption Calc', icon: Calculator },
  { id: 'connect', label: 'Connect & Sync', icon: Settings },
];

export default function Sidebar({ current, onChange, alerts = {} }) {
  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1a2540' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, #1a56db, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 800, color: '#fff',
            fontFamily: 'JetBrains Mono, monospace',
            flexShrink: 0,
          }}>
            PD
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e8eaf0', lineHeight: 1.2 }}>Points</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', lineHeight: 1.2 }}>Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        <div style={{ marginBottom: 6 }}>
          <div className="section-label" style={{ padding: '0 8px', marginBottom: 6 }}>Navigation</div>
          {NAV.map(item => {
            const Icon = item.icon;
            const alertCount = alerts[item.id] || 0;
            return (
              <button
                key={item.id}
                className={`nav-item ${current === item.id ? 'active' : ''}`}
                style={{ width: '100%', background: 'none', cursor: 'pointer', position: 'relative' }}
                onClick={() => onChange(item.id)}
              >
                <Icon size={15} />
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {alertCount > 0 && (
                  <span style={{
                    background: '#e31837',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    padding: '1px 5px',
                    minWidth: 16,
                    textAlign: 'center',
                  }}>
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1a2540' }}>
        <div style={{ fontSize: '0.65rem', color: '#4a5568', lineHeight: 1.6 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#253560' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div>Points Dashboard v1.0</div>
        </div>
      </div>
    </div>
  );
}
