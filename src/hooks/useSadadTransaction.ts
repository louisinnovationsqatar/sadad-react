// Built by Louis Innovations (www.louis-innovations.com)

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSadadContext } from '../context/SadadContext.js';
import type {
  TransactionDetail,
  TransactionResponse,
  UseSadadTransactionOptions,
  UseSadadTransactionReturn,
} from '../types/index.js';

const DEFAULT_POLL_INTERVAL_MS = 5000;

/**
 * useSadadTransaction
 *
 * Fetches and optionally polls the transaction status from your merchant
 * backend at GET /api/sadad/transaction/:id.
 *
 * Polling can be started, stopped, and controlled via the returned helpers.
 * When `enabled` is false (default), only a manual refetch is available.
 * When `pollInterval` is set and `enabled` is true, polling starts immediately.
 *
 * @example
 * ```tsx
 * const { transaction, loading, error, startPolling, stopPolling } =
 *   useSadadTransaction({
 *     transactionId: 'TXN-001',
 *     pollInterval: 5000,
 *     enabled: true,
 *     onStatusChange: (txn) => {
 *       if (txn.status === 3) stopPolling();
 *     },
 *   });
 * ```
 */
export function useSadadTransaction(
  options: UseSadadTransactionOptions,
): UseSadadTransactionReturn {
  const { backendBaseUrl } = useSadadContext();
  const {
    transactionId,
    pollInterval = DEFAULT_POLL_INTERVAL_MS,
    enabled = false,
    onStatusChange,
  } = options;

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef(false);
  const onStatusChangeRef = useRef(onStatusChange);

  // Keep the callback ref up-to-date without causing re-renders
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const fetchTransaction = useCallback(async (): Promise<void> => {
    if (!transactionId || transactionId.trim() === '') return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${backendBaseUrl}/api/sadad/transaction/${encodeURIComponent(transactionId)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `Transaction fetch failed (HTTP ${response.status}): ${text}`,
        );
      }

      const data = (await response.json()) as TransactionResponse;

      if (!data.success) {
        throw new Error(data.error ?? 'Backend returned success: false for transaction fetch.');
      }

      if (data.transaction) {
        setTransaction((prev) => {
          const next = data.transaction as TransactionDetail;
          if (prev?.status !== next.status) {
            onStatusChangeRef.current?.(next);
          }
          return next;
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [backendBaseUrl, transactionId]);

  const stopPolling = useCallback((): void => {
    pollingRef.current = false;
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (interval: number = pollInterval): void => {
      stopPolling();
      pollingRef.current = true;
      void fetchTransaction();
      intervalRef.current = setInterval(() => {
        if (pollingRef.current) {
          void fetchTransaction();
        }
      }, interval);
    },
    [fetchTransaction, pollInterval, stopPolling],
  );

  // Auto-start polling when enabled changes to true
  useEffect(() => {
    if (enabled && transactionId) {
      startPolling(pollInterval);
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, transactionId]);

  return {
    transaction,
    loading,
    error,
    refetch: fetchTransaction,
    stopPolling,
    startPolling,
  };
}
