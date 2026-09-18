import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import { evaluateDeviceFeatures, detectDeviceProfile, DeviceProfile } from "./detectDeviceProfile";
import { setDeviceOverride, clearDeviceOverride } from "./deviceOverride";

/**
 * Feature: math-junior-frontend, Property 15: 设备判定完备性
 *
 * 验收要求：
 * 1. 任意特征输入返回值恒属于 {MOBILE, TABLET, DESKTOP}，无 undefined；
 * 2. 具备全局 override 能力，有 override 时无论环境特征如何恒返回 override；
 * 3. 迭代次数 >= 100 次。
 */
describe("Feature: math-junior-frontend, Property 15: 设备判定完备性", () => {
  beforeEach(() => {
    clearDeviceOverride();
  });

  afterEach(() => {
    clearDeviceOverride();
  });

  it("Property 15.1: 任意特征输入返回值恒属于 {MOBILE, TABLET, DESKTOP}", () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: -500, max: 10000 }),
          height: fc.integer({ min: -500, max: 10000 }),
          maxTouchPoints: fc.integer({ min: 0, max: 20 }),
          hasCoarsePointer: fc.boolean(),
          hasHover: fc.boolean(),
        }),
        (features) => {
          const profile = evaluateDeviceFeatures(features);
          expect(["MOBILE", "TABLET", "DESKTOP"]).toContain(profile);
        }
      ),
      { numRuns: 150 }
    );
  });

  it("Property 15.2: 当设置全局 override 时，detectDeviceProfile 恒返回 override", () => {
    const profiles: DeviceProfile[] = ["MOBILE", "TABLET", "DESKTOP"];
    fc.assert(
      fc.property(
        fc.constantFrom(...profiles),
        fc.record({
          width: fc.integer({ min: 100, max: 4000 }),
          maxTouchPoints: fc.integer({ min: 0, max: 10 }),
          hasCoarsePointer: fc.boolean(),
          hasHover: fc.boolean(),
        }),
        (overrideChoice, dummyFeatures) => {
          setDeviceOverride(overrideChoice);
          const detected = detectDeviceProfile(dummyFeatures);
          expect(detected).toBe(overrideChoice);
        }
      ),
      { numRuns: 120 }
    );
  });

  it("Property 15.3: 清除 override 后恢复特征判定", () => {
    setDeviceOverride("MOBILE");
    expect(detectDeviceProfile({ width: 1920, hasHover: true, maxTouchPoints: 0 })).toBe("MOBILE");
    clearDeviceOverride();
    expect(detectDeviceProfile({ width: 1920, hasHover: true, maxTouchPoints: 0 })).toBe("DESKTOP");
  });
});
