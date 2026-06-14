import React, { useState } from 'react';
import { DotGrid } from '../components/DotGrid';
import { SplitText } from '../components/SplitText';
import { AudioPlayer } from '../components/AudioPlayer';
import { BubbleMenu } from '../components/BubbleMenu';
import { api } from '../data/api';
import ShinyText from '../components/ShinyText';
import kyrieBg from '../assets/kyrie_bg.png';
import lukaBg from '../assets/luka_bg.png';
import { 
  Users, 
  Wrench, 
  Swords, 
  History, 
  Lock, 
  User, 
  Mail, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface LandingPageProps {
  onAuthSuccess: (username: string) => void;
  onEnterAsGuest: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAuthSuccess, onEnterAsGuest }) => {
  const [isRegister, setIsRegister] = useState(true); // default to registration per request
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await api.register({ username, email, password });
        // Auto login
        const tokens = await api.login({ username, password });
        if (tokens) {
          onAuthSuccess(username);
        }
      } else {
        const tokens = await api.login({ username, password });
        if (tokens) {
          onAuthSuccess(username);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials or server state.');
    } finally {
      setIsLoading(false);
    }
  };

  const logoNode = (
    <div className="flex items-center gap-2.5 select-none">
      <div className="h-7 w-7 rounded-lg bg-red-950/20 border border-red-900/40 flex items-center justify-center">
        <History className="h-4 w-4 text-[#C9082A]" />
      </div>
      <ShinyText
        text="TIMELINECOURT"
        speed={1.5}
        color="#ffffff"
        shineColor="#C9082A"
        spread={100}
        className="font-display font-black tracking-tighter text-xl uppercase"
      />
    </div>
  );

  const menuItems = [
    {
      label: 'Home',
      href: '#',
      rotation: -6,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
      }
    },
    {
      label: 'Launch Arena',
      href: '#dashboard',
      rotation: 6,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        onEnterAsGuest();
      }
    },
    {
      label: 'Methodology',
      href: '#methodology',
      rotation: -6,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        onEnterAsGuest();
      }
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#020617] text-[#FAF9F6] selection:bg-brand-blue/20 overflow-x-hidden font-sans flex flex-col justify-between">
      {/* Background DotGrid Effect */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <DotGrid
          dotSize={6}
          gap={18}
          baseColor="#5f010f"
          activeColor="#C9082A"
          proximity={140}
          shockRadius={240}
          shockStrength={6}
          resistance={800}
          returnDuration={1.2}
        />
      </div>

      {/* Decorative gradient glowing circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />

      {/* Kyrie Irving Faded Background Image Overlay positioned behind evaluate greatness text */}
      <div className="fixed top-0 bottom-0 left-0 z-0 w-full md:w-[60%] pointer-events-none opacity-[0.16] mix-blend-screen flex items-end justify-start">
        <img 
          src={kyrieBg} 
          alt="Kyrie Irving Background" 
          className="h-[88vh] w-auto object-contain object-bottom select-none translate-x-[5%] translate-y-[3%]"
        />
      </div>

      {/* Luka Doncic Faded Background Image Overlay positioned on the right side */}
      <div className="fixed top-0 bottom-0 right-0 z-0 w-full md:w-[60%] pointer-events-none opacity-[0.16] mix-blend-screen flex items-end justify-end">
        <img 
          src={lukaBg} 
          alt="Luka Doncic Background" 
          className="h-[88vh] w-auto object-contain object-bottom select-none -translate-x-[5%] translate-y-[3%]"
        />
      </div>

      {/* Floating Audio Controller */}
      <div className="fixed bottom-6 left-6 z-50 pointer-events-auto">
        <AudioPlayer />
      </div>

      {/* Navigation Header using BubbleMenu component */}
      <div className="relative z-50 w-full px-6 py-6 md:px-8">
        <BubbleMenu
          logo={logoNode}
          items={menuItems}
          menuBg="#0B0F19"
          menuContentColor="#FAF9F6"
          useFixedPosition={false}
          animationEase="back.out(1.5)"
          animationDuration={0.5}
          staggerDelay={0.12}
        />
      </div>

      {/* Main Hero & Authentication Grid */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-8 py-12 md:py-20 flex-grow flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Side: Brand Narrative */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title Split Animation (Evaluate greatness. Normalized across eras.) */}
            <div className="flex flex-col justify-start text-left w-full gap-2 py-2 font-display">
              <SplitText
                text="Evaluate greatness."
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-white leading-none block"
                delay={40}
                duration={0.7}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 30 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="left"
                tag="h1"
              />
              <SplitText
                text="Normalized across eras."
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-[#C9082A] leading-none block"
                delay={40}
                duration={0.7}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 30 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="left"
                tag="h2"
              />
            </div>

            <p className="text-sm sm:text-base text-zinc-450 max-w-xl leading-relaxed text-left">
              TimelineCourt removes generation bias to answer: <em>"How dominant was a player relative to his own era?"</em> Here is a guide on how to explore and use the platform's advanced mathematical tools:
            </p>

            {/* Core Feature List - Left aligned vertically down the screen */}
            <div className="space-y-6 pt-6 text-left w-full">
              {/* Feature 1: Historical Eras Projection (How-To) */}
              <div className="flex items-start gap-4 hover:translate-x-1 transition-transform duration-300">
                <div className="h-9 w-9 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue shrink-0 mt-0.5">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">01. Eras Projection & Translation</h3>
                  <p className="text-xs text-zinc-500 max-w-lg leading-normal">
                    Select a player and target decade in the **Time Machine** widget. The engine translates raw performance stats into Per-100 possessions, runs positional Z-scoring against historical cohorts, scales by Defensive Quality Index (DQI), and displays the step-by-step mathematical derivation in a holographic visualizer.
                  </p>
                </div>
              </div>

              {/* Feature 2: Neural ML Engine */}
              <div className="flex items-start gap-4 hover:translate-x-1 transition-transform duration-300">
                <div className="h-9 w-9 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple shrink-0 mt-0.5">
                  <Cpu className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">02. Neural Matchups Predictor</h3>
                  <p className="text-xs text-zinc-500 max-w-lg leading-normal">
                    Create matchups between cross-era teams on the **Matchups** page. Simulate outcomes using a feedforward PyTorch neural network that evaluates 12-dimensional matchup vectors to calculate win probabilities.
                  </p>
                </div>
              </div>

              {/* Feature 3: PCA Similarity Visualizations */}
              <div className="flex items-start gap-4 hover:translate-x-1 transition-transform duration-300">
                <div className="h-9 w-9 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green shrink-0 mt-0.5">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">03. 2D PCA Archetype Embedding</h3>
                  <p className="text-xs text-zinc-500 max-w-lg leading-normal">
                    Explore player similarity in the interactive **Embedding Space**. Player data is mapped into a 6-dimensional latent identity space and projected to 2D via Principal Component Analysis (PCA) to cluster players by playstyle.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Authentication Panel */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 bg-[#0B0F19]/80 border border-white/5 shadow-2xl backdrop-blur-md space-y-6">
              
              {/* Pulsing neon perimeter outline border */}
              <div className="absolute inset-0 border border-brand-blue/10 rounded-3xl pointer-events-none" />

              <div className="text-center space-y-1.5">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border border-zinc-800 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-brand-blue" />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  {isRegister ? 'Register Analyst Profile' : 'Access Platform'}
                </h2>
                <div className="px-3 py-1.5 rounded-xl bg-red-950/20 border border-red-900/40 text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse inline-block mx-auto">
                  ⚠️ Registration Required
                </div>
                <p className="text-xs text-zinc-500">
                  {isRegister ? 'You must create an Analyst Profile to save rosters, simulate matchups, and run AI reports.' : 'Enter your registered credentials to launch the simulator.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 text-[11px] text-red-400 flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Username */}
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="bg-zinc-950/80 border border-white/10 text-white text-xs rounded-xl pl-10 pr-4 py-3.5 w-full focus:outline-none focus:border-brand-blue transition-all"
                    />
                  </div>

                  {/* Email (register only) */}
                  {isRegister && (
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"
                        className="bg-zinc-950/80 border border-white/10 text-white text-xs rounded-xl pl-10 pr-4 py-3.5 w-full focus:outline-none focus:border-brand-blue transition-all"
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="bg-zinc-950/80 border border-white/10 text-white text-xs rounded-xl pl-10 pr-4 py-3.5 w-full focus:outline-none focus:border-brand-blue transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? 'Processing...' : isRegister ? 'Create Profile & Enter' : 'Authenticate & Enter'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Toggler */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setErrorMsg('');
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-brand-blue hover:text-white transition-colors"
                >
                  {isRegister ? 'Already have a profile? Access here' : 'Need profile? Create one here'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/5 bg-zinc-950/20 text-center">
        <div className="max-w-7xl mx-auto px-6 text-[10px] text-zinc-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} ChronosCourt NBA Analytics. All rights reserved.</span>
          <span className="flex gap-4">
            <span className="hover:text-zinc-400 cursor-pointer">Methodology</span>
            <span className="hover:text-zinc-400 cursor-pointer">PyTorch Engine</span>
            <span className="hover:text-zinc-400 cursor-pointer">Developer API</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
