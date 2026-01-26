# Frontend Testing Plan

## 1. Strategy
We will use **Vitest** (Unit) and **Playwright** (E2E/Integration).

### Unit Tests (Components & Utilities)
- **Tools**: Vitest + React Testing Library (RTL).
- **Scope**:
    - Reusable UI components (Button, Input).
    - Utility functions (date formatting, validation).
    - Hooks (custom hooks logic).
- **Example Test (`src/components/ui/Button.test.tsx`)**:
```tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Integration Tests (User Flows)
- **Tools**: Playwright (recommended) or Vitest with MSW.
- **Scope**:
    - Login Flow (Success/Failure).
    - Dashboard rendering.
    - Appointment booking flow.
- **Mocking**: Use MSW (Mock Service Worker) to intercept network requests during tests.

## 2. Recommended Tools
- **Vitest**: Fast, Vite-native runner.
- **@testing-library/react**: DOM testing utilities.
- **@testing-library/user-event**: Simulate user interactions.
- **MSW**: API mocking.

## 3. Setup Commands
```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## 4. CI/CD Integration
- Run `npm test` on every PR.
- Run `npm run e2e` (Playwright) on merge to main.
