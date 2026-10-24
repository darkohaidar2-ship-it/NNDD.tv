import { Ytdl } from '@distube/ytdl-core';

// In-Memory Cache for Resolved Streams (1 Hour TTL)
const streamCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Helper to extract 11-char YouTube video ID from various URL formats
export function extractVideoId(input = '') {
  if (!input) return null;
  const clean = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;

  const patterns = [
    /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([a-zA-Z0-9_-]{11})/i,
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const regex of patterns) {
    const match = clean.match(regex);
    if (match && match[1]) return match[1];
  }
  return null;
}

// Fallback Piped API Instances
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacydev.net',
  'https://piped-api.lunar.icu',
  'https://pipedapi.leptons.xyz',
  'https://api.piped.yt'
];

// Fallback Invidious API Instances
const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://invidious.projectsegfau.lt',
  'https://yt.artemislena.eu',
  'https://invidious.jing.rocks',
  'https://inv.tux.pizza'
];

export default async function handler(req, res) {
  // Set Zero-Cache Headers so timeline seeks and video changes are always fresh
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const queryUrl = req.query.url || req.query.videoId || req.query.id;
  const videoId = extractVideoId(queryUrl);

  if (!videoId) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing YouTube URL / videoId'
    });
  }

  // Check In-Memory Cache first
  const cached = streamCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.status(200).json({
      ...cached.data,
      fromCache: true
    });
  }

  // ---------------------------------------------------------------------------
  // METHOD 1: @distube/ytdl-core Direct Extractor (Fastest & Highest Quality)
  // ---------------------------------------------------------------------------
  try {
    const ytdl = new Ytdl();
    const info = await ytdl.getInfo(videoId);

    if (info && info.formats && info.formats.length > 0) {
      const formatsWithUrl = info.formats.filter(f => f.url);

      // 1. Check for single progressive stream (Both Audio & Video combined in MP4)
      const progressive = formatsWithUrl.find(f => f.hasVideo && f.hasAudio && f.container === 'mp4');

      // 2. Or best mp4 video stream + best mp4 audio stream
      const mp4Videos = formatsWithUrl
        .filter(f => f.hasVideo && f.container === 'mp4')
        .sort((a, b) => (parseInt(b.qualityLabel, 10) || 0) - (parseInt(a.qualityLabel, 10) || 0));

      const bestVideo = progressive || mp4Videos[0] || formatsWithUrl.find(f => f.hasVideo);

      const mp4Audios = formatsWithUrl
        .filter(f => f.hasAudio && !f.hasVideo && f.container === 'mp4')
        .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

      const bestAudio = (!progressive && bestVideo && !bestVideo.hasAudio) 
        ? (mp4Audios[0] || formatsWithUrl.find(f => f.hasAudio && !f.hasVideo))
        : null;

      if (bestVideo && bestVideo.url) {
        const payload = {
          success: true,
          videoId,
          title: info.videoDetails?.title || 'DABIN.Tv Program',
          streamUrl: bestVideo.url,
          audioUrl: bestAudio?.url || null,
          isMuxed: !!bestVideo.hasAudio,
          quality: bestVideo.qualityLabel || '1080p',
          format: bestVideo.container || 'mp4',
          duration: parseInt(info.videoDetails?.lengthSeconds, 10) || 0,
          extractor: 'distube-ytdl'
        };

        streamCache.set(videoId, { timestamp: Date.now(), data: payload });
        return res.status(200).json(payload);
      }
    }
  } catch (ytdlErr) {
    console.warn(`[YouTube Resolver] ytdl-core attempt for ${videoId} failed:`, ytdlErr.message);
  }

  // ---------------------------------------------------------------------------
  // METHOD 2: Piped API Fallback List (HLS .m3u8 & Direct MP4 Streams)
  // ---------------------------------------------------------------------------
  for (const instance of PIPED_INSTANCES) {
    try {
      const pipedUrl = `${instance}/streams/${videoId}`;
      const resPiped = await fetch(pipedUrl, {
        signal: AbortSignal.timeout(3500),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });

      if (resPiped.ok) {
        const pData = await resPiped.json();
        const hlsStream = pData.hls;
        const mp4Stream = (pData.videoStreams || []).find(v => !v.videoOnly && v.format === 'mp4') || pData.videoStreams?.[0];

        const targetStream = hlsStream || mp4Stream?.url;
        if (targetStream) {
          const payload = {
            success: true,
            videoId,
            title: pData.title || 'DABIN.Tv Program',
            streamUrl: targetStream,
            audioUrl: null,
            isMuxed: true,
            quality: mp4Stream?.quality || (hlsStream ? 'Auto (HLS)' : '1080p'),
            format: hlsStream ? 'hls' : 'mp4',
            duration: pData.duration || 0,
            extractor: `piped (${instance})`
          };

          streamCache.set(videoId, { timestamp: Date.now(), data: payload });
          return res.status(200).json(payload);
        }
      }
    } catch (e) {
      // Continue to next instance
    }
  }

  // ---------------------------------------------------------------------------
  // METHOD 3: Invidious API Fallback List
  // ---------------------------------------------------------------------------
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const invUrl = `${instance}/api/v1/videos/${videoId}`;
      const resInv = await fetch(invUrl, {
        signal: AbortSignal.timeout(3500),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });

      if (resInv.ok) {
        const iData = await resInv.json();
        const formatStream = (iData.formatStreams || []).find(f => f.container === 'mp4') || iData.formatStreams?.[0];
        const hlsUrl = iData.hlsUrl;

        const target = hlsUrl || formatStream?.url;
        if (target) {
          const payload = {
            success: true,
            videoId,
            title: iData.title || 'DABIN.Tv Program',
            streamUrl: target,
            audioUrl: null,
            isMuxed: true,
            quality: formatStream?.qualityLabel || '720p',
            format: hlsUrl ? 'hls' : 'mp4',
            duration: iData.lengthSeconds || 0,
            extractor: `invidious (${instance})`
          };

          streamCache.set(videoId, { timestamp: Date.now(), data: payload });
          return res.status(200).json(payload);
        }
      }
    } catch (e) {
      // Continue to next instance
    }
  }

  // ---------------------------------------------------------------------------
  // GRACEFUL FALLBACK: Signal Frontend to use IFrame "TV Shield"
  // ---------------------------------------------------------------------------
  return res.status(200).json({
    success: false,
    fallback: 'iframe',
    videoId,
    message: 'Direct stream extraction not available. Falling back to TV Shield IFrame.'
  });
}
