# Changelog

All notable changes to `@louis-innovations/sadad-react` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-03-21

### Added

- `SadadProvider` context provider accepting `backendBaseUrl` prop
- `SadadCheckoutButton` component - "Pay with SADAD" button that calls backend and submits form
- `SadadEmbeddedCheckout` component - embedded iframe checkout experience
- `SadadPaymentStatus` component - polls backend for transaction status with visual indicators
- `SadadRefundButton` component - admin refund button with confirmation modal
- `useSadadCheckout` hook - manages checkout flow and loading state
- `useSadadTransaction` hook - fetches/polls transaction status from backend
- Full TypeScript support with exported types
- Backend endpoint contract documentation (README)
- Zero direct calls to SADAD API - all secrets stay on the merchant backend
- MIT license
