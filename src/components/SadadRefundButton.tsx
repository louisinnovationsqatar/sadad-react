// Built by Louis Innovations (www.louis-innovations.com)

import React, { useState, type ButtonHTMLAttributes } from 'react';
import { useSadadContext } from '../context/SadadContext.js';
import type { RefundResponse } from '../types/index.js';

export interface SadadRefundButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /**
   * The SADAD transaction number to refund.
   */
  transactionId: string;
  /**
   * Label shown on the button when idle. Defaults to "Refund Payment".
   */
  label?: string;
  /**
   * Label shown while the refund is being processed. Defaults to "Processing Refund...".
   */
  loadingLabel?: string;
  /**
   * Text shown in the confirmation dialog. Defaults to a generic confirmation message.
   */
  confirmationMessage?: string;
  /**
   * Whether to skip the confirmation dialog. Defaults to false.
   */
  skipConfirmation?: boolean;
  /**
   * Callback fired when the refund completes successfully.
   */
  onSuccess?: (response: RefundResponse) => void;
  /**
   * Callback fired when the refund fails.
   */
  onRefundError?: (error: Error) => void;
}

/**
 * SadadRefundButton
 *
 * Admin-only component that initiates a SADAD refund by calling your merchant
 * backend at POST /api/sadad/refund.
 *
 * Displays a confirmation dialog before submitting to prevent accidental refunds.
 * This component NEVER handles secrets — all secret handling happens on your backend.
 *
 * Must be rendered inside a <SadadProvider>.
 *
 * @example
 * ```tsx
 * <SadadRefundButton
 *   transactionId="TXN-001"
 *   onSuccess={(res) => toast.success('Refund initiated')}
 *   onRefundError={(err) => toast.error(err.message)}
 * />
 * ```
 */
export function SadadRefundButton({
  transactionId,
  label = 'Refund Payment',
  loadingLabel = 'Processing Refund...',
  confirmationMessage,
  skipConfirmation = false,
  onSuccess,
  onRefundError,
  disabled,
  children,
  ...buttonProps
}: SadadRefundButtonProps): React.ReactElement {
  const { backendBaseUrl } = useSadadContext();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const message =
    confirmationMessage ??
    `Are you sure you want to refund transaction ${transactionId}? This action cannot be undone.`;

  const handleClick = (): void => {
    if (skipConfirmation) {
      void executeRefund();
    } else {
      setShowModal(true);
    }
  };

  const handleConfirm = (): void => {
    setShowModal(false);
    void executeRefund();
  };

  const handleCancel = (): void => {
    setShowModal(false);
  };

  const executeRefund = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${backendBaseUrl}/api/sadad/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: transactionId }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        throw new Error(`Refund request failed (HTTP ${response.status}): ${text}`);
      }

      const data = (await response.json()) as RefundResponse;

      if (!data.success) {
        throw new Error(data.error ?? 'Refund failed. The backend returned success: false.');
      }

      setSuccess(true);
      onSuccess?.(data);
    } catch (err) {
      const refundError = err instanceof Error ? err : new Error(String(err));
      setError(refundError);
      onRefundError?.(refundError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        {...buttonProps}
        type="button"
        disabled={disabled ?? loading ?? success}
        onClick={handleClick}
        aria-busy={loading}
        aria-label={buttonProps['aria-label'] ?? `Refund transaction ${transactionId}`}
        data-sadad-refund-button="true"
      >
        {loading ? loadingLabel : (children ?? (success ? 'Refund Initiated' : label))}
      </button>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            fontSize: '0.875em',
          }}
        >
          <strong>Refund Error:</strong> {error.message}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            fontSize: '0.875em',
          }}
        >
          Refund has been successfully initiated for transaction {transactionId}.
        </div>
      )}

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sadad-refund-modal-title"
          aria-describedby="sadad-refund-modal-desc"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancel();
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
          >
            <h2
              id="sadad-refund-modal-title"
              style={{ margin: '0 0 12px', fontSize: '1.1em' }}
            >
              Confirm Refund
            </h2>
            <p id="sadad-refund-modal-desc" style={{ margin: '0 0 20px', color: '#444' }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '8px 20px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#c0392b',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
