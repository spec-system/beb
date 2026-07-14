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

  if (!authHydrated || !recordsHydrated || !settingsHydrated) return null;
  return <>{children}</>;
}

export { PortalHydrationGate };
