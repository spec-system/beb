'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../auth/AuthContext';
import { RecordsProvider } from '../store/recordsStore';
import { SettingsProvider } from '../store/settingsStore';
import { ToastProvider } from '../components/ui/Toast';

/** The portal's providers intentionally retain the legacy nesting order. */
export default function PortalProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RecordsProvider>
        <SettingsProvider>
          <ToastProvider>{children}</ToastProvider>
        </SettingsProvider>
      </RecordsProvider>
    </AuthProvider>
  );
}

export { PortalProviders };
