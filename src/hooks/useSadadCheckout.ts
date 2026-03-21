// Built by Louis Innovations (www.louis-innovations.com)

import { useState, useCallback } from 'react';
import { useSadadContext } from '../context/SadadContext.js';
import type {
  CheckoutResponse,
  UseSadadCheckoutOptions,
  UseSadadCheckoutReturn,
} from '../types/index.js';
import type { OrderData } from '@louis-innovations/sadad-js-sdk';

/**
 * useSadadCheckout
 *
 * Manages the SADAD checkout flow. Calls your merchant backend at
 * POST /api/sadad/checkout and receives a { url, params } response, then
 * programmatically submits a form to redirect the customer to the SADAD
 * payment gateway.
 *
 * @example
 * ```tsx
 * const { loading, error, initiateCheckout } = useSadadCheckout({
 *   onCheckoutError: (err) => console.error(err),
 * });
 *
 * const handlePay = () => {
 *   initiateCheckout({
 *     order_id: 'ORDER-001',
 *     amount: 150.00,
 *     mobile: '33123456',
 *     email: 'customer@example.com',
 *   });
 * };
 * ```
 */
export function useSadadCheckout(
  options: UseSadadCheckoutOptions = {},
): UseSadadCheckoutReturn {
  const { backendBaseUrl } = useSadadContext();
  const { onSuccess, onCheckoutError } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const initiateCheckout = useCallback(
    async (orderData: OrderData): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${backendBaseUrl}/api/sadad/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => 'Unknown error');
          throw new Error(
            `Checkout request failed (HTTP ${response.status}): ${text}`,
          );
        }

        const data = (await response.json()) as CheckoutResponse;

        if (!data.url || !data.params) {
          throw new Error(
            'Invalid checkout response from backend. Expected { url, params }.',
          );
        }

        onSuccess?.(data);
        submitCheckoutForm(data);
      } catch (err) {
        const checkoutError = err instanceof Error ? err : new Error(String(err));
        setError(checkoutError);
        onCheckoutError?.(checkoutError);
      } finally {
        setLoading(false);
      }
    },
    [backendBaseUrl, onSuccess, onCheckoutError],
  );

  return { loading, error, initiateCheckout, reset };
}

/**
 * Builds a hidden HTML form with the checkout params and submits it.
 * This causes a full-page redirect to the SADAD payment gateway.
 */
function submitCheckoutForm(data: CheckoutResponse): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = data.url;
  form.style.display = 'none';

  appendParams(form, data.params as Record<string, ParamValue>, '');

  document.body.appendChild(form);
  form.submit();
}

type ParamValue = string | number | boolean | null | Array<Record<string, string>>;

function appendParams(
  form: HTMLFormElement,
  params: Record<string, ParamValue>,
  prefix: string,
): void {
  for (const [key, value] of Object.entries(params)) {
    const fieldName = prefix === '' ? key : `${prefix}[${key}]`;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== null && typeof item === 'object') {
          appendParams(
            form,
            item as Record<string, ParamValue>,
            `${fieldName}[${index}]`,
          );
        } else {
          appendHiddenInput(form, `${fieldName}[${index}]`, String(item ?? ''));
        }
      });
    } else if (value !== null && typeof value === 'object') {
      appendParams(
        form,
        value as Record<string, ParamValue>,
        fieldName,
      );
    } else {
      appendHiddenInput(form, fieldName, String(value ?? ''));
    }
  }
}

function appendHiddenInput(form: HTMLFormElement, name: string, value: string): void {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  form.appendChild(input);
}
