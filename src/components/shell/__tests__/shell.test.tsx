import { describe, it, expect } from "vitest";
import ReactDOMServer from "react-dom/server";
import { CardDeck } from "../CardDeck";
import { SplitBoard } from "../SplitBoard";
import { Cockpit } from "../Cockpit";

describe("Shell Components (16.2)", () => {
  describe("CardDeck (Mobile)", () => {
    it("renders 100dvh container with header, content and bottomSheet", () => {
      const html = ReactDOMServer.renderToString(
        <CardDeck
          header={<div>Mobile Header</div>}
          bottomSheet={<div>Bottom Sheet Drawer</div>}
        >
          <div>Card 1</div>
          <div>Card 2</div>
        </CardDeck>
      );

      expect(html).toContain("shell-card-deck");
      expect(html).toContain("100dvh");
      expect(html).toContain("card-deck-header");
      expect(html).toContain("Mobile Header");
      expect(html).toContain("Card 1");
      expect(html).toContain("card-deck-bottom-sheet");
      expect(html).toContain("Bottom Sheet Drawer");
      expect(html).toContain("52px"); // touch target >= 52px
    });
  });

  describe("SplitBoard (Tablet)", () => {
    it("renders 280px sidebar and adaptive main content", () => {
      const html = ReactDOMServer.renderToString(
        <SplitBoard
          sidebar={<div>Left Nav 280px</div>}
          header={<div>Tablet Nav</div>}
        >
          <div>Canvas Area</div>
        </SplitBoard>
      );

      expect(html).toContain("shell-split-board");
      expect(html).toContain("split-board-sidebar");
      expect(html).toContain("280px");
      expect(html).toContain("Left Nav 280px");
      expect(html).toContain("split-board-main");
      expect(html).toContain("Canvas Area");
      expect(html).toContain("44px"); // touch target >= 44px
    });
  });

  describe("Cockpit (Desktop)", () => {
    it("renders theater view and collapsible sidebar", () => {
      const html = ReactDOMServer.renderToString(
        <Cockpit
          header={<div>Desktop Cockpit Title</div>}
          toolbar={<div>Action Buttons</div>}
          sidebar={<div>Navigation Tree</div>}
        >
          <div>Big Theater Viewport</div>
        </Cockpit>
      );

      expect(html).toContain("shell-cockpit");
      expect(html).toContain("cockpit-header");
      expect(html).toContain("Desktop Cockpit Title");
      expect(html).toContain("cockpit-toolbar");
      expect(html).toContain("Action Buttons");
      expect(html).toContain("cockpit-sidebar");
      expect(html).toContain("Navigation Tree");
      expect(html).toContain("cockpit-theater");
      expect(html).toContain("Big Theater Viewport");
    });
  });
});
