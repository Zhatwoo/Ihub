'use client';

import { LoadingProvider } from './LoadingScreen';
import { TranslationProvider } from '@/lib/TranslationContext';

export function ClientProviders({ children }) {
  return (
    <TranslationProvider>
      <LoadingProvider>
        {children}
      </LoadingProvider>
    </TranslationProvider>
  );
}
