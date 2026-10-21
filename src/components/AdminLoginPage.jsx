import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Tv, 
  Sparkles, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { signInAdmin, signUpAdmin } from '../data/supabaseClient';

export default function AdminLoginPage({ onLoginSuccess, onBackToTv }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('تکایە ئیمەیڵ و تێپەڕەوشە بنووسە.');
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const res = await signInAdmin(email, password);
        if (res.success) {
          setSuccessMsg('بە سەرکەوتوویی چووە ژوورەوە! ئاراستە دەکرێیت...');
          setTimeout(() => {
            onLoginSuccess?.(res.user);
          }, 600);
        } else {
          setErrorMsg(res.error || 'ئیمەیڵ یان پاسۆرد هەڵەیە.');
        }
      } else {
        const res = await signUpAdmin(email, password);
        if (res.success) {
          setSuccessMsg(res.message || 'هەژمار لە Supabase دروستکرا! دەتوانیت ئێستا بچیتە ژوورەوە.');
          setActiveTab('login');
        } else {
          setErrorMsg(res.error || 'کێشە لە دروستکردنی هەژمار ڕوویدا.');
        }
      }
    } catch (err) {
      setErrorMsg('کێشەیەک لە پەیوەندی بە سێرڤەری Supabase ڕوویدا.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickMaster = () => {
    setEmail('admin@dabin.tv');
    setPassword('dabin2026');
    setErrorMsg('');
  };

  return (
    <div 
      dir="rtl"
      className="min-h-screen w-full bg-[#030712] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none"
    >
      {/* Dynamic Ambient Neon Lights */}
      <div className="absolute -top-40 -start-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -end-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/85 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.85)] p-6 sm:p-8 animate-scale-up">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner mb-3">
            <img 
              src="/dabin-logo.png" 
              alt="DABIN.Tv" 
              className="h-12 sm:h-14 w-auto object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center justify-center gap-2">
            <span>چوونەژوورەوەی ئەدمین</span>
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>بەستراوە بە بنکەی داتای Supabase</span>
          </p>
        </div>

        {/* Tab Switcher: Login / Register in Supabase */}
        <div className="grid grid-cols-2 p-1 bg-black/40 rounded-2xl border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            چوونەژوورەوە (Login)
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            دروستکردن لە Supabase
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-end">
              <span>ئیمەیڵی ئەدمین (Admin Email)</span>
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dabin.tv"
                dir="ltr"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-end">
              <span>تێپەڕەوشە (Password)</span>
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full px-4 py-3 pe-11 bg-black/50 border border-white/10 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-3 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_10px_30px_rgba(6,182,212,0.3)] border border-cyan-400/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>پشکنینی زانیاری لە Supabase...</span>
              </>
            ) : activeTab === 'login' ? (
              <>
                <span>چوونەژوورەوەی پارێزراو</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>دروستکردنی هەژمار لە Supabase</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials / Help */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={fillQuickMaster}
            className="hover:text-cyan-300 transition-colors underline cursor-pointer text-[11px]"
          >
            پڕکردنەوەی خێرای ئەدمینی سەرەکی
          </button>

          <span className="text-[10px] text-slate-500 font-mono">
            Auth: Supabase v2.43
          </span>
        </div>

        {/* Return to TV App */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onBackToTv}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-3 rounded-xl hover:bg-white/5"
          >
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span>گەڕانەوە بۆ پەخشی تیڤی (TV App)</span>
          </button>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="relative z-10 mt-6 text-center text-[11px] text-slate-500">
        <span>© 2026 DABIN.Tv Control Systems. هەموو مافەکان پارێزراون.</span>
      </div>
    </div>
  );
}
