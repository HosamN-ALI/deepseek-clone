import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/main.css';
import App from './App';

// إنشاء root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// تصيير التطبيق
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// تسجيل service worker للأداء (اختياري)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
