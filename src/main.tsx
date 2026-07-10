import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { RecordsProvider } from './store/recordsStore';
import { AuthProvider } from './auth/AuthContext';
import { SettingsProvider } from './store/settingsStore';
import { ToastProvider } from './components/ui/Toast';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RecordsProvider>
          <SettingsProvider>
            <ToastProvider>
                <App />
            </ToastProvider>
          </SettingsProvider>
        </RecordsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
