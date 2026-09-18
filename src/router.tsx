import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AllSubjectsPortal } from "./AllSubjectsPortal";
import { MathJuniorHome } from "./MathJuniorHome";

/**
 * 全局产品路由表 (任务 20.1, 设计文档 §12.3, §7.1)
 * 采用 HashRouter 确保 Cloudflare Pages 等静态托管环境任意路径刷新无 404
 */
export const AppRouter: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* 全科门户主页 */}
        <Route path="/" element={<AllSubjectsPortal />} />

        {/* 初中数学主界面与子模块 */}
        <Route path="/math-junior" element={<Navigate to="/math-junior/concept" replace />} />
        <Route path="/math-junior/:module" element={<MathJuniorHome />} />

        {/* 任意未知路径重定向到门户 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default AppRouter;
