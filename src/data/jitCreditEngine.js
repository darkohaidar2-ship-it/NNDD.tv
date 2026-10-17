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

export const RESELLER_POOL_CONFIG = {
  totalPoolCredits: 120,
  poolCostUsd: 137.00,
  costPerCreditUsd: 1.1416,
  creditDurationDays: 30
};

export const TIER_CONFIGS = {
  free: {
    id: 'free',
    tier: 'free',
    name: 'فری (Free)',
    nameEn: 'FREE',
    iconName: 'Tv',
    badgeText: 'FREE 509 CH',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-400/30 shadow-[0_0_12px_rgba(148,163,184,0.2)]',
    planDurationDays: 3650,
    creditsAllocated: 0,
    priceIqd: '0 IQD',
    priceUsd: '$0',
    channelsCount: 509,
    vodAccess: false,
    quality: '1080p FHD'
  },
  pro: {
    id: 'pro',
    tier: 'pro',
    name: 'پڕۆ (Pro 3M)',
    nameEn: 'PRO 3M',
    iconName: 'Zap',
    badgeText: 'PRO • 3M',
    badgeClass: 'bg-blue-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.35)]',
    planDurationDays: 90, // 3 Months
    creditsAllocated: 3,
    priceIqd: '15,000 IQD',
    priceUsd: '$10',
    channelsCount: 509,
    vodAccess: true,
    quality: '1080p FHD'
  },
  pro_plus: {
    id: 'pro_plus',
    tier: 'pro_plus',
    name: 'پڕۆ ماکس (Pro Max 6M)',
    nameEn: 'PRO MAX 6M',
    iconName: 'Flame',
    badgeText: 'MAX • 6M',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.35)]',
    planDurationDays: 180, // 6 Months
    creditsAllocated: 6,
    priceIqd: '25,000 IQD',
    priceUsd: '$18',
    channelsCount: 509,
    vodAccess: true,
    quality: '4K Ultra HD'
  },
  ultra: {
    id: 'ultra',
    tier: 'ultra',
    name: 'دایمۆند (Diamond 12M)',
    nameEn: 'DIAMOND 1Y',
    iconName: 'Crown',
    badgeText: 'DIAMOND VIP',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.35)]',
    planDurationDays: 365, // 1 Year
    creditsAllocated: 12,
    priceIqd: '45,000 IQD',
    priceUsd: '$32',
    channelsCount: 509,
    vodAccess: true,
    quality: '4K Ultra HDR & VIP'
  }
};

/**
 * Initialize or Normalize a User with JIT Dual-Expiry Engine
 */
export function normalizeUserWithJit(user) {
  if (!user) return null;

  const tierKey = user.planTier || 
    (user.subPlan?.includes('دایمۆند') || user.subPlan?.toLowerCase().includes('ultra') || user.subPlan?.toLowerCase().includes('diamond') ? 'ultra' :
     user.subPlan?.includes('ماکس') || user.subPlan?.toLowerCase().includes('plus') ? 'pro_plus' :
     user.subPlan?.toLowerCase().includes('pro') ? 'pro' : 'free');

  const tier = TIER_CONFIGS[tierKey] || TIER_CONFIGS.free;
  const now = Date.now();

  // If new or missing JIT fields, assign defaults
  const planExpiryDate = user.planExpiryDate || (tierKey === 'free' ? now + (3650 * 86400000) : now + (tier.planDurationDays * 86400000));
  
  // serverCycleExpiryDate is the current 30-day provider window (or plan expiry if free)
  const serverCycleExpiryDate = user.serverCycleExpiryDate || (tierKey === 'free' ? planExpiryDate : now + (30 * 86400000));
  const creditsAllocated = user.creditsAllocated ?? tier.creditsAllocated;
  const creditsConsumed = user.creditsConsumed ?? (tierKey === 'free' ? 0 : 1);
  const creditsSaved = Math.max(0, creditsAllocated - creditsConsumed);

  // Status computation:
  // - 'expired' if now > planExpiryDate (customer's purchased package ended)
  // - 'standby' if now > serverCycleExpiryDate && now < planExpiryDate (saving credits while TV is off)
  // - 'active' if now <= serverCycleExpiryDate
  let jitStatus = user.jitStatus || 'active';
  if (tierKey !== 'free') {
    if (now > planExpiryDate) {
      jitStatus = 'expired';
    } else if (now > serverCycleExpiryDate) {
      jitStatus = 'standby'; // Dormant TV, safely saving reseller credit!
    } else {
      jitStatus = 'active';
    }
  } else {
    jitStatus = 'active';
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
 * Deduct 1 credit, extend serverCycle by +30 days in < 1s, return renewed state.
 */
export function checkAndExecuteJitAutoRenew(user) {
  if (!user || user.planTier === 'free') return { renewed: false, user };

  const norm = normalizeUserWithJit(user);
  const now = Date.now();

  // Is customer still within their purchased plan period?
  const withinPlan = now < norm.planExpiryDate;
  // Has the 30-day server cycle lapsed?
  const cycleExpired = now >= norm.serverCycleExpiryDate;
  // Do they have remaining credits allocated for this tier?
  const hasCredits = norm.creditsConsumed < norm.creditsAllocated;

  if (withinPlan && cycleExpired && hasCredits) {
    // ⚡ Execute JIT Renewal!
    const updated = {
      ...norm,
      creditsConsumed: norm.creditsConsumed + 1,
      creditsSaved: Math.max(0, norm.creditsAllocated - (norm.creditsConsumed + 1)),
      serverCycleExpiryDate: now + (30 * 86400000), // +30 days from power-on
      jitStatus: 'active',
      lastPowerOn: now
    };
    return { renewed: true, user: updated, creditsSpent: 1 };
  }

  // Update lastPowerOn timestamp
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
  let freeCount = 0;
  let totalRevenueUsd = 0;

  normUsers.forEach(u => {
    if (u.planTier === 'free') {
      freeCount++;
    } else {
      activePaidCount++;
      totalCreditsConsumed += (u.creditsConsumed || 0);
      totalCreditsAllocated += (u.creditsAllocated || 0);

      const tier = TIER_CONFIGS[u.planTier];
      const usdVal = parseFloat(tier?.priceUsd?.replace('$', '') || '0');
      totalRevenueUsd += usdVal;

      if (u.jitStatus === 'standby') {
        dormantSavingCount++;
      }
    }
  });

  const poolRemainingCredits = Math.max(0, RESELLER_POOL_CONFIG.totalPoolCredits - totalCreditsConsumed);
  const creditsSavedByDormant = normUsers.reduce((sum, u) => sum + (u.creditsSaved || 0), 0);
  const totalHardwareCostUsd = totalCreditsConsumed * RESELLER_POOL_CONFIG.costPerCreditUsd;
  const netProfitUsd = Math.max(0, totalRevenueUsd - totalHardwareCostUsd);
  const profitMarginPercent = totalRevenueUsd > 0 ? Math.round((netProfitUsd / totalRevenueUsd) * 100) : 100;

  return {
    totalPoolCredits: RESELLER_POOL_CONFIG.totalPoolCredits,
    poolRemainingCredits,
    totalCreditsConsumed,
    totalCreditsAllocated,
    creditsSavedByDormant,
    dormantSavingCount,
    activePaidCount,
    freeCount,
    totalRevenueUsd: Math.round(totalRevenueUsd),
    netProfitUsd: Math.round(netProfitUsd),
    profitMarginPercent,
    costPerCreditUsd: RESELLER_POOL_CONFIG.costPerCreditUsd
  };
}
