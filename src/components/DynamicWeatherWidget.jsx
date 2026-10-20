import React, { useState, useEffect, useMemo } from 'react';
import { 
  CloudSun, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  CloudFog, 
  Wind, 
  Droplets, 
  Thermometer, 
  Umbrella, 
  ChevronDown, 
  X, 
  MapPin, 
  RefreshCw,
  Eye,
  Compass
} from 'lucide-react';

export const KURDISTAN_CITIES = [
  { id: 'erbil', nameKu: 'هەولێر', nameAr: 'أربيل', nameEn: 'Erbil', lat: 36.1911, lon: 44.0092 },
  { id: 'sulaymaniyah', nameKu: 'سلێمانی', nameAr: 'السليمانية', nameEn: 'Sulaymaniyah', lat: 35.5612, lon: 45.4375 },
  { id: 'duhok', nameKu: 'دهۆک', nameAr: 'دهوك', nameEn: 'Duhok', lat: 36.8679, lon: 42.9885 },
  { id: 'kirkuk', nameKu: 'کەرکووک', nameAr: 'كركوك', nameEn: 'Kirkuk', lat: 35.4681, lon: 44.3922 },
  { id: 'halabja', nameKu: 'هەڵەبجە', nameAr: 'حلبجة', nameEn: 'Halabja', lat: 35.1778, lon: 45.9861 },
  { id: 'baghdad', nameKu: 'بەغداد', nameAr: 'بغداد', nameEn: 'Baghdad', lat: 33.3152, lon: 44.3661 }
];

export function getWeatherConditionInfo(code, isDay = 1) {
  // WMO Weather interpretation codes (WW)
  if (code === 0) {
    return {
      ku: isDay ? 'ساماڵ و هەتاو' : 'ساماڵ و ئارام',
      ar: isDay ? 'صحو ومشمس' : 'صحو صافٍ',
      en: isDay ? 'Clear Sky' : 'Clear Night',
      type: isDay ? 'sun' : 'moon',
      gradient: isDay ? 'from-amber-500/20 to-orange-500/10' : 'from-indigo-950/40 to-slate-900/40'
    };
  }
  if (code === 1 || code === 2) {
    return {
      ku: 'کەمێک هەور',
      ar: 'غائم جزئياً',
      en: 'Partly Cloudy',
      type: 'cloud-sun',
      gradient: 'from-sky-500/20 to-indigo-500/10'
    };
  }
  if (code === 3) {
    return {
      ku: 'هەوراوی تەواو',
      ar: 'غائم كلياً',
      en: 'Overcast',
      type: 'cloud',
      gradient: 'from-slate-700/30 to-slate-900/30'
    };
  }
  if (code === 45 || code === 48) {
    return {
      ku: 'تەمومژ',
      ar: 'ضبابي',
      en: 'Foggy',
      type: 'fog',
      gradient: 'from-slate-600/30 to-zinc-800/30'
    };
  }
  if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65) || (code >= 80 && code <= 82)) {
    return {
      ku: code >= 63 ? 'بارانی بەخوڕ' : 'نمەباران',
      ar: code >= 63 ? 'أمطار غزيرة' : 'أمطار خفيفة',
      en: code >= 63 ? 'Heavy Rain' : 'Rain Showers',
      type: 'rain',
      gradient: 'from-blue-600/25 to-cyan-900/30'
    };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      ku: 'بەفربارین',
      ar: 'ثلوج وتساقط ثلجي',
      en: 'Snowfall',
      type: 'snow',
      gradient: 'from-sky-400/20 to-blue-900/30'
    };
  }
  if (code >= 95) {
    return {
      ku: 'برووسکە و ڕەشەبا',
      ar: 'عواصف رعدية',
      en: 'Thunderstorm',
      type: 'thunder',
      gradient: 'from-purple-900/30 to-amber-900/20'
    };
  }
  return {
    ku: 'ساماڵ و کەمێک هەور',
    ar: 'صحو وغائم جزئياً',
    en: 'Mild & Clear',
    type: 'cloud-sun',
    gradient: 'from-blue-500/20 to-slate-900/20'
  };
}

/**
 * Animated SVG Weather Icon: Rich, fluid Apple/Nick Roberts style
 */
export function AnimatedWeatherIcon({ type = 'sun', className = 'w-6 h-6' }) {
  switch (type) {
    case 'sun':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
          <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-sm animate-pulse" />
          <Sun className="w-full h-full text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-[spin_20s_linear_infinite]" />
        </div>
      );
    case 'cloud-sun':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
          <Sun className="absolute -top-1 -end-1 w-3/4 h-3/4 text-amber-400/90 animate-pulse" />
          <Cloud className="relative w-full h-full text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
        </div>
      );
    case 'cloud':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
          <Cloud className="w-full h-full text-slate-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] animate-pulse" />
        </div>
      );
    case 'rain':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
          <CloudRain className="w-full h-full text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
        </div>
      );
    case 'thunder':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
          <CloudLightning className="w-full h-full text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.8)] animate-pulse" />
        </div>
      );
    case 'snow':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
          <CloudSnow className="w-full h-full text-sky-200 drop-shadow-[0_0_10px_rgba(186,230,253,0.8)] animate-bounce" />
        </div>
      );
    case 'fog':
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
          <CloudFog className="w-full h-full text-slate-300 drop-shadow-md" />
        </div>
      );
    default:
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
          <CloudSun className="w-full h-full text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
        </div>
      );
  }
}

/**
 * Full Dynamic Weather Widget (Capsule Pill + Modal)
 */
export default function DynamicWeatherWidget({ language = 'ku', onCityChange = null }) {
  const [selectedCityId, setSelectedCityId] = useState(() => {
    try {
      return localStorage.getItem('nndd_selected_weather_city') || 'erbil';
    } catch(e) {
      return 'erbil';
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const activeCity = useMemo(() => {
    return KURDISTAN_CITIES.find(c => c.id === selectedCityId) || KURDISTAN_CITIES[0];
  }, [selectedCityId]);

  // Weather Data State with Current, Hourly & 5-Day Forecast
  const [weather, setWeather] = useState({
    temp: 24,
    feelsLike: 25,
    humidity: 46,
    windSpeed: 8,
    tempMax: 27,
    tempMin: 15,
    rainProbability: 5,
    weatherCode: 1,
    isDay: 1,
    forecast: [
      { day: 'ئەمڕۆ', dayAr: 'اليوم', dayEn: 'Today', max: 27, min: 15, code: 1, pop: 5 },
      { day: 'بەیانی', dayAr: 'غداً', dayEn: 'Tomorrow', max: 28, min: 16, code: 2, pop: 10 },
      { day: 'دووبەیانی', dayAr: 'بعد غد', dayEn: 'Wed', max: 27, min: 17, code: 3, pop: 15 },
      { day: 'پێنجشەممە', dayAr: 'الخميس', dayEn: 'Thu', max: 26, min: 16, code: 61, pop: 40 },
      { day: 'هەینی', dayAr: 'الجمعة', dayEn: 'Fri', max: 25, min: 14, code: 2, pop: 10 }
    ]
  });

  const fetchCityWeather = async (city) => {
    if (!city) return;
    setIsLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const cur = data.current;
        const daily = data.daily;

        if (cur && daily) {
          const dayNamesKu = ['ئەمڕۆ', 'بەیانی', 'دووبەیانی', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە', 'یەکشەممە'];
          const dayNamesAr = ['اليوم', 'غداً', 'بعد غد', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
          const dayNamesEn = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'];

          const forecastList = (daily.time || []).slice(0, 5).map((t, idx) => ({
            day: idx < 3 ? dayNamesKu[idx] : new Date(t).toLocaleDateString('ku', { weekday: 'short' }),
            dayAr: idx < 3 ? dayNamesAr[idx] : new Date(t).toLocaleDateString('ar', { weekday: 'short' }),
            dayEn: idx < 3 ? dayNamesEn[idx] : new Date(t).toLocaleDateString('en', { weekday: 'short' }),
            max: Math.round(daily.temperature_2m_max?.[idx] ?? 25),
            min: Math.round(daily.temperature_2m_min?.[idx] ?? 15),
            code: daily.weather_code?.[idx] ?? 1,
            pop: daily.precipitation_probability_max?.[idx] ?? 0
          }));

          setWeather({
            temp: Math.round(cur.temperature_2m),
            feelsLike: Math.round(cur.apparent_temperature),
            humidity: Math.round(cur.relative_humidity_2m),
            windSpeed: Math.round(cur.wind_speed_10m),
            tempMax: Math.round(daily.temperature_2m_max?.[0] ?? 26),
            tempMin: Math.round(daily.temperature_2m_min?.[0] ?? 15),
            rainProbability: daily.precipitation_probability_max?.[0] ?? 0,
            weatherCode: cur.weather_code,
            isDay: cur.is_day ?? 1,
            forecast: forecastList
          });
        }
      }
    } catch (e) {
      console.warn('[Weather] Error fetching weather:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCityWeather(activeCity);
    const interval = setInterval(() => fetchCityWeather(activeCity), 900000); // 15 mins
    return () => clearInterval(interval);
  }, [activeCity]);

  const handleSelectCity = (city) => {
    setSelectedCityId(city.id);
    setIsCityDropdownOpen(false);
    try {
      localStorage.setItem('nndd_selected_weather_city', city.id);
    } catch(e) {}
    fetchCityWeather(city);
    onCityChange?.(city);
  };

  const condInfo = useMemo(() => {
    return getWeatherConditionInfo(weather.weatherCode, weather.isDay);
  }, [weather.weatherCode, weather.isDay]);

  const cityName = language === 'ar' ? activeCity.nameAr : language === 'en' ? activeCity.nameEn : activeCity.nameKu;
  const conditionLabel = language === 'ar' ? condInfo.ar : language === 'en' ? condInfo.en : condInfo.ku;

  return (
    <>
      {/* 1. Header Capsule Pill (Click opens full weather modal) */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/15 backdrop-blur-2xl shadow-lg transition-all duration-200 select-none cursor-pointer active:scale-95 group"
        title="کەشوهەوای داینامیک - بۆ بینینی وردەکاری کلیک بکە"
      >
        <AnimatedWeatherIcon type={condInfo.type} className="w-5 h-5" />
        <div className="flex flex-col text-start">
          <div className="flex items-center gap-1.5 text-xs font-normal text-white font-mono">
            <span>{weather.temp}°C</span>
            <span className="text-[10px] text-amber-300 font-normal font-sans">• {cityName}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-slate-300 font-normal">
            <span className="truncate max-w-[85px]">{conditionLabel}</span>
          </div>
        </div>
      </div>

      {/* 2. Full Liquid Glass Weather Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-fade-in select-none"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg rounded-3xl bg-slate-950/85 border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-5 sm:p-6 overflow-hidden text-white animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow based on current weather */}
            <div className={`absolute inset-0 bg-gradient-to-br ${condInfo.gradient} pointer-events-none filter blur-2xl opacity-60`} />

            {/* Header: City Selector & Close */}
            <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/15">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCityDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-normal transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>{cityName}</span>
                  <ChevronDown className="w-3 h-3 text-white/70" />
                </button>

                {/* City Picker Dropdown */}
                {isCityDropdownOpen && (
                  <div className="absolute top-full start-0 mt-1.5 w-48 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/20 shadow-2xl p-1 z-30 space-y-0.5">
                    {KURDISTAN_CITIES.map(c => {
                      const isCur = c.id === selectedCityId;
                      const cName = language === 'ar' ? c.nameAr : language === 'en' ? c.nameEn : c.nameKu;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCity(c)}
                          className={`w-full px-3 py-2 rounded-xl text-xs text-start transition-all cursor-pointer flex items-center justify-between ${
                            isCur ? 'bg-amber-400 text-slate-950 font-normal' : 'text-slate-200 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{cName}</span>
                          {isCur && <span className="text-[10px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchCityWeather(activeCity)}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="نوێکردنەوە"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
                  title="داخستن"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Temperature & Hero Card */}
            <div className="relative z-10 py-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-5xl sm:text-6xl font-light font-mono tracking-tight text-white drop-shadow-md">
                  {weather.temp}°
                </div>
                <div className="text-sm font-normal text-slate-200 mt-1">
                  {conditionLabel}
                </div>
                <div className="text-xs font-normal text-white/70 mt-0.5 flex items-center gap-2">
                  <span>بەرزی: {weather.tempMax}°</span>
                  <span>•</span>
                  <span>نزمی: {weather.tempMin}°</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <AnimatedWeatherIcon type={condInfo.type} className="w-16 h-16 sm:w-20 sm:h-20" />
                <span className="text-[11px] font-normal text-amber-300 mt-1">
                  هەستپێکراو: {weather.feelsLike}°C
                </span>
              </div>
            </div>

            {/* 4 Quick Stat Pills */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2">
              <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 flex flex-col items-center text-center">
                <Droplets className="w-4 h-4 text-cyan-300 mb-1" />
                <span className="text-[10px] text-slate-300 font-normal">شێدارێتی</span>
                <span className="text-xs font-mono font-normal text-white mt-0.5">{weather.humidity}%</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 flex flex-col items-center text-center">
                <Wind className="w-4 h-4 text-emerald-300 mb-1" />
                <span className="text-[10px] text-slate-300 font-normal">خێرایی با</span>
                <span className="text-xs font-mono font-normal text-white mt-0.5">{weather.windSpeed} km/h</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 flex flex-col items-center text-center">
                <Umbrella className="w-4 h-4 text-blue-300 mb-1" />
                <span className="text-[10px] text-slate-300 font-normal">ئەگەری باران</span>
                <span className="text-xs font-mono font-normal text-white mt-0.5">{weather.rainProbability}%</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 flex flex-col items-center text-center">
                <Thermometer className="w-4 h-4 text-rose-300 mb-1" />
                <span className="text-[10px] text-slate-300 font-normal">بەرزترین ئەمڕۆ</span>
                <span className="text-xs font-mono font-normal text-white mt-0.5">{weather.tempMax}°C</span>
              </div>
            </div>

            {/* 5-Day Forecast Row */}
            <div className="relative z-10 mt-3 pt-3 border-t border-white/10 space-y-2">
              <div className="text-[11px] font-normal text-slate-400 flex items-center justify-between">
                <span>پێشبینی ڕۆژانی داهاتوو (5-Day Forecast)</span>
                <span>Open-Meteo Satellite Feed</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {weather.forecast.map((f, i) => {
                  const fcCond = getWeatherConditionInfo(f.code, 1);
                  const fDayName = language === 'ar' ? f.dayAr : language === 'en' ? f.dayEn : f.day;
                  return (
                    <div 
                      key={i} 
                      className="p-2 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col items-center text-center gap-1"
                    >
                      <span className="text-[10px] text-slate-300 font-normal">{fDayName}</span>
                      <AnimatedWeatherIcon type={fcCond.type} className="w-5 h-5 my-0.5" />
                      <div className="text-[10px] font-mono font-normal text-white">
                        <span>{f.max}°</span>
                        <span className="text-slate-400 ms-1 text-[9px]">{f.min}°</span>
                      </div>
                      {f.pop > 10 && (
                        <span className="text-[8px] font-mono text-cyan-300">
                          {f.pop}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
