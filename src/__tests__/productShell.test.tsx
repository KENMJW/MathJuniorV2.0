import { describe, it, expect, beforeEach, afterEach } from "vitest";
import ReactDOMServer from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AllSubjectsPortal } from "../AllSubjectsPortal";
import { MathJuniorHome } from "../MathJuniorHome";
import { ConceptNav } from "../ConceptNav";
import { setDeviceOverride, clearDeviceOverride } from "../engine/device/deviceOverride";

describe("Task 20: 产品化外壳与信息架构集成测试", () => {
  beforeEach(() => {
    clearDeviceOverride();
  });

  afterEach(() => {
    clearDeviceOverride();
  });

  describe("20.1 全科门户 (AllSubjectsPortal)", () => {
    it("正确渲染顶栏品牌、学员状态、学段切换器与初中数学旗舰卡", () => {
      const html = ReactDOMServer.renderToString(
        <MemoryRouter initialEntries={["/"]}>
          <AllSubjectsPortal />
        </MemoryRouter>
      );

      // 1. 顶栏
      expect(html).toContain("all-subjects-portal");
      expect(html).toContain("全科核心素养提分系统");
      expect(html).toContain("精准提分 · 深度探究 · 考霸思维");
      expect(html).toContain("学员模式");

      // 2. 学段切换器
      expect(html).toContain("stage-segmented-control");
      expect(html).toContain("小学教育");
      expect(html).toContain("初中突破");
      expect(html).toContain("高中决胜");
      expect(html).toContain("首发");

      // 3. 初中数学旗舰卡与 4 大指标
      expect(html).toContain("junior-math-flagship-card");
      expect(html).toContain("初中数学核心素养工坊");
      expect(html).toContain("107");
      expect(html).toContain("12");
      expect(html).toContain("36");
      expect(html).toContain("119");
      expect(html).toContain("进入初中数学工坊");

      // 4. 其余 7 学科即将推出
      expect(html).toContain("初中物理");
      expect(html).toContain("初中化学");
      expect(html).toContain("初中生物");
      expect(html).toContain("初中语文");
      expect(html).toContain("初中英语");
      expect(html).toContain("初中历史");
      expect(html).toContain("初中地理");
      expect(html).toContain("即将推出");

      // 5. 绝对无旧任务号残留
      expect(html).not.toMatch(/\((?:9\.1|10\.1|10\.4|11\.1|11\.4|9\.4|17\.1)\)/);
    });
  });

  describe("20.2 初中数学主界面与四大模块正式入口 (MathJuniorHome)", () => {
    it("正确渲染四大正式模块入口，绝无任何调试任务号标签", () => {
      const html = ReactDOMServer.renderToString(
        <MemoryRouter initialEntries={["/math-junior/concept"]}>
          <Routes>
            <Route path="/math-junior/:module" element={<MathJuniorHome />} />
          </Routes>
        </MemoryRouter>
      );

      // 四大模块正式产品名称
      expect(html).toContain("探本溯源·概念精讲");
      expect(html).toContain("经纬纵横·思维图谱");
      expect(html).toContain("见微知著·实验探究");
      expect(html).toContain("百炼成钢·实战测评");

      // 返回全科门户入口
      expect(html).toContain("全科门户");

      // 绝对无旧任务号残留
      expect(html).not.toMatch(/\((?:9\.1|10\.1|10\.4|11\.1|11\.4|9\.4|17\.1)\)/);
    });
  });

  describe("20.3 模块一四级导航谱系 (ConceptNav)", () => {
    it("按年级->学期->领域->考点完成四级导航下钻，并挂载考点四位一体", () => {
      const html = ReactDOMServer.renderToString(
        <ConceptNav initialPointId="KP-023" />
      );

      // 1. 结构与层级
      expect(html).toContain("concept-nav-root");
      expect(html).toContain("concept-tree-sidebar");
      expect(html).toContain("第一级 · 年级");
      expect(html).toContain("第二级 · 学期");
      expect(html).toContain("第三级 · 领域");
      expect(html).toContain("第四级 · 大纲考点");

      // 2. 年级/学期/领域/考点
      expect(html).toContain("八年级");
      expect(html).toContain("上学期 (1)");
      expect(html).toContain("图形与几何");
      expect(html).toContain("KP-023");
      expect(html).toContain("勾股定理及其逆定理");

      // 3. 四位一体子视窗 Tab
      expect(html).toContain("四段论精讲");
      expect(html).toContain("链接沙盒");
      expect(html).toContain("考点母题");
      expect(html).toContain("单点快练");

      // 4. 当前考点默认渲染四段论
      expect(html).toContain("concept-main-stage");
      expect(html).toContain("原点溯源");
      expect(html).toContain("本真透视");
      expect(html).toContain("法典严定");
      expect(html).toContain("本体辨正");
    });
  });

  describe("20.4 三端骨架接入设备调度 (CardDeck / SplitBoard / Cockpit)", () => {
    it("当 override 为 MOBILE 时，MathJuniorHome 包裹 CardDeck 手机骨架", () => {
      setDeviceOverride("MOBILE");
      const html = ReactDOMServer.renderToString(
        <MemoryRouter initialEntries={["/math-junior/concept"]}>
          <Routes>
            <Route path="/math-junior/:module" element={<MathJuniorHome />} />
          </Routes>
        </MemoryRouter>
      );

      expect(html).toContain("shell-card-deck");
      expect(html).toContain("card-deck-header");
      expect(html).toContain("card-deck-bottom-sheet");
    });

    it("当 override 为 TABLET 时，MathJuniorHome 包裹 SplitBoard 平板骨架", () => {
      setDeviceOverride("TABLET");
      const html = ReactDOMServer.renderToString(
        <MemoryRouter initialEntries={["/math-junior/concept"]}>
          <Routes>
            <Route path="/math-junior/:module" element={<MathJuniorHome />} />
          </Routes>
        </MemoryRouter>
      );

      expect(html).toContain("shell-split-board");
      expect(html).toContain("split-board-sidebar");
      expect(html).toContain("split-board-main");
    });

    it("当 override 为 DESKTOP 时，MathJuniorHome 包裹 Cockpit 桌面大剧场骨架", () => {
      setDeviceOverride("DESKTOP");
      const html = ReactDOMServer.renderToString(
        <MemoryRouter initialEntries={["/math-junior/concept"]}>
          <Routes>
            <Route path="/math-junior/:module" element={<MathJuniorHome />} />
          </Routes>
        </MemoryRouter>
      );

      expect(html).toContain("shell-cockpit");
      expect(html).toContain("cockpit-header");
      expect(html).toContain("cockpit-sidebar");
      expect(html).toContain("cockpit-theater");
    });
  });
});
