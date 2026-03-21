# @louis-innovations/sadad-react

> Built by Louis Innovations (www.louis-innovations.com)

Frontend-only React 18+ components and hooks for integrating the SADAD Payment Gateway into your React application.

This package is **frontend-only**. It never calls the SADAD API directly from the browser. All requests go through your merchant backend, which holds your credentials securely.

---

## Installation

```bash
npm install @louis-innovations/sadad-react react
```

> **Peer dependency:** React 18 or higher is required.

---

## Quick Start

### 1. Wrap your app with SadadProvider

```tsx
import { SadadProvider } from '@louis-innovations/sadad-react';

function App() {
  return (
    <SadadProvider backendBaseUrl="https://your-store.com">
      <CheckoutPage />
    </SadadProvider>
  );
}
```

### 2. Add a checkout button

```tsx
import { SadadCheckoutButton } from '@louis-innovations/sadad-react';

function CheckoutPage() {
  return (
    <SadadCheckoutButton
      orderData={{
        order_id: 'ORDER-001',
        amount: 150.00,
        mobile: '33123456',
        email: 'customer@example.com',
      }}
      onError={(err) => alert(err.message)}
    />
  );
}
```

---

## Components

### SadadProvider

The context provider that makes `backendBaseUrl` available to all SADAD components and hooks. Wrap your app or checkout section with this component.

```tsx
<SadadProvider backendBaseUrl="https://your-store.com">
  {/* SADAD components go here */}
</SadadProvider>
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `backendBaseUrl` | `string` | Yes | Base URL of your merchant backend (no trailing slash) |

---

### SadadCheckoutButton

A "Pay with SADAD" button. On click, it calls `POST /api/sadad/checkout` on your backend and submits a hidden form to redirect the customer to the SADAD payment gateway.

```tsx
<SadadCheckoutButton
  orderData={{ order_id: 'ORDER-001', amount: 150.00 }}
  loadingLabel="Redirecting to SADAD..."
  onSuccess={(response) => console.log('Checkout URL ready', response.url)}
  onError={(err) => toast.error(err.message)}
  className="btn-primary"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orderData` | `OrderData` | Required | Order details |
| `loadingLabel` | `string` | `"Processing..."` | Button label during loading |
| `onSuccess` | `(response) => void` | - | Called when backend returns checkout URL |
| `onError` | `(error) => void` | - | Called on error |
| `...buttonProps` | `ButtonHTMLAttributes` | - | Any standard button props |

---

### SadadEmbeddedCheckout

Renders the SADAD payment gateway inside an iframe. Calls `POST /api/sadad/checkout` and loads the result in an embedded frame so the customer stays on your page.

```tsx
<SadadEmbeddedCheckout
  orderData={{ order_id: 'ORDER-001', amount: 150.00 }}
  height={650}
  loadingContent={<Spinner />}
  onReady={() => console.log('Checkout iframe loaded')}
  onError={(err) => console.error(err)}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orderData` | `OrderData` | Required | Order details |
| `width` | `string \| number` | `"100%"` | Iframe width |
| `height` | `string \| number` | `600` | Iframe height |
| `loadingContent` | `ReactNode` | Built-in spinner text | Loading state UI |
| `errorContent` | `ReactNode \| (error) => ReactNode` | Built-in error UI | Error state UI |
| `onReady` | `(response) => void` | - | Called when iframe is mounted |
| `onError` | `(error) => void` | - | Called on error |

---

### SadadPaymentStatus

Displays the current status of a SADAD transaction by fetching from `GET /api/sadad/transaction/:transactionId`. Supports optional polling.

```tsx
<SadadPaymentStatus
  transactionId="TXN-001"
  enabled={true}
  pollInterval={5000}
  onStatusChange={(txn) => {
    if (txn.status === 3) console.log('Payment succeeded!');
  }}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `transactionId` | `string` | Required | SADAD transaction number |
| `enabled` | `boolean` | `false` | Auto-start polling when true |
| `pollInterval` | `number` | `5000` | Polling interval in ms |
| `onStatusChange` | `(txn) => void` | - | Called when status changes |
| `renderStatus` | `(txn, variant) => ReactNode` | - | Custom status render function |
| `loadingContent` | `ReactNode` | Built-in | Loading state UI |
| `errorContent` | `ReactNode \| (error) => ReactNode` | Built-in | Error state UI |
| `emptyContent` | `ReactNode` | Built-in | Empty state UI |
| `showRawDetails` | `boolean` | `false` | Show expandable raw data table |

**Status variants:** `success` | `pending` | `failed` | `refunded` | `unknown`

---

### SadadRefundButton

Admin-only refund button. Calls `POST /api/sadad/refund` on your backend. Shows a confirmation modal before submitting. Never handles secrets.

```tsx
<SadadRefundButton
  transactionId="TXN-001"
  onSuccess={(res) => toast.success('Refund initiated')}
  onError={(err) => toast.error(err.message)}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `transactionId` | `string` | Required | SADAD transaction number to refund |
| `label` | `string` | `"Refund Payment"` | Button label |
| `loadingLabel` | `string` | `"Processing Refund..."` | Label during request |
| `confirmationMessage` | `string` | Generic message | Text shown in confirm modal |
| `skipConfirmation` | `boolean` | `false` | Skip the confirmation dialog |
| `onSuccess` | `(response) => void` | - | Called on successful refund |
| `onError` | `(error) => void` | - | Called on error |

---

## Hooks

### useSadadCheckout

Manages the checkout flow. Returns loading state and an `initiateCheckout` function.

```tsx
const { loading, error, initiateCheckout, reset } = useSadadCheckout({
  onSuccess: (response) => console.log(response.url),
  onError: (err) => console.error(err),
});
```

### useSadadTransaction

Fetches and optionally polls a transaction from your backend.

```tsx
const { transaction, loading, error, refetch, startPolling, stopPolling } =
  useSadadTransaction({
    transactionId: 'TXN-001',
    pollInterval: 5000,
    enabled: true,
    onStatusChange: (txn) => {
      if (txn.status === 3) stopPolling();
    },
  });
```

---

## Backend Endpoint Contract

Your merchant backend must implement these endpoints. This package calls them; your backend calls the SADAD API.

---

### POST /api/sadad/checkout

Called by `SadadCheckoutButton`, `SadadEmbeddedCheckout`, and `useSadadCheckout`.

**Request body:**
```json
{
  "order_id": "ORDER-001",
  "amount": 150.00,
  "mobile": "33123456",
  "email": "customer@example.com",
  "items": [
    { "order_id": "ITEM-001", "amount": 75.00, "quantity": 2 }
  ],
  "callback_url": "https://your-store.com/sadad/callback"
}
```

**Response (200):**
```json
{
  "url": "https://sadadqa.com/webpurchase",
  "params": {
    "merchant_id": "1234567",
    "ORDER_ID": "ORDER-001",
    "TXN_AMOUNT": "150.00",
    "WEBSITE": "WEBSTAGING",
    "signature": "...",
    "productdetail": [
      { "order_id": "ITEM-001", "amount": "75.00", "quantity": "2" }
    ]
  }
}
```

The `params` object is submitted as a POST form to `url`. Array values such as `productdetail` are expanded into indexed inputs (e.g., `productdetail[0][order_id]`).

---

### POST /api/sadad/refund

Called by `SadadRefundButton`.

**Request body:**
```json
{
  "transaction_id": "TXN-001"
}
```

**Response (200) on success:**
```json
{
  "success": true,
  "refundDetails": { ... }
}
```

**Response (200) on failure:**
```json
{
  "success": false,
  "error": "Transaction has already been refunded."
}
```

---

### GET /api/sadad/transaction/:id

Called by `SadadPaymentStatus` and `useSadadTransaction`.

**URL parameter:** `:id` - the transaction number or order ID.

**Response (200) on success:**
```json
{
  "success": true,
  "transaction": {
    "transactionno": "TXN-001",
    "ORDER_ID": "ORDER-001",
    "TXN_AMOUNT": "150.00",
    "status": 3,
    "statusMessage": "Transaction Successful",
    "txnDate": "2026-03-21 14:30:00",
    "isRefunded": false
  }
}
```

**SADAD status codes:**
| Code | Meaning |
|------|---------|
| `0` | Initiated |
| `1` | In Progress |
| `2` | Failed |
| `3` | Success |
| `4` | Refunded |

---

## Laravel Backend Example

If you are using the `@louis-innovations/sadad-laravel` package, the backend endpoints are provided out of the box. See the [sadad-laravel README](https://github.com/louis-innovations/sadad-laravel) for details.

---

## TypeScript

All components, hooks, and types are fully typed. Import types as needed:

```ts
import type {
  OrderData,
  OrderItem,
  CheckoutResponse,
  RefundResponse,
  TransactionDetail,
  TransactionStatusVariant,
} from '@louis-innovations/sadad-react';
```

---

## Attribution

Built by **Louis Innovations** — [www.louis-innovations.com](https://www.louis-innovations.com)

SADAD is a payment gateway operated by SADAD Qatar. This package is an independent integration library and is not officially affiliated with SADAD Qatar.

---

## License

MIT - see [LICENSE](./LICENSE) for full text.
