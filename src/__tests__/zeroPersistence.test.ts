import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSessionStore } from "../store/sessionStore";
import { drawQuestions } from "../modules/exam/drawQuestions";
import { testExamQuestions } from "../modules/exam/__tests__/testExamQuestions";
import { calculateTriangleArea } from "../modules/sandbox/invariants";
import { calculateSolutionScore } from "../engine/judge/calculateSolutionScore";

/**
 * Feature: math-junior-frontend, Property 19: 零持久化不变量 (EDGE_CASE)
 *
 * 铁律 2 门禁校验：
 * 在全生命周期的答题、快练、组卷、在线测评、沙盒形变全过程中，
 * 严格保持会话内存态，绝对禁止向 localStorage / sessionStorage / IndexedDB 发起任何写操作。
 * 考完即焚，刷新即净。
 */
describe("Feature: math-junior-frontend, Property 19: 零持久化不变量 (EDGE_CASE)", () => {
  let localStorageSetSpy: any;
  let sessionStorageSetSpy: any;
  let indexedDBOpenSpy: any;

  beforeEach(() => {
    // 确保 globalThis 上存在模拟对象并挂载 spy
    const storageMock = {
      setItem: vi.fn(),
      getItem: vi.fn(() => null),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    (globalThis as any).localStorage = storageMock;
    (globalThis as any).sessionStorage = storageMock;
    (globalThis as any).indexedDB = {
      open: vi.fn(),
    };

    localStorageSetSpy = vi.spyOn((globalThis as any).localStorage, "setItem");
    sessionStorageSetSpy = vi.spyOn((globalThis as any).sessionStorage, "setItem");
    indexedDBOpenSpy = vi.spyOn((globalThis as any).indexedDB, "open");

    // 重置内存 Store
    useSessionStore.getState().resetAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("EDGE_CASE 1: 快练与得分流转全程零持久化调用", () => {
    const store = useSessionStore.getState();

    store.recordPracticeScore("Q-101", 1);
    store.recordPracticeScore("Q-102", 0);
    store.recordPracticeScore("Q-201", 1);
    store.addPresentedIds(["Q-101", "Q-102", "Q-201"]);

    const scores = useSessionStore.getState().practiceScores;
    expect(scores["Q-101"]).toBe(1);
    expect(scores["Q-102"]).toBe(0);
    expect(scores["Q-201"]).toBe(1);
    expect(useSessionStore.getState().hasPresentedId("Q-101")).toBe(true);

    store.resetScores();
    expect(Object.keys(useSessionStore.getState().practiceScores).length).toBe(0);
    expect(useSessionStore.getState().hasPresentedId("Q-101")).toBe(true);
    store.clearPresentedIds();
    expect(useSessionStore.getState().hasPresentedId("Q-101")).toBe(false);

    expect(localStorageSetSpy).toHaveBeenCalledTimes(0);
    expect(sessionStorageSetSpy).toHaveBeenCalledTimes(0);
    expect(indexedDBOpenSpy).toHaveBeenCalledTimes(0);
  });

  it("EDGE_CASE 2: 组卷与在线考场完整生命周期（组卷、作答、自核、结算、即焚）零持久化", () => {
    const store = useSessionStore.getState();

    // 1. 组卷
    const paper = drawQuestions(
      testExamQuestions,
      {
        selectedKpIds: [],
        choiceCount: 2,
        fillCount: 1,
        solutionCount: 1,
        difficultyDistribution: [20, 20, 20, 20, 20],
      },
      { seed: 12345 }
    );
    expect(paper.totalQuestions).toBeGreaterThan(0);

    // 2. 解答题自核打钩
    const steps = [
      { stepIndex: 1, descriptionZh: "建立直角坐标系", points: 2 },
      { stepIndex: 2, descriptionZh: "求解抛物线顶点", points: 3 },
      { stepIndex: 3, descriptionZh: "代入点验证", points: 2 },
    ];
    const score = calculateSolutionScore(steps, new Set([1, 2]));
    expect(score).toBe(5);

    // 3. 记录会话考试得分
    store.setExamScore({
      totalScore: 85,
      maxScore: 100,
      details: { "Q-CHOICE-1": 3, "Q-FILL-1": 5, "Q-SOL-1": 5 },
    });
    expect(useSessionStore.getState().examScore?.totalScore).toBe(85);

    // 4. 清空考场 (即焚)
    store.resetAll();
    expect(useSessionStore.getState().examScore).toBeNull();
    expect(Object.keys(useSessionStore.getState().practiceScores).length).toBe(0);

    // 断言：整个高保真操作流零持久化写入
    expect(localStorageSetSpy).toHaveBeenCalledTimes(0);
    expect(sessionStorageSetSpy).toHaveBeenCalledTimes(0);
    expect(indexedDBOpenSpy).toHaveBeenCalledTimes(0);
  });

  it("EDGE_CASE 3: 沙盒滑块与不变量高频演算（100 次）保持纯数学求值与零持久化", () => {
    const store = useSessionStore.getState();

    for (let i = 0; i < 100; i++) {
      store.setSandboxSlider("SB-001", "k", 1 + i * 0.05);

      const area = calculateTriangleArea(
        { x: -2, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: i * 0.1 }
      );

      expect(area).toBeGreaterThanOrEqual(0);
    }

    expect(store.getSandboxSliders("SB-001")["k"]).toBeCloseTo(1 + 99 * 0.05);
    store.resetSandboxSliders("SB-001");
    expect(store.getSandboxSliders("SB-001")["k"]).toBeUndefined();

    expect(localStorageSetSpy).toHaveBeenCalledTimes(0);
    expect(sessionStorageSetSpy).toHaveBeenCalledTimes(0);
    expect(indexedDBOpenSpy).toHaveBeenCalledTimes(0);
  });
});
