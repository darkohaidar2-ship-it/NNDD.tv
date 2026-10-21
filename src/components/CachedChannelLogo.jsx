import React, { useState, useEffect } from 'react';
import { Tv } from 'lucide-react';
import { getCachedLogo, setCachedLogo, fetchImageAsBase64 } from '../data/logoCache';

export default function CachedChannelLogo({ 
  channel, 
  className = "w-6 h-6 rounded-full object-cover", 
  fallbackNumberClassName = "text-[10px] font-bold text-white flex items-center justify-center" 
}) {
  // Initialize directly from memory/localStorage cache if already stored
  const [cachedSrc, setCachedSrc] = useState(() => {
    if (!channel) return null;
    return getCachedLogo(channel.id, channel.logo) || channel.logo || null;
  });
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!channel) return;
    setImageFailed(false);
    const existing = getCachedLogo(channel.id, channel.logo);
    if (existing) {
      setCachedSrc(existing);
      return;
    }

    setCachedSrc(channel.logo);

    // If logo not yet cached in localStorage, fetch and store it in background
    let isMounted = true;
    if (channel.logo) {
      fetchImageAsBase64(channel.logo).then(b64 => {
        if (!isMounted) return;
        if (b64) {
          setCachedLogo(channel.id, channel.logo, b64);
          setCachedSrc(b64);
        } else if (channel.fallbackLogo) {
          fetchImageAsBase64(channel.fallbackLogo).then(fbB64 => {
            if (!isMounted) return;
            if (fbB64) {
              setCachedLogo(channel.id, channel.logo, fbB64);
              setCachedSrc(fbB64);
            }
          });
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [channel?.id, channel?.logo]);

  if (!channel) return null;

  if (imageFailed || !cachedSrc) {
    return (
      <img
        src="/dabin-logo.png"
        alt={channel.name || 'DABIN.Tv'}
        className={`${className} object-contain p-0.5`}
      />
    );
  }

  return (
    <img
      src={cachedSrc}
      alt={channel.name || ''}
      className={className}
      onError={() => {
        // Fallback to fallbackLogo if primary fails
        if (cachedSrc !== channel.fallbackLogo && channel.fallbackLogo) {
          setCachedSrc(channel.fallbackLogo);
        } else {
          setImageFailed(true);
        }
      }}
    />
  );
}
