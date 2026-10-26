import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile viewport, touch capabilities, and mobile user agents.
 * Provides real-time updates on orientation/resize events.
 * 
 * @returns {{ isMobileViewport: boolean, isTouchDevice: boolean, isMobile: boolean }}
 */
export function useMobileDetect() {
  const [deviceInfo, setDeviceInfo] = useState(() => {
    if (typeof window === 'undefined') {
      return { isMobileViewport: false, isTouchDevice: false, isMobile: false };
    }

    const checkViewport = () => window.innerWidth < 768;
    const checkTouch = () => 
      'ontouchstart' in window || 
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 
      (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);
    const checkUserAgent = () => 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');

    const isMobileViewport = checkViewport();
    const isTouchDevice = Boolean(checkTouch());
    const isUserAgentMobile = checkUserAgent();

    return {
      isMobileViewport,
      isTouchDevice,
      // Considered mobile if viewport < 768px OR (touch device with mobile user agent)
      isMobile: isMobileViewport || (isTouchDevice && isUserAgentMobile),
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const updateDevice = () => {
      const isMobileViewport = mediaQuery.matches || window.innerWidth < 768;
      const isTouchDevice = 
        'ontouchstart' in window || 
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);
      const isUserAgentMobile = 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');

      setDeviceInfo({
        isMobileViewport,
        isTouchDevice: Boolean(isTouchDevice),
        isMobile: isMobileViewport || (isTouchDevice && isUserAgentMobile),
      });
    };

    // Initial check
    updateDevice();

    // Event listeners for window resize & media query change
    window.addEventListener('resize', updateDevice);
    window.addEventListener('orientationchange', updateDevice);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateDevice);
    } else {
      mediaQuery.addListener(updateDevice);
    }

    return () => {
      window.removeEventListener('resize', updateDevice);
      window.removeEventListener('orientationchange', updateDevice);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateDevice);
      } else {
        mediaQuery.removeListener(updateDevice);
      }
    };
  }, []);

  return deviceInfo;
}

export default useMobileDetect;
