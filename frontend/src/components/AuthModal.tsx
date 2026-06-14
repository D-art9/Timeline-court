import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../data/api';
import { X, Lock, User, Mail, ShieldAlert } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await api.register({ username, email, password });
        // After successful register, auto login
        const tokens = await api.login({ username, password });
        if (tokens) {
          onSuccess(username);
          onClose();
        }
      } else {
        const tokens = await api.login({ username, password });
        if (tokens) {
          onSuccess(username);
          onClose();
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials or server state.');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 bg-zinc-950 border border-bg-border/60 shadow-2xl space-y-6 animate-scale-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-offwhite/50 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 border border-zinc-800 flex items-center justify-center">
            <Lock className="h-5 w-5 text-brand-blue" />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            {isRegister ? 'Create Account' : 'Analyst Access'}
          </h3>
          <p className="text-xs text-zinc-500">
            {isRegister ? 'Join the legacy NBA index comparison grid' : 'Provide your security tokens to enter'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 text-[11px] text-red-400 flex items-start gap-2 animate-shake">
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
                className="bg-bg-dark/80 border border-bg-border text-white text-xs rounded-xl pl-10 pr-4 py-3.5 w-full focus:outline-none focus:border-brand-blue transition-all"
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
                  className="bg-bg-dark/80 border border-bg-border text-white text-xs rounded-xl pl-10 pr-4 py-3.5 w-full focus:outline-none focus:border-brand-blue transition-all"
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
                className="bg-bg-dark/80 border border-bg-border text-white text-xs rounded-xl pl-10 pr-4 py-3.5 w-full focus:outline-none focus:border-brand-blue transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-white/5 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isRegister ? 'Register' : 'Authenticate'}
          </button>
        </form>

        {/* Footer toggler */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
            className="text-[10px] font-bold uppercase tracking-wider text-brand-blue hover:text-white transition-colors"
          >
            {isRegister ? 'Already registered? Log In' : 'No account? Create profile'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
