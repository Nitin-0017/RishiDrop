import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RishihoodLogo } from '../components/common/RishihoodLogo';
import { LoginTransition } from '../components/common/LoginTransition';
import rishihoodTransparentLogo from '../assets/rishihood_logo_transparent.png';
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transitionState, setTransitionState] = useState<{
    show: boolean;
    targetRoute: string;
    role: string;
  }>({
    show: false,
    targetRoute: '',
    role: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your university email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email.trim(), password);
      // Trigger cinematic portal transition before redirect
      if (loggedInUser.role === 'ADMIN') {
        setTransitionState({ show: true, targetRoute: '/admin', role: 'ADMIN' });
      } else if (loggedInUser.role === 'GUARD') {
        setTransitionState({ show: true, targetRoute: '/guard', role: 'GUARD' });
      } else {
        setError('Student accounts access RishiDrop directly via WhatsApp.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Incorrect email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('CampusDrop@2026');
    setError(null);
  };

  const handleContinueCurrentSession = () => {
    if (user?.role === 'ADMIN') {
      setTransitionState({ show: true, targetRoute: '/admin', role: 'ADMIN' });
    } else if (user?.role === 'GUARD') {
      setTransitionState({ show: true, targetRoute: '/guard', role: 'GUARD' });
    }
  };

  const handleTransitionComplete = () => {
    if (transitionState.targetRoute) {
      navigate(transitionState.targetRoute, { replace: true });
    }
  };

  return (
    <>
      {transitionState.show && (
        <LoginTransition
          onComplete={handleTransitionComplete}
          role={transitionState.role}
        />
      )}
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 relative overflow-hidden">
        {/* Subtle warm/red ambient corner glow to add depth */}
        <div className="absolute -top-36 -right-36 w-96 h-96 rounded-full bg-[#A6192E]/[0.035] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-36 -left-36 w-96 h-96 rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />

        <div className="max-w-[940px] w-full mx-auto grid grid-cols-1 md:grid-cols-2 bg-white rounded-[22px] border border-slate-200/80 shadow-xl shadow-slate-900/[0.04] overflow-hidden relative z-10">
          
          {/* LEFT COLUMN: Entire pink panel with university logo placed directly on it */}
          <div className="hidden md:flex relative overflow-hidden bg-[#FBEAEC] border-r border-[#F5C6CB]/60 items-center justify-center p-8 lg:p-12 select-none">
            <img
              src={rishihoodTransparentLogo}
              alt="Rishihood University"
              className="w-[78%] max-w-[340px] h-auto object-contain object-center mix-blend-multiply relative z-10"
            />
          </div>

          {/* RIGHT COLUMN: Polished Login Form */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white space-y-6">
            
            <div className="space-y-6">
              
              {/* Mobile Header Banner with SVG Logo (Visible only on mobile devices) */}
              <div className="flex md:hidden items-center justify-between pb-4 border-b border-slate-100">
                <RishihoodLogo variant="compact" size="sm" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A6192E] bg-[#FBEAEC] px-2.5 py-0.5 rounded-full border border-[#F5C6CB]">
                  Logistics Portal
                </span>
              </div>

              {/* Active Session Notification (if user is already logged in) */}
              {isAuthenticated && user && (
                <div className="p-4 rounded-2xl bg-[#FBEAEC]/80 border border-[#F5C6CB] text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[#A6192E] font-bold">
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <span>Active Session Detected</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white text-[#A6192E] border border-[#F5C6CB]">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-slate-800">
                    Signed in as <strong>{user.name}</strong> ({user.email})
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleContinueCurrentSession}
                      className="flex-1 py-2 px-3 rounded-xl font-bold text-xs bg-[#A6192E] text-white hover:bg-[#8F1628] transition-colors min-h-[40px] shadow-xs cursor-pointer"
                    >
                      Open {user.role === 'ADMIN' ? 'Admin' : 'Guard'} Dashboard →
                    </button>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="py-2 px-3 rounded-xl font-semibold text-xs bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-[#A6192E] transition-colors min-h-[40px] cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}

              {/* Typography Hierarchy */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-extrabold text-[#A6192E] uppercase tracking-[0.2em]">
                  Welcome back
                </div>
                <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-snug">
                  Sign in to RishiDrop
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium pt-0.5">
                  Enter your authorized university credentials to proceed.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-xs font-semibold text-red-800 flex items-start space-x-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    University Email / ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@campusdrop.demo"
                      className="w-full pl-10 pr-3.5 py-3.5 bg-white border border-slate-200 rounded-[13px] text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#A6192E] focus:ring-4 focus:ring-[#A6192E]/10 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-3.5 bg-white border border-slate-200 rounded-[13px] text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#A6192E] focus:ring-4 focus:ring-[#A6192E]/10 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-[13px] font-bold text-xs sm:text-sm tracking-wide bg-[#A6192E] hover:bg-[#8E1527] text-white disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-[#A6192E]/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 cursor-pointer min-h-[46px] group"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'SIGN IN'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>

            {/* Quick Demo Fill Helper with buttons on the same horizontal row */}
            <div className="pt-5 border-t border-slate-100 space-y-2.5">
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Quick demo accounts:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleFillDemo('admin@campusdrop.demo')}
                  className="w-full px-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 hover:border-[#A6192E]/40 hover:bg-[#FBEAEC]/40 hover:text-[#A6192E] font-semibold text-[10px] sm:text-[10.5px] xl:text-[11px] transition-all cursor-pointer shadow-2xs text-center whitespace-nowrap min-h-[38px]"
                >
                  Admin (admin@campusdrop.demo)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('guard@campusdrop.demo')}
                  className="w-full px-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 hover:border-[#A6192E]/40 hover:bg-[#FBEAEC]/40 hover:text-[#A6192E] font-semibold text-[10px] sm:text-[10.5px] xl:text-[11px] transition-all cursor-pointer shadow-2xs text-center whitespace-nowrap min-h-[38px]"
                >
                  Guard (guard@campusdrop.demo)
                </button>
              </div>
              <p className="text-[10px] text-slate-400 pt-0.5">
                Authorized university personnel only.
              </p>
            </div>

          </div>

        </div>

      </div>
    </>
  );
};

export default LoginPage;
