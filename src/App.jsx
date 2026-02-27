import { useState, useMemo, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { useUserState, useSpendStats, useCreditStatus, usePlaidItems } from './hooks/useApi.js';
import { useNotifications } from './hooks/useNotifications.js';

const Dashboard     = lazy(() => import('./views/Dashboard.jsx'));
const PointsMiles   = lazy(() => import('./views/PointsMiles.jsx'));
const CreditTracker = lazy(() => import('./views/CreditTracker.jsx'));
const SpendAdvisor  = lazy(() => import('./views/SpendAdvisor.jsx'));
const Goals         = lazy(() => import('./views/Goals.jsx'));
const LondonPlanner = lazy(() => import('./views/LondonPlanner.jsx'));
const CardsView     = lazy(() => import('./views/CardsView.jsx'));
const RedemptionCalc = lazy(() => import('./views/RedemptionCalc.jsx'));
const ConnectSync   = lazy(() => import('./views/ConnectSync.jsx'));
const WeeklyUpdate  = lazy(() => import('./views/WeeklyUpdate.jsx'));

function ViewLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4a5568', fontSize: '0.82rem' }}>
      Loading…
    </div>
  );
}

function AppInner() {
  const [view, setView] = useState('dashboard');
  const { state: userState, setState: setUserState, loading: stateLoading } = useUserState();
  const { stats: plaidStats } = useSpendStats();
  const { credits, markUsed: markCreditUsed } = useCreditStatus();
  const { items: plaidItems, reload: reloadPlaid } = usePlaidItems();

  useNotifications({ credits, pointsData: userState?.points });

  // Use Plaid-derived spend stats when available; fall back to manually entered data
  const spendStats = useMemo(() => {
    const plaidHasData = Object.values(plaidStats?.ytdSpend || {}).some(v => v > 0)
      || plaidStats?.biltWelcomeSpend > 0;
    if (plaidHasData) return plaidStats;
    const m = userState?.manualSpend;
    if (!m) return plaidStats;
    return {
      byCard: {},
      biltWelcomeSpend: m.biltWelcomeTotal || 0,
      ytdSpend: m.ytd || {},
    };
  }, [plaidStats, userState?.manualSpend]);

  const alertCounts = useMemo(() => {
    const urgentCredits = (credits || []).filter(c => !c.used && c.daysUntilReset <= 7);
    return { credits: urgentCredits.length };
  }, [credits]);

  const handleToggleCredit = async (patternId, period, used) => {
    await markCreditUsed(patternId, period, used);
  };

  if (stateLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050810' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace', color: '#253560', letterSpacing: '-0.04em', fontWeight: 800 }}>PD</div>
          <div style={{ color: '#4a5568', fontSize: '0.82rem' }}>Loading Points Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar current={view} onChange={setView} alerts={alertCounts} />
      <main className="main-content">
        <Suspense fallback={<ViewLoader />}>
          {view === 'dashboard' && (
            <Dashboard userState={userState} spendStats={spendStats} credits={credits} onNavigate={setView} />
          )}
          {view === 'weekly' && (
            <WeeklyUpdate
              userState={userState}
              onUpdateState={setUserState}
              credits={credits}
              onToggleCredit={handleToggleCredit}
            />
          )}
          {view === 'points' && (
            <PointsMiles userState={userState} onUpdateState={setUserState} />
          )}
          {view === 'credits' && (
            <CreditTracker credits={credits} userState={userState} onToggleCredit={handleToggleCredit} />
          )}
          {view === 'advisor' && (
            <SpendAdvisor userState={userState} spendStats={spendStats} />
          )}
          {view === 'goals' && (
            <Goals userState={userState} spendStats={spendStats} onUpdateState={setUserState} />
          )}
          {view === 'london' && (
            <LondonPlanner userState={userState} onUpdateState={setUserState} />
          )}
          {view === 'cards' && <CardsView credits={credits} />}
          {view === 'calc' && <RedemptionCalc />}
          {view === 'connect' && (
            <ConnectSync plaidItems={plaidItems} onReloadPlaid={reloadPlaid} />
          )}
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
