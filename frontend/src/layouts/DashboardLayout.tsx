import React, { useState } from 'react';
import PixelBlast from '../components/PixelBlast';
import { PlayerTicker } from '../components/PlayerTicker';
import PillNav from '../components/PillNav';
import { AudioPlayer } from '../components/AudioPlayer';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Swords,
  Brain,
  History,
  Heart,
  Bookmark,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

import lebronBg from '../assets/lebron_bg.png';
import playerLeftBg from '../assets/player_left_bg.png';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { username: string; email?: string } | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onReturnToLanding: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onLoginClick,
  onReturnToLanding,
}) => {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const navigationItems: SidebarItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
    { name: 'Team Builder', icon: Wrench, id: 'teambuilder' },
    { name: 'Matchups', icon: Swords, id: 'matchups' },
    { name: 'Era Analytics', icon: History, id: 'eraanalytics' },
    { name: 'My Teams', icon: Heart, id: 'myteams' },
    { name: 'Saved Matchups', icon: Bookmark, id: 'savedmatchups' },
    { name: 'Settings', icon: Settings, id: 'settings' },
  ];

  // Map to PillNav structure
  const pillNavItems = navigationItems.map(item => ({
    label: item.name,
    href: item.id
  }));

  return (
    <div className="relative min-h-screen bg-bg-dark text-brand-offwhite px-4 py-6 md:px-8 md:py-8 selection:bg-brand-blue/20 overflow-x-hidden lg:pr-[360px]">
      {/* Background PixelBlast Effect */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <PixelBlast
          variant="circle"
          pixelSize={4}
          color="#C9082A"
          patternScale={2.5}
          patternDensity={1.2}
          pixelSizeJitter={0.3}
          enableRipples={false}
          speed={0.4}
          edgeFade={0.3}
          transparent
        />
      </div>

      {/* Left Player Faded Background Image Overlay positioned on the left side */}
      {activeTab !== 'matchups' && (
        <div className="fixed top-0 bottom-0 left-0 z-0 w-full md:w-[40%] pointer-events-none opacity-[0.15] mix-blend-screen flex items-end justify-start">
          <img 
            src={playerLeftBg} 
            alt="NBA Player Background Left" 
            className="h-[85vh] w-auto object-contain object-bottom select-none translate-x-[10%] scale-x-[-1]"
          />
        </div>
      )}

      {/* Lebron James Faded Background Image Overlay positioned leftward to avoid sidebar cover */}
      {activeTab !== 'matchups' && (
        <div className="fixed top-0 bottom-0 right-0 z-0 w-full md:w-[70%] pointer-events-none opacity-[0.15] mix-blend-screen flex items-end justify-end">
          <img 
            src={lebronBg} 
            alt="Lebron James Background" 
            className="h-[85vh] w-auto object-contain object-bottom select-none -translate-x-[25%]"
          />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Camouflaged Bento Navigation Header */}
        <header
          className={`group relative overflow-hidden rounded-3xl border border-bg-border bg-bg-card p-5 transition-all duration-500 hover:border-brand-slate shadow-lg mb-8`}
        >
          {/* Subtle background court grid pattern inside header card */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            {/* Primary Header Row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
              {/* Brand logos removed to save space and align menu to the left */}

              {/* PillNav Navigation component (Uses the whole left/middle space now) */}
              <div className="flex-grow flex items-center justify-start md:px-1">
                <PillNav
                  items={pillNavItems}
                  activeHref={activeTab}
                  onTabChange={(href) => setActiveTab(href)}
                  baseColor="#0B0F19"
                  pillColor="#18181b"
                  hoveredPillTextColor="#C8102E"
                  pillTextColor="#FAF9F6"
                  initialLoadAnimation={true}
                />
              </div>

              {/* Navigation Drawer Menu Toggle Button */}
              <div className="flex items-center gap-2">
                <AudioPlayer />
                <button
                  onClick={onReturnToLanding}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 px-3.5 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                >
                  <History className="h-4 w-4" />
                  <span>Landing</span>
                </button>
                {user ? (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-dark/45 border border-bg-border text-xs font-semibold">
                    <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
                    {user.username}
                  </div>
                ) : (
                  <button
                    onClick={onLoginClick}
                    className="rounded-xl bg-white text-black hover:bg-zinc-200 px-4 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
                  >
                    Authenticate
                  </button>
                )}
                <button
                  onClick={() => setIsMenuExpanded(!isMenuExpanded)}
                  className="flex items-center gap-2 rounded-xl border border-bg-border hover:border-brand-slate bg-bg-dark/60 hover:bg-bg-dark px-4 py-2.5 text-xs font-bold text-brand-offwhite/85 hover:text-white transition-all shadow-inner cursor-pointer whitespace-nowrap"
                >
                  <span className="tracking-wide">Explore Platform</span>
                  {isMenuExpanded ? (
                    <ChevronUp className="h-4 w-4 text-brand-blue transition-transform duration-300" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-brand-offwhite/50 transition-transform duration-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Navigation Grid - Smooth transition height */}
            <div
              className={`grid transition-all duration-500 ease-in-out ${
                isMenuExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden space-y-6">
                <hr className="border-bg-border" />
                
                {/* Full grid of links */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMenuExpanded(false);
                        }}
                        className={`group flex items-center gap-3 rounded-2xl p-3 text-left border transition-all duration-300 ${
                          isActive
                            ? 'bg-bg-dark border-bg-border text-white shadow-inner'
                            : 'bg-bg-dark/10 border-transparent text-brand-offwhite/60 hover:border-bg-border hover:bg-bg-dark/40 hover:text-white'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
                            isActive
                              ? 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue'
                              : 'bg-bg-dark border-bg-border text-brand-offwhite/50 group-hover:text-brand-offwhite/80'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold tracking-wide">{item.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Section inside expanding header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-bg-border">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-bg-dark/20 border border-bg-border/60">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 flex items-center justify-center border border-zinc-800">
                          <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-brand-offwhite">{user.username}</span>
                          <span className="text-[9px] text-brand-offwhite/50 font-medium">{user.email || 'Analyst Session Active'}</span>
                        </div>
                      </div>

                      <button
                        onClick={onLogout}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-red-450/90 hover:bg-red-950/15 hover:text-red-400 transition-all border border-transparent hover:border-red-900/30 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 py-1.5">
                      <span className="text-xs text-brand-offwhite/50">Gain access to team builders, matchup simulations, and AI recommendations.</span>
                      <button
                        onClick={() => {
                          setIsMenuExpanded(false);
                          onLoginClick();
                        }}
                        className="rounded-xl bg-white text-black hover:bg-zinc-200 px-5 py-2.5 text-xs font-bold transition-all shadow-lg shadow-white/5 cursor-pointer shrink-0"
                      >
                        Sign In / Register
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Content */}
        <main className="animate-fade-in">
          {children}
        </main>
      </div>

      {/* Luxurious control panel fixed on the right side */}
      <aside className="hidden lg:block fixed top-0 right-0 bottom-0 w-[330px] bg-zinc-950/40 backdrop-blur-xl border-l border-bg-border/60 z-30 p-6 pt-10 overflow-y-auto">
        <PlayerTicker />
      </aside>
    </div>
  );
};
