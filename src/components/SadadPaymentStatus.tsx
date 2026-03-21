// Built by Louis Innovations (www.louis-innovations.com)

import React from 'react';
import { useSadadTransaction } from '../hooks/useSadadTransaction.js';
import type {
  TransactionDetail,
  TransactionStatusVariant,
  UseSadadTransactionOptions,
} from '../types/index.js';

export interface SadadPaymentStatusProps
  extends Pick<UseSadadTransactionOptions, 'pollInterval' | 'enabled' | 'onStatusChange'> {
  /**
   * The SADAD transaction number or order ID to look up.
   * Fetched from GET /api/sadad/transaction/:transactionId.
   */
  transactionId: string;
  /**
   * Custom render function for the transaction details.
   * If provided, the default status UI is bypassed.
   */
  renderStatus?: (
    transaction: TransactionDetail,
    variant: TransactionStatusVariant,
  ) => React.ReactNode;
  /**
   * Content shown while the transaction is loading.
   */
  loadingContent?: React.ReactNode;
  /**
   * Content shown when an error occurs.
   */
  errorContent?: React.ReactNode | ((error: Error) => React.ReactNode);
  /**
   * Content shown when no transaction data is available yet (before first fetch).
   */
  emptyContent?: React.ReactNode;
  /**
   * Whether to show the raw transaction details in a debug table.
   * Defaults to false.
   */
  showRawDetails?: boolean;
}

/**
 * Resolves a SADAD status code to a semantic variant.
 *
 * Known SADAD status codes:
 *   0 - Initiated
 *   1 - In Progress
 *   2 - Failed
 *   3 - Success
 *   4 - Refunded
 */
function resolveStatusVariant(transaction: TransactionDetail): TransactionStatusVariant {
  const status = Number(transaction.status ?? -1);
  if (status === 3) return 'success';
  if (status === 4) return 'refunded';
  if (status === 2) return 'failed';
  if (status === 0 || status === 1) return 'pending';
  return 'unknown';
}

const VARIANT_STYLES: Record<TransactionStatusVariant, React.CSSProperties> = {
  success: { background: '#d4edda', color: '#155724', borderColor: '#c3e6cb' },
  pending: { background: '#fff3cd', color: '#856404', borderColor: '#ffc107' },
  failed: { background: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' },
  refunded: { background: '#d1ecf1', color: '#0c5460', borderColor: '#bee5eb' },
  unknown: { background: '#e2e3e5', color: '#383d41', borderColor: '#d6d8db' },
};

const VARIANT_LABELS: Record<TransactionStatusVariant, string> = {
  success: 'Payment Successful',
  pending: 'Payment Pending',
  failed: 'Payment Failed',
  refunded: 'Payment Refunded',
  unknown: 'Status Unknown',
};

/**
 * SadadPaymentStatus
 *
 * Displays the current status of a SADAD transaction by fetching from your
 * merchant backend at GET /api/sadad/transaction/:transactionId.
 *
 * Supports optional polling via the `enabled` and `pollInterval` props.
 *
 * Must be rendered inside a <SadadProvider>.
 *
 * @example
 * ```tsx
 * <SadadPaymentStatus
 *   transactionId="TXN-001"
 *   enabled={true}
 *   pollInterval={5000}
 * />
 * ```
 */
export function SadadPaymentStatus({
  transactionId,
  pollInterval,
  enabled,
  onStatusChange,
  renderStatus,
  loadingContent,
  errorContent,
  emptyContent,
  showRawDetails = false,
}: SadadPaymentStatusProps): React.ReactElement {
  const { transaction, loading, error } = useSadadTransaction({
    transactionId,
    pollInterval,
    enabled,
    onStatusChange,
  });

  if (loading && !transaction) {
    return (
      <div data-sadad-status="loading">
        {loadingContent ?? <span>Fetching payment status...</span>}
      </div>
    );
  }

  if (error && !transaction) {
    if (errorContent) {
      return (
        <div role="alert" data-sadad-status="error">
          {typeof errorContent === 'function' ? errorContent(error) : errorContent}
        </div>
      );
    }
    return (
      <div
        role="alert"
        data-sadad-status="error"
        style={{ padding: '12px', color: '#c0392b', border: '1px solid #e74c3c', borderRadius: '4px' }}
      >
        <strong>Error:</strong> {error.message}
      </div>
    );
  }

  if (!transaction) {
    return (
      <div data-sadad-status="empty">
        {emptyContent ?? <span>No transaction data available.</span>}
      </div>
    );
  }

  const variant = resolveStatusVariant(transaction);

  if (renderStatus) {
    return <>{renderStatus(transaction, variant)}</>;
  }

  const styles = VARIANT_STYLES[variant];

  return (
    <div
      data-sadad-status={variant}
      style={{
        padding: '16px',
        border: `1px solid ${styles.borderColor}`,
        borderRadius: '6px',
        background: styles.background,
        color: styles.color,
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '1.05em', marginBottom: '8px' }}>
        {VARIANT_LABELS[variant]}
      </div>
      {transaction.ORDER_ID && (
        <div>
          <strong>Order ID:</strong> {transaction.ORDER_ID}
        </div>
      )}
      {transaction.transactionno && (
        <div>
          <strong>Transaction No:</strong> {transaction.transactionno}
        </div>
      )}
      {transaction.TXN_AMOUNT && (
        <div>
          <strong>Amount:</strong> {transaction.TXN_AMOUNT} QAR
        </div>
      )}
      {transaction.txnDate && (
        <div>
          <strong>Date:</strong> {transaction.txnDate}
        </div>
      )}
      {transaction.statusMessage && (
        <div>
          <strong>Message:</strong> {String(transaction.statusMessage)}
        </div>
      )}

      {showRawDetails && (
        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer' }}>Raw Details</summary>
          <table
            style={{
              width: '100%',
              marginTop: '8px',
              borderCollapse: 'collapse',
              fontSize: '0.85em',
            }}
          >
            <tbody>
              {Object.entries(transaction).map(([key, val]) => (
                <tr key={key}>
                  <td
                    style={{
                      padding: '4px 8px',
                      borderBottom: '1px solid rgba(0,0,0,0.1)',
                      fontWeight: 'bold',
                    }}
                  >
                    {key}
                  </td>
                  <td
                    style={{ padding: '4px 8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    {String(val ?? '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {loading && (
        <div style={{ marginTop: '8px', fontSize: '0.85em', opacity: 0.7 }}>
          Refreshing...
        </div>
      )}
    </div>
  );
}
