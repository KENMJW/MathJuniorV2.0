import React from "react";
import { AppRouter } from "./router";

/**
 * 根应用外壳 (任务 20.1)
 * 转换为标准产品路由容器，挂载 AppRouter
 */
export const App: React.FC = () => {
  return <AppRouter />;
};

export default App;
