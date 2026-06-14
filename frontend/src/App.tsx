import { useState, useEffect } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TeamBuilderPage } from './pages/TeamBuilderPage';
import { MatchupsPage } from './pages/MatchupsPage';
import { EraAnalyticsPage } from './pages/EraAnalyticsPage';
// PlayersPage import removed
import { SavedMatchupsPage } from './pages/SavedMatchupsPage';
import { LandingPage } from './pages/LandingPage';
import { AuthModal } from './components/AuthModal';
import { api, getAccessToken, clearTokens } from './data/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<{ username: string; email?: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  const fetchProfile = async () => {
    if (getAccessToken()) {
      try {
        const profile = await api.getProfile();
        if (profile) {
          setUser({ username: profile.username, email: profile.email });
          setShowLanding(false); // auto-bypass landing page if already logged in
        }
      } catch (e) {
        console.warn('Profile fetch failed, probably token expired or server offline.', e);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    clearTokens();
    setUser(null);
    setActiveTab('dashboard');
    setShowLanding(true);
  };

  const handleAuthSuccess = (username: string) => {
    setUser({ username });
    fetchProfile();
    setShowLanding(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} user={user} />;
      // case 'players' removed
      case 'teambuilder':
        return <TeamBuilderPage />;
      case 'matchups':
        return <MatchupsPage />;
      case 'eraanalytics':
        return <EraAnalyticsPage />;
      case 'savedmatchups':
        return <SavedMatchupsPage />;
      case 'myteams':
        return <TeamBuilderPage />; // reuse or route to TeamBuilder where saved lineups exist
      default:
        // Render a gorgeous placeholder for subpages to keep navigation active
        return (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl h-24 w-24 mx-auto" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                <svg
                  className="h-8 w-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-bold tracking-tight text-white capitalize">
                {activeTab.replace('analytics', ' Analytics').replace('teambuilder', 'Team Builder')}
              </h2>
              <p className="text-sm text-zinc-400">
                This feature module is set up and ready for expansion. The platform foundation is fully established.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
            >
              Back to Home Base
            </button>
          </div>
        );
    }
  };

  if (showLanding) {
    return (
      <LandingPage 
        onAuthSuccess={handleAuthSuccess} 
        onEnterAsGuest={() => {
          setUser({ username: 'Guest Analyst', email: 'analyst@timelinecourt.com' });
          setShowLanding(false);
        }} 
      />
    );
  }

  return (
    <>
      <DashboardLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => setShowAuthModal(true)}
        onReturnToLanding={() => setShowLanding(true)}
      >
        {renderContent()}
      </DashboardLayout>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default App;
