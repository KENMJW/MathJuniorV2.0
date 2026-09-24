import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/tokens.css';
import './styles/responsive.css';
import './styles/jsxgraph.css';
import { APP_VERSION } from './config/version';

// 版本变更熔断守护：若检测到本地记录的版本与新打包版本不一致，自动清空 CacheStorage 与旧 Service Worker
if (typeof window !== 'undefined') {
  try {
    const cachedVersion = localStorage.getItem('app_version');
    if (cachedVersion && cachedVersion !== APP_VERSION) {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((r) => r.update());
        });
      }
    }
    localStorage.setItem('app_version', APP_VERSION);
  } catch {
    // 忽略私有模式下的 storage 异常
  }
}

// 自动检测新版本：一旦检测到新 Service Worker 立即触发更新核验，杜绝旧缓存
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.update();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update();
        }
      });
    })
    .catch(() => {});
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
