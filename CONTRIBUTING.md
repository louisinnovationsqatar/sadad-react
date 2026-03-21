# Contributing to @louis-innovations/sadad-react

Thank you for your interest in contributing. This document outlines the guidelines for contributing to this project.

---

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/louis-innovations/sadad-react.git
   cd sadad-react
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the package**

   ```bash
   npm run build
   ```

4. **Type-check without emitting**

   ```bash
   npm run lint
   ```

---

## Code Standards

- All source files must begin with the comment:
  `// Built by Louis Innovations (www.louis-innovations.com)`
- No emojis in source code
- Strict TypeScript - no `any` types unless absolutely unavoidable
- All exported components and hooks must have JSDoc comments
- Follow the existing file structure:
  - `src/components/` - React components
  - `src/hooks/` - React hooks
  - `src/context/` - React context
  - `src/types/` - TypeScript type definitions

## Frontend-Only Principle

This package is **frontend-only**. It must never:

- Import or bundle secrets, API keys, or credentials
- Call the SADAD API directly from the browser
- Handle merchant authentication logic

All sensitive operations must be delegated to the merchant backend via the documented backend endpoint contract (see README).

## Pull Request Guidelines

1. Fork the repository and create a branch from `main`
2. Make your changes following the code standards above
3. Run `npm run lint` to ensure no TypeScript errors
4. Run `npm run build` to verify the package builds successfully
5. Update CHANGELOG.md with a description of your changes
6. Open a pull request with a clear description of the change and its motivation

## Reporting Issues

Please open a GitHub issue at:
https://github.com/louis-innovations/sadad-react/issues

Include:
- Package version
- React version
- Description of the issue
- Steps to reproduce
- Expected vs actual behaviour
