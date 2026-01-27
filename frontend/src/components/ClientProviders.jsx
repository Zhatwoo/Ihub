'use client';

import { LoadingProvider } from './LoadingScreen';

export function ClientProviders({ children }) {
  return (
    <LoadingProvider>
      {children}
    </LoadingProvider>
  );
}
