import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Headless Rendering API
(window as any).renderFrame = (timeMs: number) => {
  (window as any).__renderTimeMs = timeMs;
};

(window as any).initializeScene = async () => {
  // Logic to wait for scene initialization can be added here if necessary
  return true;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
