import React from 'react';
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('NNDD TV Critical Runtime Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen w-full bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center select-none" 
          dir="rtl"
        >
          {/* Logo Badge */}
          <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black mb-2 text-white">
            سیستەمی NNDD TV
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            کێشەیەکی کاتی لە کارپێکردن ڕوویدا. تکایە دووبارە دەستپێبکەرەوە یان داتا سەرەتاییەکان پاکبکەرەوە بۆ چاکبوونەوەی خێرا.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>دەستپێکردنەوەی بەرنامە</span>
            </button>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs flex items-center gap-2 border border-white/10 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>سڕینەوەی کێشە و چاککردن</span>
            </button>
          </div>

          {this.state.error && (
            <div className="mt-6 p-3 rounded-xl bg-black/40 border border-white/5 text-[10px] text-red-300 font-mono max-w-lg w-full text-left overflow-auto max-h-24">
              {String(this.state.error?.message || this.state.error)}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
