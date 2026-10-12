import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertOctagon, 
  Lightbulb, 
  ShieldAlert, 
  Cpu, 
  Network, 
  CreditCard, 
  Tv, 
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export default function StrategicReportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up text-slate-900">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-[0_2px_12px_rgba(245,158,11,0.3)] font-bold">
              <FileCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                بەدواداچوون، باش و خراپی، و پێشنیارە ستراتیژییەکان بۆ NNDD TV
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                شیکاری قووڵی تەکنیکی، یاسایی، کارسازی، و ڕێگاکانی سەرکەوتنی پڕۆژەکە
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed text-slate-600">
          
          {/* Section 1: Project Architecture Overview */}
          <div className="bg-blue-50/60 rounded-2xl p-5 border border-blue-200">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
              <Network className="w-4 h-4 text-blue-600" />
              <span>١. بەدواداچوونی گشتی و تەلارسازی پڕۆژەکە (Project Feasibility & Architecture)</span>
            </h3>
            <p className="text-slate-700">
              بیرۆکەکەت لەسەر بنیاتنانی سیستەمێکی یەکگرتووی پەخشی تیڤی ناوخۆیی و نێودەوڵەتی (IPTV & VOD) لەگەڵ ئەدمین پانێڵی سەربەخۆ 
              زۆر سەرکەوتووە و لە ئێستادا لە هەرێمی کوردستان و دیاسپۆرا خواستێکی بێشوماری لەسەرە. پڕۆژەکە دەبێتە دوو بەشی سەرەکی:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700">
              <li><strong>ئەپڵیکەیشنی بینەر (Client TV App):</strong> پشتیوانی تەلەفزیۆنی زیرەک (Android TV, WebOS, Tizen)، مۆبایل و تابلێت، بە گەشتکردنی ئاسان بە دوگمەکانی کۆنتڕۆڵ (D-Pad Navigation).</li>
              <li><strong>ئەدمین کۆنتڕۆڵ پانێڵ (Cloud RBAC Admin):</strong> بەڕێوەبردنی سێرڤەری M3U8، کۆدەکانی Xtream، زیادکردنی کەناڵ بێ دەستکاری کۆد، بەڕێوەبردنی بەشداربووان و دەسەڵاتەکان.</li>
            </ul>
          </div>

          {/* Section 2: Pros & Strengths (باشییەکان) */}
          <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200">
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>٢. باشییە بەهێزەکانی پڕۆژەکە (Strengths & Pros)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs">
                <strong className="text-emerald-900 block text-xs">١. کۆکردنەوەی کەناڵە ناوخۆیی و وەرزشییەکان:</strong>
                <span className="text-slate-600 text-[11px]">زۆربەی خێزانەکان ناتوانن هەموو دەزگاکان بە جیا دابنێن؛ بوونی کوردماکس، ک٢٤، دهۆک سپۆرت، بین سپۆرت و زارۆک لە یەک ئەپدا بەهایەکی گەورەیە.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs">
                <strong className="text-emerald-900 block text-xs">٢. مۆدێلی فرۆشتنی فرە-ماوە (Subscriptions):</strong>
                <span className="text-slate-600 text-[11px]">پێشکەشکردنی تێستی ٢٤ کاتژمێر (بۆ متمانە)، و پلانەکانی ١، ٣، ٦ مانگ و ساڵانە داهاتێکی بەردەوام (MRR) بۆ سیستەمەکە دروست دەکات.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs">
                <strong className="text-emerald-900 block text-xs">٣. کۆنتڕۆڵی تەواو بەبێ دەستکاری سۆرس کۆد:</strong>
                <span className="text-slate-600 text-[11px]">ئەگەر لینکی کەناڵێک بگۆڕێت، لە ئەدمین پانێڵ نوێ دەکرێتەوە و دەستبەجێ بەبێ ئەپدەیتی ئەپ لەسەر تەلەفزیۆنی هەموو کڕیارەکان کارا دەبێت.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs">
                <strong className="text-emerald-900 block text-xs">٤. شاشەی داشبۆرد بە پەخشی بێدەنگ لە باگراوند:</strong>
                <span className="text-slate-600 text-[11px]">ئەم ستایلە (وەک Apple TV و Netflix) ئەزموونی بەکارهێنەر (UX) دەباتە بەرزترین ئاستی مۆدێرن و سەرنجڕاکێشی.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Cons & Technical Challenges (خراپی و ئاڵنگارییەکان) */}
          <div className="bg-rose-50/60 rounded-2xl p-5 border border-rose-200">
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2 mb-3">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>٣. خاڵە لاوازەکان و ئاڵنگارییە تەکنیکییە مەترسیدارەکان (Weaknesses & Cons)</span>
            </h3>
            <div className="space-y-2.5">
              <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-xs">
                <strong className="text-rose-700 block text-xs">⚠️ ئاڵنگاری ١: بەسەرچوونی خێرای تۆکن لە بەستەرەکانی Stalker و Delta8k:</strong>
                <span className="text-slate-600 text-[11px]">
                  لەو لینکە M3Uـیانەی دامناون، زۆربەیان پارامیتەری <code>play_token=...</code> و <code>mac=00:1A:79...</code> تێدایە. 
                  ئەم تۆکنانە زۆرجار کاتیین (Expires within hours/days) یان تەنها ڕێگە بە یەک پەیوەندی هاوکات دەدەن (Single Connection limit). 
                  ئەگەر دوو بەکارهێنەر بە هەمان تۆکن بچنە سەر کەناڵەکە، سێرڤەرەکەی دەرەوە بلۆکیان دەکات!
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-xs">
                <strong className="text-rose-700 block text-xs">⚠️ ئاڵنگاری ٢: کێشەی فۆرماتی MPEG-TS (.ts) لە براوسەر و Web:</strong>
                <span className="text-slate-600 text-[11px]">
                  بەشێک لە بەستەرەکان <code>extension=ts</code>ن. براوسەرە ئاساییەکان ناتوانن پەڕگەی خاوی TS پەخش بکەن بەبێ دروستکردنی HLS Transmuxer یان بەکارهێنانی ئەپی ڕەسەن (Native ExoPlayer لەسەر ئەندرۆید).
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-xs">
                <strong className="text-rose-700 block text-xs">⚠️ ئاڵنگاری ٣: باندویسی سێرڤەر (Bandwidth & Server Load):</strong>
                <span className="text-slate-600 text-[11px]">
                  پەخشی 4K پێویستی بە لانی کەم 15Mbps بۆ 25Mbps هێڵی ئینتەرنێت هەیە بۆ هەر بەکارهێنەرێک. ئەگەر ١٠٠٠ بەکارهێنەر هاوکات سەیری یارییەکی کلاسیکۆ بکەن، 
                  پێویستت بە سێرڤەری لانی کەم 20Gbps هەیە گەر لە ڕێگەی Restream Proxy خۆتەوە بڕوات.
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Innovative Ideas & Suggestions (پێشنیار و بیرۆکەی نوێ) */}
          <div className="bg-purple-50/60 rounded-2xl p-5 border border-purple-200">
            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <span>٤. پێشنیار و بیرۆکە پێشکەوتووە نوێیەکان (Innovative Recommendations)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-xs">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-1">
                  <Cpu className="w-4 h-4" />
                  <span>١. سیستەمی لقی یەدەگ (Automatic Stream Failover):</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  بۆ هەر کەناڵێک دوو یان سێ سەرچاوە دابنێ (Primary Stream و Backup Stream). گەر سەرچاوەی یەکەم وەستا، ئەپڵیکەیشنەکە بەبێ هەستپێکردنی بەکارهێنەر لە ماوەی ٠.٥ چرکەدا بگۆڕێتە سەر سەرچاوەی دووەم.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-xs">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-1">
                  <CreditCard className="w-4 h-4" />
                  <span>٢. سیستەمی بریکارەکان (Reseller Portal & FastPay/FIB):</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  پێدانی پانێڵ بە بریکارەکان لە شارەکان (سلێمانی، هەولێر، دهۆک، کەرکووک) تا بتوانن کارتی باڵانس یان باڵانسی فاستپەی دروست بکەن و کڕیار بە شێوەی ئۆتۆماتیک ئەکاونتەکەی چالاک بکات.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-xs">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-1">
                  <Layers className="w-4 h-4" />
                  <span>٣. خشتەی بەرنامەکان (EPG - Electronic Program Guide):</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  بەستنەوەی فایلێکی XMLTV EPG بۆ نیشاندانی ناوی بەرنامەی ئێستا و بەرنامەی دواتر لەسەر کەناڵە کوردییەکان لە کاتی کەناڵ گۆڕیندا.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-xs">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>٤. بەستنەوەی فەرمی بە MAC و Device Fingerprint:</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  ڕێگریکردن لە دزینی کۆدەکان بە شێوەیەک کە یەک ئەکاونت لە یەک کاتدا تەنها لەسەر یەک شاشەی تەلەفزیۆن کار بکات تا قازانجی بازرگانی پڕۆژەکەت پارێزراو بێت.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            ئامادەکراوە بۆ دیڤلۆپەری پڕۆژەی NNDD TV • مۆدێلی پارێزراوی کارلێککار
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-xs active:scale-95 transition-all border border-slate-300"
          >
            داخستنی ڕاپۆرت
          </button>
        </div>

      </div>
    </div>
  );
}
