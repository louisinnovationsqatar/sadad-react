// Built by Louis Innovations (www.louis-innovations.com)

import React, { useEffect, useRef, useState, type IframeHTMLAttributes } from 'react';
import { useSadadContext } from '../context/SadadContext.js';
import type { OrderData } from '@louis-innovations/sadad-js-sdk';
import type { CheckoutResponse } from '../types/index.js';

export interface SadadEmbeddedCheckoutProps
  extends Omit<IframeHTMLAttributes<HTMLIFrameElement>, 'src' | 'ref'> {
  /**
   * Order data to submit to the checkout endpoint.
   */
  orderData: OrderData;
  /**
   * Width of the iframe. Defaults to "100%".
   */
  width?: string | number;
  /**
   * Height of the iframe. Defaults to 600.
   */
  height?: string | number;
  /**
   * Content displayed while the checkout URL is being fetched.
   */
  loadingContent?: React.ReactNode;
  /**
   * Content displayed when an error occurs.
   */
  errorContent?: React.ReactNode | ((error: Error) => React.ReactNode);
  /**
   * Callback fired when the checkout URL is ready and the iframe is mounted.
   */
  onReady?: (response: CheckoutResponse) => void;
  /**
   * Callback fired when a checkout fetch or load error occurs.
   */
  onCheckoutError?: (error: Error) => void;
}

/**
 * SadadEmbeddedCheckout
 *
 * Renders the SADAD payment gateway inside an iframe by calling your merchant
 * backend at POST /api/sadad/checkout and using the returned URL.
 *
 * The iframe posts its form internally so the customer never leaves your page.
 * This component uses the v2.2 embedded checkout endpoint on the gateway side.
 *
 * Must be rendered inside a <SadadProvider>.
 *
 * @example
 * ```tsx
 * <SadadEmbeddedCheckout
 *   orderData={{ order_id: 'ORDER-001', amount: 150.00 }}
 *   height={650}
 *   onReady={() => console.log('Checkout ready')}
 * />
 * ```
 */
export function SadadEmbeddedCheckout({
  orderData,
  width = '100%',
  height = 600,
  loadingContent,
  errorContent,
  onReady,
  onCheckoutError,
  ...iframeProps
}: SadadEmbeddedCheckoutProps): React.ReactElement {
  const { backendBaseUrl } = useSadadContext();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCheckout = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      setCheckoutData(null);

      try {
        const response = await fetch(`${backendBaseUrl}/api/sadad/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => 'Unknown error');
          throw new Error(`Checkout request failed (HTTP ${response.status}): ${text}`);
        }

        const data = (await response.json()) as CheckoutResponse;

        if (!data.url || !data.params) {
          throw new Error('Invalid checkout response from backend. Expected { url, params }.');
        }

        if (!cancelled) {
          setCheckoutData(data);
          onReady?.(data);
        }
      } catch (err) {
        if (!cancelled) {
          const checkoutError = err instanceof Error ? err : new Error(String(err));
          setError(checkoutError);
          onCheckoutError?.(checkoutError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchCheckout();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendBaseUrl, orderData.order_id]);

  // Once checkoutData is available and the iframe is ready, submit the form
  // into the iframe's target so the SADAD gateway loads inside it.
  useEffect(() => {
    if (!checkoutData || !iframeRef.current || !formContainerRef.current) return;

    const iframe = iframeRef.current;
    const iframeName = `sadad-embedded-${Date.now()}`;
    iframe.name = iframeName;

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = checkoutData.url;
    form.target = iframeName;
    form.style.display = 'none';

    appendParams(form, checkoutData.params as Record<string, ParamValue>, '');

    formContainerRef.current.appendChild(form);
    form.submit();

    return () => {
      if (formContainerRef.current) {
        formContainerRef.current.innerHTML = '';
      }
    };
  }, [checkoutData]);

  if (error) {
    if (errorContent) {
      return (
        <div data-sadad-embedded-error="true">
          {typeof errorContent === 'function' ? errorContent(error) : errorContent}
        </div>
      );
    }
    return (
      <div
        role="alert"
        data-sadad-embedded-error="true"
        style={{ padding: '16px', color: '#c0392b', border: '1px solid #e74c3c', borderRadius: '4px' }}
      >
        <strong>Payment Error:</strong> {error.message}
      </div>
    );
  }

  return (
    <div
      data-sadad-embedded-checkout="true"
      style={{ position: 'relative', width, height }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9fa',
          }}
        >
          {loadingContent ?? <span>Loading payment form...</span>}
        </div>
      )}
      <iframe
        {...iframeProps}
        ref={iframeRef}
        title={iframeProps.title ?? 'SADAD Payment'}
        width={width}
        height={height}
        style={{
          border: 'none',
          display: loading ? 'none' : 'block',
          ...iframeProps.style,
        }}
        onLoad={() => setLoading(false)}
      />
      <div ref={formContainerRef} style={{ display: 'none' }} />
    </div>
  );
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
      appendParams(form, value as Record<string, ParamValue>, fieldName);
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
