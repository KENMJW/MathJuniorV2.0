import { DeviceProfile, getDeviceOverride } from "./deviceOverride";

export type { DeviceProfile } from "./deviceOverride";

export interface DeviceFeatures {
  width?: number;
  height?: number;
  maxTouchPoints?: number;
  hasCoarsePointer?: boolean;
  hasHover?: boolean;
  userAgent?: string;
}

/**
 * 纯函数特征判定：基于传入特征计算 DeviceProfile
 * 保证输入任意特征时，返回值全域完备且恒属于 {MOBILE, TABLET, DESKTOP}
 */
export function evaluateDeviceFeatures(features: DeviceFeatures): DeviceProfile {
  const width = features.width ?? 1280;
  const maxTouchPoints = features.maxTouchPoints ?? 0;
  const hasCoarsePointer = features.hasCoarsePointer ?? false;
  const hasHover = features.hasHover ?? true;

  // 1. 移动端判定:
  // 宽度 < 768px (手机竖屏/横屏)，或触控设备且宽度 < 768px 且无精准 hover
  if (width < 768 || (width < 768 && (hasCoarsePointer || maxTouchPoints > 0) && !hasHover)) {
    return "MOBILE";
  }

  // 2. 平板端判定:
  // 宽度在 [768, 1024] 范围内
  if (width <= 1024) {
    return "TABLET";
  }

  // 3. 桌面端判定 (默认宽屏与精准鼠标 > 1024px)
  return "DESKTOP";
}

/**
 * 运行时设备特征检测调度引擎 (任务 15.1, §10.4)
 * 具备优先读取手动 override、运行时 matchMedia/触控点特征采集能力
 */
export function detectDeviceProfile(featuresOverride?: DeviceFeatures): DeviceProfile {
  // 1. 手动全局覆盖优先 (无需重载切控制器)
  const override = getDeviceOverride();
  if (override) {
    return override;
  }

  // 2. 传入了特征测试参数
  if (featuresOverride) {
    return evaluateDeviceFeatures(featuresOverride);
  }

  // 3. 浏览器环境读取
  if (typeof window !== "undefined") {
    const width = window.innerWidth || (typeof document !== "undefined" ? document.documentElement?.clientWidth : 1024) || 1024;
    const height = window.innerHeight || (typeof document !== "undefined" ? document.documentElement?.clientHeight : 768) || 768;
    const maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0;
    const hasCoarsePointer = window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : false;
    const hasHover = window.matchMedia ? window.matchMedia("(hover: hover)").matches : true;

    return evaluateDeviceFeatures({
      width,
      height,
      maxTouchPoints,
      hasCoarsePointer,
      hasHover,
    });
  }

  return "DESKTOP";
}
