export type DeviceProfile = "MOBILE" | "TABLET" | "DESKTOP";

let currentOverride: DeviceProfile | null = null;

/**
 * 设置全局设备 profile 覆盖 (任务 15.1, §10.4)
 * 用于开发调试、响应式三端自适应手动切换与测试
 */
export function setDeviceOverride(profile: DeviceProfile | null): void {
  currentOverride = profile;
}

/**
 * 获取当前全局设备 profile 覆盖
 */
export function getDeviceOverride(): DeviceProfile | null {
  return currentOverride;
}

/**
 * 清除全局设备 profile 覆盖
 */
export function clearDeviceOverride(): void {
  currentOverride = null;
}
