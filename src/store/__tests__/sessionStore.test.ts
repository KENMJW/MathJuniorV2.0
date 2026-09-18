import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionStore } from '../sessionStore';

describe('Session Store (Zero Persistence)', () => {
  beforeEach(() => {
    useSessionStore.getState().resetAll();
  });

  it('should initialize with default empty values', () => {
    const state = useSessionStore.getState();
    expect(state.presentedIds.size).toBe(0);
    expect(state.practiceScores).toEqual({});
    expect(state.examScore).toBeNull();
    expect(state.sandboxSliders).toEqual({});
    expect(state.locale).toBe('zh-CN');
    expect(state.deviceOverride).toBeNull();
  });

  it('should manage presentedIds set deduplication', () => {
    const { addPresentedId, addPresentedIds, hasPresentedId, clearPresentedIds } = useSessionStore.getState();

    addPresentedId('q1');
    addPresentedId('q1'); // duplicate
    addPresentedIds(['q2', 'q3', 'q2']);

    const state = useSessionStore.getState();
    expect(state.presentedIds.size).toBe(3);
    expect(hasPresentedId('q1')).toBe(true);
    expect(hasPresentedId('q2')).toBe(true);
    expect(hasPresentedId('q3')).toBe(true);
    expect(hasPresentedId('q4')).toBe(false);

    clearPresentedIds();
    expect(useSessionStore.getState().presentedIds.size).toBe(0);
  });

  it('should track practice and exam scores in memory', () => {
    const { recordPracticeScore, setExamScore } = useSessionStore.getState();

    recordPracticeScore('q101', 2);
    recordPracticeScore('q102', 3);
    setExamScore({ totalScore: 85, maxScore: 100, details: { q1: 10, q2: 15 } });

    const state = useSessionStore.getState();
    expect(state.practiceScores).toEqual({ q101: 2, q102: 3 });
    expect(state.examScore?.totalScore).toBe(85);
  });

  it('should store and reset sandbox sliders', () => {
    const { setSandboxSlider, getSandboxSliders, resetSandboxSliders } = useSessionStore.getState();

    setSandboxSlider('sandbox_1', 'param_a', 2.5);
    setSandboxSlider('sandbox_1', 'param_b', -1.0);
    setSandboxSlider('sandbox_2', 'angle', 45);

    expect(getSandboxSliders('sandbox_1')).toEqual({ param_a: 2.5, param_b: -1.0 });
    expect(getSandboxSliders('sandbox_2')).toEqual({ angle: 45 });

    resetSandboxSliders('sandbox_1');
    expect(getSandboxSliders('sandbox_1')).toEqual({});
    expect(getSandboxSliders('sandbox_2')).toEqual({ angle: 45 });

    resetSandboxSliders();
    expect(useSessionStore.getState().sandboxSliders).toEqual({});
  });

  it('should switch locale and device override', () => {
    const { setLocale, setDeviceOverride } = useSessionStore.getState();

    setLocale('en');
    expect(useSessionStore.getState().locale).toBe('en');

    setDeviceOverride('MOBILE');
    expect(useSessionStore.getState().deviceOverride).toBe('MOBILE');

    setDeviceOverride(null);
    expect(useSessionStore.getState().deviceOverride).toBeNull();
  });

  it('should zero-out all state on resetAll', () => {
    const store = useSessionStore.getState();
    store.addPresentedId('q1');
    store.recordPracticeScore('q1', 2);
    store.setSandboxSlider('sb1', 'x', 10);
    store.setLocale('en');
    store.setDeviceOverride('TABLET');

    store.resetAll();

    const state = useSessionStore.getState();
    expect(state.presentedIds.size).toBe(0);
    expect(state.practiceScores).toEqual({});
    expect(state.examScore).toBeNull();
    expect(state.sandboxSliders).toEqual({});
    expect(state.locale).toBe('zh-CN');
    expect(state.deviceOverride).toBeNull();
  });

  it('Property 19: zero persistence - should never call localStorage or IndexedDB', () => {
    const mockStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).indexedDB = {
      open: vi.fn(),
    };

    const store = useSessionStore.getState();
    store.addPresentedId('q999');
    store.recordPracticeScore('q999', 5);
    store.setLocale('en');
    store.resetAll();

    expect(mockStorage.setItem).toHaveBeenCalledTimes(0);
    expect(mockStorage.getItem).toHaveBeenCalledTimes(0);
    expect((globalThis as any).indexedDB.open).toHaveBeenCalledTimes(0);
  });
});
