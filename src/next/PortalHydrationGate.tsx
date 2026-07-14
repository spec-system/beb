'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRecords } from '../store/recordsStore';
import { useSettings } from '../store/settingsStore';

/** Avoid rendering route UI against pre-localStorage provider state. */
export default function PortalHydrationGate({ children }: { children: ReactNode }) {
  const { hydrated: authHydrated } = useAuth();
  const { hydrated: recordsHydrated } = useRecords();
  const { hydrated: settingsHydrated } = useSettings();

  if (!authHydrated || !recordsHydrated || !settingsHydrated)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  return <>{children}</>;
}

export { PortalHydrationGate };
