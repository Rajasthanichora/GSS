import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 👇 ye line add karni hai (PWA ke liye)
import { registerSW } from 'virtual:pwa-register';

// service worker register ho jayega
registerSW();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
