import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { RecordsProvider } from './store/recordsStore';
import { AuthProvider } from './auth/AuthContext';
import { SettingsProvider } from './store/settingsStore';
import { ToastProvider } from './components/ui/Toast';
import { BoardProvider } from './store/boardStore';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RecordsProvider>
          <SettingsProvider>
            <ToastProvider>
              <BoardProvider>
                <App />
              </BoardProvider>
            </ToastProvider>
          </SettingsProvider>
        </RecordsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
