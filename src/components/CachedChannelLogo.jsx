import React, { useState, useEffect } from 'react';
import { getCachedLogo, setCachedLogo, fetchImageAsBase64 } from '../data/logoCache';
import { getSafeLogoUrl, isProblematicHttpLogo } from '../data/streamProxyHelper';

export default function CachedChannelLogo({ 
  channel, 
  className = "w-6 h-6 rounded-full object-cover", 
  fallbackNumberClassName = "text-[10px] font-bold text-white flex items-center justify-center" 
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [cachedSrc, setCachedSrc] = useState(() => {
    if (!channel) return null;
    const cached = getCachedLogo(channel.id, channel.logo);
    if (cached) return cached;
    return getSafeLogoUrl(channel.logo);
  });

  useEffect(() => {
    if (!channel) return;
    setImageFailed(false);

    const existing = getCachedLogo(channel.id, channel.logo);
    if (existing) {
      setCachedSrc(existing);
      return;
    }

    const safeUrl = getSafeLogoUrl(channel.logo);
    setCachedSrc(safeUrl);

    // Only attempt background base64 conversion if the URL is not a problematic insecure IP
    // (prevents ERR_CONNECTION_REFUSED and Mixed Content console spam)
    let isMounted = true;
    if (channel.logo && !isProblematicHttpLogo(channel.logo)) {
      fetchImageAsBase64(channel.logo)
        .then(b64 => {
          if (!isMounted || !b64) return;
          setCachedLogo(channel.id, channel.logo, b64);
          setCachedSrc(b64);
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [channel?.id, channel?.logo]);

  if (!channel) return null;

  // Fallback image if primary logo fails or is empty
  if (imageFailed || !cachedSrc) {
    return (
      <img
        src="/kobin-logo.png"
        alt={channel.name || 'KOBIN TV'}
        className={`${className} object-contain p-0.5 bg-black/40`}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          // If even fallback image fails, hide broken img icon gracefully
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <img
      src={cachedSrc}
      alt={channel.name || ''}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        // Fallback to fallbackLogo if primary fails
        if (channel.fallbackLogo && cachedSrc !== channel.fallbackLogo) {
          setCachedSrc(getSafeLogoUrl(channel.fallbackLogo));
        } else {
          setImageFailed(true);
        }
      }}
    />
  );
}
