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

  // 7. 模块二思维图谱全局锁定主线 ID (默认 A1)
  selectedGraphLineId: string;
  setSelectedGraphLineId: (id: string) => void;

  // 8. 模块三动力沙盒全局锁定模型 ID (默认 LM-7A-01)
  selectedLeapModelId: string;
  setSelectedLeapModelId: (id: string) => void;

  // 9. 移动端二级书签子视窗同步状态
  conceptSubTab: 'stages' | 'sandbox' | 'master' | 'practice';
  setConceptSubTab: (tab: 'stages' | 'sandbox' | 'master' | 'practice') => void;
  leapSubTab: 'deduction' | 'free';
  setLeapSubTab: (tab: 'deduction' | 'free') => void;
  graphSubTab: 'concept' | 'sandbox' | 'master' | 'practice';
  setGraphSubTab: (tab: 'concept' | 'sandbox' | 'master' | 'practice') => void;

  // 10. 移动端 80vh Bottom Sheet 抽屉显隐控制
  isConceptDrawerOpen: boolean;
  setIsConceptDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isLeapDrawerOpen: boolean;
  setIsLeapDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isGraphDrawerOpen: boolean;
  setIsGraphDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => void;

  // 11. 考完即焚 / 会话重置 (零持久化)
  resetAll: () => void;
}

const initialState = {
  practiceScores: {},
  examScore: null,
  sandboxSliders: {},
  locale: 'zh-CN' as Locale,
  deviceOverride: null as DeviceProfile | null,
  selectedConceptPointId: 'KP-001',
  selectedGraphLineId: 'A1',
  selectedLeapModelId: 'LM-7A-01',
  conceptSubTab: 'stages' as const,
  leapSubTab: 'deduction' as const,
  graphSubTab: 'concept' as const,
  isConceptDrawerOpen: false,
  isLeapDrawerOpen: false,
  isGraphDrawerOpen: false,
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

  setSelectedGraphLineId: (id: string) => {
    set({ selectedGraphLineId: id });
  },

  setSelectedLeapModelId: (id: string) => {
    set({ selectedLeapModelId: id });
  },

  setConceptSubTab: (tab: 'stages' | 'sandbox' | 'master' | 'practice') => {
    set({ conceptSubTab: tab });
  },

  setLeapSubTab: (tab: 'deduction' | 'free') => {
    set({ leapSubTab: tab });
  },

  setGraphSubTab: (tab: 'concept' | 'sandbox' | 'master' | 'practice') => {
    set({ graphSubTab: tab });
  },

  setIsConceptDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => {
    set((state) => ({
      isConceptDrawerOpen: typeof open === 'function' ? open(state.isConceptDrawerOpen) : open,
    }));
  },

  setIsLeapDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => {
    set((state) => ({
      isLeapDrawerOpen: typeof open === 'function' ? open(state.isLeapDrawerOpen) : open,
    }));
  },

  setIsGraphDrawerOpen: (open: boolean | ((prev: boolean) => boolean)) => {
    set((state) => ({
      isGraphDrawerOpen: typeof open === 'function' ? open(state.isGraphDrawerOpen) : open,
    }));
  },

  resetAll: () => {
    set({
      presentedIds: new Set<string>(),
      ...initialState,
    });
  },
}));
