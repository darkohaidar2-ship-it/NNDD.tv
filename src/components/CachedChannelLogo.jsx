import React, { useState, useEffect } from 'react';
import { Tv } from 'lucide-react';
import { getCachedLogo, setCachedLogo, fetchImageAsBase64 } from '../data/logoCache';
import { getSafeImageUrl } from '../data/streamProxyHelper';

export default function CachedChannelLogo({ 
  channel, 
  className = "w-6 h-6 rounded-none object-cover", 
  fallbackNumberClassName = "text-[10px] font-bold text-white flex items-center justify-center" 
}) {
  const [imageFailed, setImageFailed] = useState(false);
  
  const rawLogo = channel?.logo || channel?.stream_icon || channel?.streamIcon || null;
  const safeUrl = getSafeImageUrl(rawLogo);

  const [cachedSrc, setCachedSrc] = useState(() => {
    if (!channel || !safeUrl) return null;
    const cached = getCachedLogo(channel.id, safeUrl);
    return cached || safeUrl;
  });

  useEffect(() => {
    if (!channel || !safeUrl) {
      setCachedSrc(null);
      setImageFailed(true);
      return;
    }

    setImageFailed(false);
    const existing = getCachedLogo(channel.id, safeUrl);
    if (existing) {
      setCachedSrc(existing);
      return;
    }

    setCachedSrc(safeUrl);

    let isMounted = true;
    fetchImageAsBase64(safeUrl)
      .then(b64 => {
        if (!isMounted || !b64) return;
        setCachedLogo(channel.id, safeUrl, b64);
        setCachedSrc(b64);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [channel?.id, safeUrl]);

  if (!channel) return null;

  // Clean, minimalist pure-white SVG TV fallback icon when logo is null or failed
  if (imageFailed || !cachedSrc) {
    return (
      <div className={`${className} flex items-center justify-center bg-white/10 p-1 text-white`}>
        <Tv className="w-full h-full text-white/90" />
      </div>
    );
  }

  return (
    <img
      src={cachedSrc}
      alt={channel.name || 'Channel'}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        setImageFailed(true);
      }}
    />
  );
}
