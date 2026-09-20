import { useState, useEffect } from 'react';
import { detectDeviceProfile, DeviceProfile } from '../engine/device/detectDeviceProfile';

export interface DeviceResponsiveState {
  device: DeviceProfile;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  width: number;
  height: number;
}

/**
 * 统一多端响应式感知 Hook
 * 严格对齐 768px (Mobile) 与 1024px (Tablet) 断点规范
 * 保证电脑端 (>1024px) 恒定处于 DESKTOP 模式，绝无回归
 */
export function useDeviceResponsive(): DeviceResponsiveState {
  const getSnapshot = (): DeviceResponsiveState => {
    if (typeof window === 'undefined') {
      return {
        device: 'DESKTOP',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
        width: 1440,
        height: 900,
      };
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    const device = detectDeviceProfile();
    return {
      device,
      isMobile: device === 'MOBILE',
      isTablet: device === 'TABLET',
      isDesktop: device === 'DESKTOP',
      orientation: width >= height ? 'landscape' : 'portrait',
      width,
      height,
    };
  };

  const [state, setState] = useState<DeviceResponsiveState>(getSnapshot);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setState(getSnapshot());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 定期或在 window.matchMedia 变更时保证同步
    const mqlMobile = window.matchMedia('(max-width: 767px)');
    const mqlTablet = window.matchMedia('(min-width: 768px) and (max-width: 1024px)');
    mqlMobile.addEventListener?.('change', handleResize);
    mqlTablet.addEventListener?.('change', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      mqlMobile.removeEventListener?.('change', handleResize);
      mqlTablet.removeEventListener?.('change', handleResize);
    };
  }, []);

  return state;
}
