import { create } from 'zustand';

export type Locale = 'zh-CN' | 'en';
export type DeviceProfile = 'MOBILE' | 'TABLET' | 'DESKTOP';

export interface ExamSessionScore {
  totalScore: number;
  maxScore: number;
  details: Record<string, number>;
}

export interface SessionState {
  // 1. presented_ids 去重集合 (任务 9.4, 属性 P13)
  presentedIds: Set<string>;
  addPresentedId: (id: string) => void;
  addPresentedIds: (ids: string[]) => void;
  hasPresentedId: (id: string) => boolean;
  clearPresentedIds: () => void;

  // 2. 即时得分与会话答题记录
  practiceScores: Record<string, number>;
  examScore: ExamSessionScore | null;
  recordPracticeScore: (questionId: string, score: number) => void;
  setExamScore: (score: ExamSessionScore | null) => void;
  /**
   * 重置得分与试卷统计，但保留 presentedIds 去重池（供同一次连续答题不重复抽题）。
   * 若需连同抽题池彻底重置，请调用 clearPresentedIds() 或 resetAll()。
   */
  resetScores: () => void;

  // 3. 沙盒滑块动态值 (sandboxId -> paramName -> value)
  sandboxSliders: Record<string, Record<string, number>>;
  setSandboxSlider: (sandboxId: string, param: string, value: number) => void;
  getSandboxSliders: (sandboxId: string) => Record<string, number>;
  resetSandboxSliders: (sandboxId?: string) => void;

  // 4. 当前语言 (默认 zh-CN)
  locale: Locale;
  setLocale: (locale: Locale) => void;

  // 5. 设备 override
  deviceOverride: DeviceProfile | null;
  setDeviceOverride: (override: DeviceProfile | null) => void;

  // 6. 概念精讲全局锁定选中的考点 ID (默认 KP-001)
  selectedConceptPointId: string;
  setSelectedConceptPointId: (id: string) => void;

  // 7. 考完即焚 / 会话重置 (零持久化)
  resetAll: () => void;
}

const initialState = {
  practiceScores: {},
  examScore: null,
  sandboxSliders: {},
  locale: 'zh-CN' as Locale,
  deviceOverride: null as DeviceProfile | null,
  selectedConceptPointId: 'KP-001',
};

export const useSessionStore = create<SessionState>((set, get) => ({
  presentedIds: new Set<string>(),
  ...initialState,

  addPresentedId: (id: string) => {
    set((state) => {
      const next = new Set(state.presentedIds);
      next.add(id);
      return { presentedIds: next };
    });
  },

  addPresentedIds: (ids: string[]) => {
    set((state) => {
      const next = new Set(state.presentedIds);
      ids.forEach((id) => next.add(id));
      return { presentedIds: next };
    });
  },

  hasPresentedId: (id: string) => {
    return get().presentedIds.has(id);
  },

  clearPresentedIds: () => {
    set({ presentedIds: new Set<string>() });
  },

  recordPracticeScore: (questionId: string, score: number) => {
    set((state) => ({
      practiceScores: {
        ...state.practiceScores,
        [questionId]: score,
      },
    }));
  },

  setExamScore: (score: ExamSessionScore | null) => {
    set({ examScore: score });
  },

  resetScores: () => {
    set({ practiceScores: {}, examScore: null });
  },

  setSandboxSlider: (sandboxId: string, param: string, value: number) => {
    set((state) => ({
      sandboxSliders: {
        ...state.sandboxSliders,
        [sandboxId]: {
          ...(state.sandboxSliders[sandboxId] || {}),
          [param]: value,
        },
      },
    }));
  },

  getSandboxSliders: (sandboxId: string) => {
    return get().sandboxSliders[sandboxId] || {};
  },

  resetSandboxSliders: (sandboxId?: string) => {
    if (sandboxId) {
      set((state) => {
        const next = { ...state.sandboxSliders };
        delete next[sandboxId];
        return { sandboxSliders: next };
      });
    } else {
      set({ sandboxSliders: {} });
    }
  },

  setLocale: (locale: Locale) => {
    set({ locale });
  },

  setDeviceOverride: (override: DeviceProfile | null) => {
    set({ deviceOverride: override });
  },

  setSelectedConceptPointId: (id: string) => {
    set({ selectedConceptPointId: id });
  },

  resetAll: () => {
    set({
      presentedIds: new Set<string>(),
      ...initialState,
    });
  },
}));
