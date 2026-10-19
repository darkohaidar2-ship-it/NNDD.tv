/**
 * NNDD TV - Smart Just-In-Time (JIT) Monthly Credit Engine & Dual-Expiry Manager
 * 
 * Economics: Reseller Pool = 120 Credits ($137 total, ~$1.14 / Credit)
 * 1 Credit = 1 Server Month (30 Days window on IPTV server)
 * 
 * 4 Tiers:
 * 1. FREE (فری): 509 Base Live Channels, 0 Credits, Permanent access
 * 2. PRO (پڕۆ): 3 Months (90 Days) Plan Window = 3 Credits (1 Month JIT initial)
 * 3. PRO MAX (پڕۆ ماکس): 6 Months (180 Days) Plan Window = 6 Credits (1 Month JIT initial)
 * 4. DIAMOND (دایمۆند): 12 Months (365 Days) Plan Window = 12 Credits (1 Month JIT initial)
 */

/**
 * NNDD TV - Smart Just-In-Time (JIT) Monthly Credit Engine & Dual-Expiry Manager
 * 
 * Economics & Pricing Structure (IQD & Credits):
 * Total Reseller Pool: 5.0 Credits (Equivalent to 50 server activation months or 5 full years)
 * 1 Server Month (30 Days window) = 0.1 Credit
 * 
 * Pricing Tiers (Hardcoded):
 * - Free Test (24 Hours): 0 IQD (0.0 Credit)
 * - 1 Month: 5,000 IQD (0.1 Credit)
 * - 3 Months: 9,000 IQD (0.3 Credit)
 * - 6 Months: 15,000 IQD (0.6 Credit)
 * - 1 Year (Diamond VIP): 28,000 IQD (1.0 Credit)
 * 
 * Smart JIT Activation Model:
 * When a user buys a 1-year (1.0 Cr) or 6-month (0.6 Cr) plan, the system registers it locally.
 * However, it only deducts 1 month (0.1 credit) from the master IPTV panel when the user
 * actually streams/logs in for that cycle, preserving reseller credits while users are dormant.
 */

export const RESELLER_POOL_CONFIG = {
  totalPoolCredits: 5.0,
  poolCostUsd: 55.00,
  costPerCreditUsd: 11.00, // 1.0 Credit = $11.00; 0.1 Credit = $1.10 (~1,450 IQD)
  costPerMonthIqd: 1450,
  creditDurationDays: 30,
  currency: 'IQD'
};

export const TIER_CONFIGS = {
  trial: {
    id: 'trial',
    tier: 'trial',
    name: 'تێستی ٢٤ کاتژمێر (Free Trial)',
    nameEn: '24H FREE TRIAL',
    iconName: 'Tv',
    badgeText: 'FREE • 24H',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-400/30 shadow-[0_0_12px_rgba(148,163,184,0.2)]',
    planDurationDays: 1,
    creditsAllocated: 0.0,
    priceIqd: '0 IQD',
    priceIqdNum: 0,
    priceUsd: '$0',
    channelsCount: 20188,
    vodAccess: true,
    quality: '1080p FHD'
  },
  month1: {
    id: 'month1',
    tier: 'month1',
    name: '١ مانگ (1 Month)',
    nameEn: '1 MONTH',
    iconName: 'Zap',
    badgeText: '1M • 0.1 Cr',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.35)]',
    planDurationDays: 30,
    creditsAllocated: 0.1,
    priceIqd: '5,000 IQD',
    priceIqdNum: 5000,
    priceUsd: '$3.80',
    channelsCount: 20188,
    vodAccess: true,
    quality: '1080p / 4K'
  },
  month3: {
    id: 'month3',
    tier: 'month3',
    name: '٣ مانگ (3 Months)',
    nameEn: '3 MONTHS',
    iconName: 'Sparkles',
    badgeText: '3M • 0.3 Cr',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.35)]',
    planDurationDays: 90,
    creditsAllocated: 0.3,
    priceIqd: '9,000 IQD',
    priceIqdNum: 9000,
    priceUsd: '$6.80',
    channelsCount: 20188,
    vodAccess: true,
    quality: '1080p / 4K'
  },
  month6: {
    id: 'month6',
    tier: 'month6',
    name: '٦ مانگ (6 Months)',
    nameEn: '6 MONTHS',
    iconName: 'Flame',
    badgeText: '6M • 0.6 Cr',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.35)]',
    planDurationDays: 180,
    creditsAllocated: 0.6,
    priceIqd: '15,000 IQD',
    priceIqdNum: 15000,
    priceUsd: '$11.50',
    channelsCount: 20188,
    vodAccess: true,
    quality: '4K Ultra HD & VOD'
  },
  year1: {
    id: 'year1',
    tier: 'year1',
    name: '١ ساڵ دایمۆند (1 Year Diamond)',
    nameEn: 'DIAMOND 1Y',
    iconName: 'Crown',
    badgeText: 'DIAMOND • 1.0 Cr',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.35)]',
    planDurationDays: 365,
    creditsAllocated: 1.0,
    priceIqd: '28,000 IQD',
    priceIqdNum: 28000,
    priceUsd: '$21.50',
    channelsCount: 20188,
    vodAccess: true,
    quality: '4K HDR VIP & Multi-Server'
  }
};

// Aliases for backwards compatibility
TIER_CONFIGS.free = TIER_CONFIGS.trial;
TIER_CONFIGS.pro = TIER_CONFIGS.month3;
TIER_CONFIGS.pro_plus = TIER_CONFIGS.month6;
TIER_CONFIGS.ultra = TIER_CONFIGS.year1;
TIER_CONFIGS.diamond = TIER_CONFIGS.year1;

/**
 * Resolve tier from string key or description
 */
export function resolveTierKey(keyOrName = '') {
  const str = String(keyOrName).toLowerCase();
  if (str.includes('diamond') || str.includes('دایمۆند') || str.includes('ultra') || str.includes('year') || str.includes('١ ساڵ') || str.includes('1y')) {
    return 'year1';
  }
  if (str.includes('6m') || str.includes('٦ مانگ') || str.includes('month6') || str.includes('plus') || str.includes('ماکس')) {
    return 'month6';
  }
  if (str.includes('3m') || str.includes('٣ مانگ') || str.includes('month3') || str.includes('pro')) {
    return 'month3';
  }
  if (str.includes('1m') || str.includes('١ مانگ') || str.includes('month1')) {
    return 'month1';
  }
  return 'trial';
}

/**
 * Initialize or Normalize a User with JIT Dual-Expiry Engine
 */
export function normalizeUserWithJit(user) {
  if (!user) return null;

  const rawKey = user.planTier || user.subPlan || '';
  const tierKey = resolveTierKey(rawKey);
  const tier = TIER_CONFIGS[tierKey] || TIER_CONFIGS.trial;
  const now = Date.now();

  const isFreeTrial = tierKey === 'trial';
  const planDurationDays = user.planDurationDays || tier.planDurationDays;
  const planExpiryDate = user.planExpiryDate || (now + (planDurationDays * 86400000));
  
  // serverCycleExpiryDate is the current 30-day provider window (capped by plan expiry)
  const defaultCycleDays = isFreeTrial ? 1 : Math.min(30, planDurationDays);
  const serverCycleExpiryDate = user.serverCycleExpiryDate || (now + (defaultCycleDays * 86400000));
  
  const creditsAllocated = Number(user.creditsAllocated ?? tier.creditsAllocated);
  // JIT principle: initial consumption is 0.1 credit (or 0 for trial)
  const defaultConsumed = isFreeTrial ? 0 : Math.min(0.1, creditsAllocated);
  const creditsConsumed = Number(user.creditsConsumed ?? defaultConsumed);
  const creditsSaved = Math.max(0, parseFloat((creditsAllocated - creditsConsumed).toFixed(2)));

  // Status computation:
  let jitStatus = user.jitStatus || 'active';
  if (!isFreeTrial) {
    if (now > planExpiryDate) {
      jitStatus = 'expired';
    } else if (now > serverCycleExpiryDate) {
      jitStatus = 'standby'; // Dormant TV, saving reseller credit!
    } else {
      jitStatus = 'active';
    }
  } else {
    jitStatus = now > planExpiryDate ? 'expired' : 'active';
  }

  return {
    ...user,
    planTier: tierKey,
    subPlan: user.subPlan || tier.name,
    planExpiryDate,
    serverCycleExpiryDate,
    creditsAllocated,
    creditsConsumed,
    creditsSaved,
    jitStatus,
    lastPowerOn: user.lastPowerOn || now
  };
}

/**
 * TV Power-On Trigger: Auto-renew only when an active user launches the TV/App
 * If serverCycle has expired but user is still within planExpiryDate and has unspent credits:
 * Deduct 0.1 credit (1 month), extend serverCycle by +30 days, return renewed state.
 */
export function checkAndExecuteJitAutoRenew(user) {
  if (!user || user.planTier === 'trial' || user.planTier === 'free') {
    return { renewed: false, user };
  }

  const norm = normalizeUserWithJit(user);
  const now = Date.now();

  const withinPlan = now < norm.planExpiryDate;
  const cycleExpired = now >= norm.serverCycleExpiryDate;
  const hasCredits = norm.creditsConsumed < norm.creditsAllocated;

  if (withinPlan && cycleExpired && hasCredits) {
    const nextConsumed = parseFloat((norm.creditsConsumed + 0.1).toFixed(2));
    const nextSaved = Math.max(0, parseFloat((norm.creditsAllocated - nextConsumed).toFixed(2)));
    const nextCycleEnd = Math.min(norm.planExpiryDate, now + (30 * 86400000));

    const updated = {
      ...norm,
      creditsConsumed: nextConsumed,
      creditsSaved: nextSaved,
      serverCycleExpiryDate: nextCycleEnd,
      jitStatus: 'active',
      lastPowerOn: now
    };
    return { renewed: true, user: updated, creditsSpent: 0.1 };
  }

  return { 
    renewed: false, 
    user: { ...norm, lastPowerOn: now } 
  };
}

/**
 * Calculate Global JIT Reseller Pool Metrics for Admin Dashboard
 */
export function calculateJitResellerMetrics(users = []) {
  const normUsers = users.map(normalizeUserWithJit).filter(Boolean);

  let totalCreditsConsumed = 0;
  let totalCreditsAllocated = 0;
  let dormantSavingCount = 0;
  let activePaidCount = 0;
  let trialCount = 0;
  let totalRevenueIqd = 0;

  normUsers.forEach(u => {
    if (u.planTier === 'trial') {
      trialCount++;
    } else {
      activePaidCount++;
      totalCreditsConsumed += (u.creditsConsumed || 0);
      totalCreditsAllocated += (u.creditsAllocated || 0);

      const tier = TIER_CONFIGS[u.planTier];
      const iqdVal = tier?.priceIqdNum || 0;
      totalRevenueIqd += iqdVal;

      if (u.jitStatus === 'standby') {
        dormantSavingCount++;
      }
    }
  });

  totalCreditsConsumed = parseFloat(totalCreditsConsumed.toFixed(2));
  totalCreditsAllocated = parseFloat(totalCreditsAllocated.toFixed(2));
  
  const poolRemainingCredits = Math.max(0, parseFloat((RESELLER_POOL_CONFIG.totalPoolCredits - totalCreditsConsumed).toFixed(2)));
  const creditsSavedByDormant = parseFloat(normUsers.reduce((sum, u) => sum + (u.creditsSaved || 0), 0).toFixed(2));
  
  // Cost & Profit in IQD
  const totalHardwareCostIqd = Math.round((totalCreditsConsumed / 0.1) * RESELLER_POOL_CONFIG.costPerMonthIqd);
  const netProfitIqd = Math.max(0, totalRevenueIqd - totalHardwareCostIqd);
  const profitMarginPercent = totalRevenueIqd > 0 ? Math.round((netProfitIqd / totalRevenueIqd) * 100) : 85;

  return {
    totalPoolCredits: RESELLER_POOL_CONFIG.totalPoolCredits,
    poolRemainingCredits,
    totalCreditsConsumed,
    totalCreditsAllocated,
    creditsSavedByDormant,
    dormantSavingCount,
    activePaidCount,
    trialCount,
    totalRevenueIqd,
    totalHardwareCostIqd,
    netProfitIqd,
    profitMarginPercent,
    costPerCreditUsd: RESELLER_POOL_CONFIG.costPerCreditUsd
  };
}
