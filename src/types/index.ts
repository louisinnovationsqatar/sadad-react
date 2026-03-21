// Built by Louis Innovations (www.louis-innovations.com)

import type { OrderData } from '@louis-innovations/sadad-js-sdk';

// Re-export types from sadad-js-sdk that are useful on the frontend
export type { OrderData, OrderItem } from '@louis-innovations/sadad-js-sdk';

/**
 * The shape returned by POST /api/sadad/checkout on the merchant backend.
 */
export interface CheckoutResponse {
  url: string;
  params: Record<string, string | number | boolean | null | CheckoutParamArray>;
}

export type CheckoutParamArray = Array<Record<string, string>>;

/**
 * The shape returned by POST /api/sadad/refund on the merchant backend.
 */
export interface RefundResponse {
  success: boolean;
  error?: string;
  refundDetails?: Record<string, unknown>;
}

/**
 * The shape returned by GET /api/sadad/transaction/:id on the merchant backend.
 */
export interface TransactionResponse {
  success: boolean;
  transaction?: TransactionDetail;
  error?: string;
}

/**
 * Known fields for a SADAD transaction record.
 * The backend may return additional gateway-specific fields.
 */
export interface TransactionDetail {
  transactionno?: string;
  ORDER_ID?: string;
  TXN_AMOUNT?: string;
  status?: number | string;
  statusMessage?: string;
  txnDate?: string;
  isRefunded?: boolean;
  [key: string]: unknown;
}

/**
 * Props shared by all SADAD components that need order data.
 */
export interface SadadOrderProps {
  orderId: string;
  amount: number;
  mobile?: string;
  email?: string;
}

/**
 * Transaction status display variants.
 */
export type TransactionStatusVariant = 'success' | 'pending' | 'failed' | 'refunded' | 'unknown';

/**
 * Options for the useSadadCheckout hook.
 */
export interface UseSadadCheckoutOptions {
  onSuccess?: (response: CheckoutResponse) => void;
  onCheckoutError?: (error: Error) => void;
}

/**
 * Return value of the useSadadCheckout hook.
 */
export interface UseSadadCheckoutReturn {
  loading: boolean;
  error: Error | null;
  initiateCheckout: (orderData: OrderData) => Promise<void>;
  reset: () => void;
}

/**
 * Options for the useSadadTransaction hook.
 */
export interface UseSadadTransactionOptions {
  transactionId: string;
  pollInterval?: number;
  enabled?: boolean;
  onStatusChange?: (detail: TransactionDetail) => void;
}

/**
 * Return value of the useSadadTransaction hook.
 */
export interface UseSadadTransactionReturn {
  transaction: TransactionDetail | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  stopPolling: () => void;
  startPolling: (interval?: number) => void;
}
