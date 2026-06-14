import React, { useState, useEffect } from 'react';
import { BentoCard } from '../components/BentoCard';
import Shuffle from '../components/Shuffle';
import { AudioPlayer } from '../components/AudioPlayer';
import { Sparkles, Calendar, RefreshCw, Newspaper, ExternalLink } from 'lucide-react';
import { api } from '../data/api';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  user: { username: string; email?: string } | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab, user }) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLatestNews = async () => {
    setLoading(true);
    setIsRefreshing(true);
    try {
      const articles = await api.getBasketballNews();
      setNews(articles.slice(0, 3)); // Display top 3 latest stories
    } catch (err) {
      console.error("Failed to load live news:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 600); // Animation cooldown
    }
  };

  useEffect(() => {
    loadLatestNews();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Summary Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl flex flex-wrap gap-x-2 font-display">
            <Shuffle
              text="Welcome back,"
              tag="span"
              shuffleDirection="right"
              duration={0.4}
              stagger={0.02}
              triggerOnce={true}
              triggerOnHover={true}
              textAlign="left"
              className="text-white"
            />
            <Shuffle
              key={user?.username || 'Analyst'}
              text={user?.username || 'Analyst'}
              tag="span"
              shuffleDirection="right"
              duration={0.4}
              stagger={0.02}
              triggerOnce={true}
              triggerOnHover={true}
              textAlign="left"
              className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-orange animate-pulse"
            />
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Here's what is happening across the league and your custom simulations today.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#0B0F19]/60 border border-white/5 rounded-2xl px-4 py-2.5 backdrop-blur-md self-start md:self-auto shadow-inner">
          <Calendar className="h-4 w-4 text-[#06B6D4]" />
          <span className="text-xs font-semibold text-zinc-300">Season Simulation State: Idle</span>
        </div>
      </div>

      {/* Bento & Ticker Grid */}
      <div className="w-full">
        
        {/* Main Bento Area - Asymmetrical grid with dense Packing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-flow-row-dense self-start w-full">
          
          {/* Hero Bento Card (Large) - Spans full width of Row 1 */}
          <BentoCard
            title="Build Your Legacy. Beyond Any Era."
            subtitle="Featured Project"
            accentColor="blue"
            bgPattern="court"
            className="md:col-span-2 lg:col-span-3 min-h-[320px] flex flex-col justify-between"
          >
            <div className="my-6 max-w-xl">
              <p className="text-base text-zinc-350 leading-relaxed">
                Create legendary teams, simulate matchups, and discover insights across NBA history. Match up the '96 Bulls with the '17 Warriors or build a unique fantasy squad of cross-era superstars.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-auto">
              <button 
                onClick={() => setActiveTab('teambuilder')}
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 cursor-pointer"
              >
                Start Building
              </button>
              <span className="text-xs font-semibold text-zinc-550 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#06B6D4]" />
                Supported by AI Insights
              </span>
            </div>
          </BentoCard>

          {/* Team Builder Card - Asymmetrical Column */}
          <div 
            onClick={() => setActiveTab('teambuilder')}
            className="lg:col-span-2 min-h-[260px] relative overflow-hidden rounded-3xl border border-white/5 bg-[#0B0F19] p-6 hover:border-[#06B6D4]/30 hover:scale-[1.02] transition-all duration-300 group cursor-pointer flex flex-col justify-between"
          >
            {/* Pulsing neon perimeter outline court overlay */}
            <div className="absolute inset-0 border-2 border-dashed border-[#06B6D4]/20 rounded-3xl pointer-events-none group-hover:border-[#06B6D4]/60 group-hover:animate-pulse transition-all duration-300" />
            <div className="absolute right-4 top-4 opacity-5 pointer-events-none w-48 h-48 bg-[#06B6D4] rounded-full blur-3xl group-hover:opacity-10 transition-opacity" />

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-[#06B6D4] font-black">Interactive court</span>
              <h3 className="text-2xl font-black text-white tracking-tighter">Team Builder</h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-2 leading-relaxed">
                Assemble your legendary roster from players across multiple eras and evaluate their compatibility on our tactical court design.
              </p>
            </div>

            {/* Tactical Mini Court Preview Overlay */}
            <div className="h-24 w-full rounded-2xl bg-zinc-950/40 border border-zinc-900 overflow-hidden relative mt-4">
              <div className="absolute inset-0 bg-[radial-gradient(#06B6D4_1px,transparent_1px)] bg-[size:12px_12px] opacity-10" />
              <svg className="absolute inset-0 h-full w-full stroke-zinc-800 fill-none" strokeWidth="1">
                <circle cx="50%" cy="50%" r="20" />
                <rect x="10%" y="10%" width="80%" height="80%" />
                <path d="M 50% 10 L 50% 90" />
              </svg>
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-[#06B6D4] animate-ping" />
              <div className="absolute top-1/2 left-3/4 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-[#8B5CF6] animate-ping" />
            </div>
          </div>

          {/* Matchup Simulator Card */}
          <div 
            onClick={() => setActiveTab('matchups')}
            className="lg:col-span-1 lg:row-span-2 min-h-[540px] relative overflow-hidden rounded-3xl border border-white/5 bg-[#0B0F19] p-6 hover:border-[#F59E0B]/30 hover:scale-[1.02] transition-all duration-300 group cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-black">Simulator</span>
              <h3 className="text-2xl font-black text-white tracking-tighter">Matchup Arena</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Instantly simulate matchups using rule-based calculations or our advanced PyTorch neural net engine.
              </p>
            </div>

            {/* Static preview showing dual neon bars */}
            <div className="flex flex-col gap-4 my-6 py-4 bg-zinc-950/40 border border-zinc-900/60 rounded-2xl p-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#06B6D4]">TEAM ALPHA</span>
                <div className="h-2 w-24 bg-gradient-to-r from-[#06B6D4] to-cyan-800 rounded-full" />
              </div>
              
              <div className="flex justify-center items-center my-1">
                <div className="h-9 w-9 rounded-full bg-zinc-900 border border-[#F59E0B]/30 flex items-center justify-center text-xs font-black text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all">
                  VS
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#F59E0B]">TEAM BETA</span>
                <div className="h-2 w-24 bg-gradient-to-r from-[#F59E0B] to-amber-800 rounded-full" />
              </div>
            </div>

            <button className="w-full py-3.5 rounded-xl border border-[#F59E0B]/20 group-hover:border-[#F59E0B]/50 hover:bg-[#F59E0B]/5 text-xs font-bold text-zinc-300 group-hover:text-white transition-all uppercase tracking-wider">
              Launch Simulation
            </button>
          </div>

          {/* Analytics Dashboard Card */}
          <div 
            onClick={() => setActiveTab('eraanalytics')}
            className="lg:col-span-1 min-h-[260px] relative overflow-hidden rounded-3xl border border-white/5 bg-[#0B0F19] p-6 hover:border-[#8B5CF6]/30 hover:scale-[1.02] transition-all duration-300 group cursor-pointer flex flex-col justify-between shadow-[0_0_40px_rgba(139,92,246,0.02)]"
          >
            {/* Glowing purple aura backdrop */}
            <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#8B5CF6]/20 transition-all duration-500" />
            
            {/* Background vector sparkline */}
            <svg className="absolute inset-x-0 bottom-0 h-24 w-full stroke-zinc-900 stroke-2 fill-none pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity" viewBox="0 0 300 100">
              <path d="M 0 80 Q 50 20 100 60 T 200 10 T 300 90" className="stroke-[#8B5CF6]" />
            </svg>

            <div className="space-y-1.5 z-10">
              <span className="text-[10px] uppercase tracking-widest text-[#8B5CF6] font-black">Metrics</span>
              <h3 className="text-2xl font-black bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent tracking-tighter">
                Analytics Dashboard
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Dive deep into scoring averages, pace translations, and decade evolution trends.
              </p>
            </div>

            <div className="z-10 flex justify-end">
              <span className="text-[10px] font-bold text-[#8B5CF6] group-hover:text-white flex items-center gap-1 uppercase tracking-wider bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-3 py-1.5 rounded-xl transition-all">
                View Analytics
              </span>
            </div>
          </div>




          {/* Era Analytics Preview Card */}
          <div 
            onClick={() => setActiveTab('eraanalytics')}
            className="lg:col-span-1 min-h-[260px] relative overflow-hidden rounded-3xl border border-white/5 bg-[#0B0F19] p-6 hover:border-[#C9082A]/30 hover:scale-[1.02] transition-all duration-300 group cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-[#C9082A] font-black">History</span>
              <h3 className="text-2xl font-black text-white tracking-tighter">Era Explorer</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Compare adjusted paces and rule differences between 1990s defense and modern spaces.
              </p>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Decades: 1960 - Modern</span>
              <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 group-hover:text-white transition-colors">
                Explore Eras &rarr;
              </span>
            </div>
          </div>

          {/* Live News Feed Bento Card */}
          <div 
            onClick={loadLatestNews}
            className="lg:col-span-1 min-h-[300px] relative overflow-hidden rounded-3xl border border-white/5 bg-[#0B0F19] p-6 hover:border-[#10B981]/30 hover:scale-[1.02] transition-all duration-300 group cursor-pointer flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.01)] w-full"
          >
            {/* Soft Emerald Glow Backdrop */}
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#10B981]/15 transition-all duration-500" />
            
            {/* Header Area */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-[#10B981]" />
                <span className="text-[10px] uppercase tracking-widest text-[#10B981] font-black">Live Ticker</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Pulsing neon status indicator */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-400">Live</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    loadLatestNews();
                  }}
                  className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 text-zinc-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            {/* Title & Body */}
            <div className="mt-3 flex-grow z-10 flex flex-col justify-between">
              <h3 className="text-xl font-black text-white tracking-tighter mb-3">Basketball Headlines</h3>
              {loading && news.length === 0 ? (
                /* Skeleton Loader */
                <div className="space-y-3 flex-grow">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-start gap-2">
                      <div className="h-2 w-2 bg-zinc-800 rounded-full mt-1.5" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-zinc-800 rounded w-full" />
                        <div className="h-2 bg-zinc-850 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Articles List */
                <div className="space-y-3.5 flex-grow">
                  {news.map((art, idx) => (
                    <a 
                      key={idx}
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} // Let links open in a new tab without reloading
                      className="group/item flex items-start gap-2 py-1 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.01] transition-all"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-[#10B981] mt-2 group-hover/item:scale-125 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-200 line-clamp-2 leading-snug group-hover/item:text-[#10B981] transition-colors">
                          {art.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-black text-[#10B981]/75 tracking-wider uppercase">
                            {art.source}
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            {art.published_at ? new Date(art.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="h-3 w-3 text-zinc-500 opacity-0 group-hover/item:opacity-100 transition-opacity mt-1 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <span>Click Card to Refresh</span>
              <span className="group-hover:text-emerald-400 transition-colors">Latest News &rarr;</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
