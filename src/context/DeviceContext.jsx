import React, { createContext, useContext, useState, useEffect } from 'react';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

const DeviceContext = createContext({
  deviceType: 'tv', // 'phone' | 'tablet' | 'tv'
  isPhone: false,
  isTablet: false,
  isTv: false,
  isTouch: false,
  isPortrait: false,
  width: 1920,
  height: 1080,
  platform: 'web'
});

export function DeviceProvider({ children }) {
  const [deviceState, setDeviceState] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'tv',
        isPhone: false,
        isTablet: false,
        isTv: true,
        isTouch: false,
        isPortrait: false,
        width: 1920,
        height: 1080,
        platform: 'web'
      };
    }

    const ua = navigator.userAgent.toLowerCase();
    const hasTouch = (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;

    // Smart TV Detection (Tizen, webOS, Android TV, Fire TV, Leanback, large non-touch screens)
    const isTvUa = /smart-tv|smarttv|appletv|googletv|tizen|webos|netcast|viera|bravia|aftb|aftt|firetv|roku|hbbtv|leanback|android tv/i.test(ua);
    const isTvScreen = !hasTouch && width >= 1280 && (navigator.maxTouchPoints === 0);
    const isTv = isTvUa || isTvScreen;

    const isTablet = !isTv && (
      /ipad|tablet|playbook|silk/i.test(ua) || 
      (hasTouch && Math.min(width, height) >= 600 && Math.max(width, height) <= 1366)
    );

    const isPhone = !isTv && !isTablet && (
      /mobile|iphone|ipod|android/i.test(ua) || 
      (hasTouch && width < 768) ||
      width < 600
    );

    const deviceType = isTv ? 'tv' : isTablet ? 'tablet' : 'phone';

    return {
      deviceType,
      isPhone,
      isTablet,
      isTv,
      isTouch: hasTouch,
      isPortrait,
      width,
      height,
      platform: Capacitor.getPlatform()
    };
  });

  useEffect(() => {
    let isMounted = true;

    const detectDeviceWithCapacitor = async () => {
      try {
        const info = await Device.getInfo();
        const ua = navigator.userAgent.toLowerCase();
        const width = window.innerWidth;
        const height = window.innerHeight;
        const hasTouch = (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

        // Detect if native Android TV or Leanback
        const isTvUa = /smart-tv|smarttv|appletv|googletv|tizen|webos|firetv|leanback|android tv/i.test(ua) || 
                       (info.operatingSystem === 'android' && !hasTouch && width >= 1280);

        let type = 'phone';
        if (isTvUa || (!hasTouch && width >= 1280)) {
          type = 'tv';
        } else if (
          info.model?.toLowerCase().includes('tablet') || 
          info.model?.toLowerCase().includes('ipad') ||
          (hasTouch && Math.min(width, height) >= 600 && Math.max(width, height) <= 1366)
        ) {
          type = 'tablet';
        } else {
          type = 'phone';
        }

        if (isMounted) {
          setDeviceState(prev => ({
            ...prev,
            deviceType: type,
            isPhone: type === 'phone',
            isTablet: type === 'tablet',
            isTv: type === 'tv',
            isTouch: hasTouch,
            isPortrait: height > width,
            width,
            height,
            platform: info.platform || prev.platform
          }));
        }
      } catch (e) {
        // Fallback already populated by initial state
      }
    };

    detectDeviceWithCapacitor();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = height > width;

      setDeviceState(prev => {
        let type = prev.deviceType;
        if (!prev.isTv) {
          if (prev.isTouch && Math.min(width, height) >= 600 && Math.max(width, height) <= 1366) {
            type = 'tablet';
          } else if (width < 600 || prev.isPhone) {
            type = 'phone';
          }
        }
        return {
          ...prev,
          width,
          height,
          isPortrait,
          deviceType: type,
          isPhone: type === 'phone',
          isTablet: type === 'tablet',
          isTv: type === 'tv'
        };
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <DeviceContext.Provider value={deviceState}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  return useContext(DeviceContext);
}
