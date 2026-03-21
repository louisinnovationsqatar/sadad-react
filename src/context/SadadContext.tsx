// Built by Louis Innovations (www.louis-innovations.com)

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

/**
 * Props for the SadadProvider component.
 */
export interface SadadProviderProps {
  /**
   * The base URL of your merchant backend (no trailing slash).
   * Example: "https://your-store.com" or "http://localhost:8000"
   *
   * The provider will call the following endpoints:
   *   POST  {backendBaseUrl}/api/sadad/checkout
   *   POST  {backendBaseUrl}/api/sadad/refund
   *   GET   {backendBaseUrl}/api/sadad/transaction/:id
   */
  backendBaseUrl: string;
  children: ReactNode;
}

/**
 * Context value consumed by SADAD components and hooks.
 */
export interface SadadContextValue {
  backendBaseUrl: string;
}

const SadadContext = createContext<SadadContextValue | null>(null);

/**
 * SadadProvider
 *
 * Wrap your application (or the portion that uses SADAD components) with this
 * provider to configure the merchant backend URL.
 *
 * @example
 * ```tsx
 * <SadadProvider backendBaseUrl="https://your-store.com">
 *   <App />
 * </SadadProvider>
 * ```
 */
export function SadadProvider({ backendBaseUrl, children }: SadadProviderProps): React.ReactElement {
  if (!backendBaseUrl || backendBaseUrl.trim() === '') {
    throw new Error('[SadadProvider] backendBaseUrl is required and cannot be empty.');
  }

  const value = useMemo<SadadContextValue>(
    () => ({ backendBaseUrl: backendBaseUrl.replace(/\/$/, '') }),
    [backendBaseUrl],
  );

  return (
    <SadadContext.Provider value={value}>
      {children}
    </SadadContext.Provider>
  );
}

/**
 * useSadadContext
 *
 * Internal hook that retrieves the SADAD context. Throws if used outside of
 * a SadadProvider.
 */
export function useSadadContext(): SadadContextValue {
  const ctx = useContext(SadadContext);
  if (ctx === null) {
    throw new Error(
      '[useSadadContext] No SadadProvider found in the component tree. ' +
        'Wrap your component with <SadadProvider backendBaseUrl="...">.',
    );
  }
  return ctx;
}
