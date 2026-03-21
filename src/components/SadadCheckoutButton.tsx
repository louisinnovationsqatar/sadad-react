// Built by Louis Innovations (www.louis-innovations.com)

import React, { type ButtonHTMLAttributes } from 'react';
import { useSadadCheckout } from '../hooks/useSadadCheckout.js';
import type { OrderData } from '@louis-innovations/sadad-js-sdk';
import type { CheckoutResponse } from '../types/index.js';

export interface SadadCheckoutButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /**
   * Order data to submit to the checkout endpoint.
   */
  orderData: OrderData;
  /**
   * Label shown while the checkout is being initiated.
   * Defaults to "Processing...".
   */
  loadingLabel?: string;
  /**
   * Callback fired when the backend returns a successful checkout response.
   */
  onSuccess?: (response: CheckoutResponse) => void;
  /**
   * Callback fired when an error occurs during checkout initiation.
   */
  onCheckoutError?: (error: Error) => void;
}

/**
 * SadadCheckoutButton
 *
 * A "Pay with SADAD" button that, when clicked, calls your merchant backend
 * at POST /api/sadad/checkout and then submits a hidden form to redirect the
 * customer to the SADAD payment gateway.
 *
 * Must be rendered inside a <SadadProvider>.
 *
 * @example
 * ```tsx
 * <SadadCheckoutButton
 *   orderData={{ order_id: 'ORDER-001', amount: 150.00, email: 'user@example.com' }}
 *   onCheckoutError={(err) => alert(err.message)}
 * />
 * ```
 */
export function SadadCheckoutButton({
  orderData,
  loadingLabel = 'Processing...',
  onSuccess,
  onCheckoutError,
  disabled,
  children,
  ...buttonProps
}: SadadCheckoutButtonProps): React.ReactElement {
  const { loading, error, initiateCheckout } = useSadadCheckout({
    onSuccess,
    onCheckoutError,
  });

  const handleClick = (): void => {
    void initiateCheckout(orderData);
  };

  return (
    <button
      {...buttonProps}
      type="button"
      disabled={disabled ?? loading}
      onClick={handleClick}
      aria-busy={loading}
      aria-label={buttonProps['aria-label'] ?? 'Pay with SADAD'}
      data-sadad-checkout-button="true"
    >
      {loading ? loadingLabel : (children ?? 'Pay with SADAD')}
      {error && (
        <span
          role="alert"
          style={{ display: 'block', color: 'red', fontSize: '0.875em', marginTop: '4px' }}
        >
          {error.message}
        </span>
      )}
    </button>
  );
}
