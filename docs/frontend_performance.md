# Frontend Performance Optimization

## 1. Code Splitting
- **Route-based**: Used `React.lazy` and `Suspense` for page routes (Already default in Next.js, manually needed in Vite).
- **Implementation**:
```tsx
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
// Usage in Routes
<Route path="/dashboard" element={<Suspense fallback={<Loading />}><Dashboard /></Suspense>} />
```

## 2. Image Optimization
- Use standard `<img>` with `loading="lazy"` for below-fold images.
- Use `srcset` for responsive sizing.
- For avatars, use compressed formatting (WebP).

## 3. Prevent Re-renders
- **React.memo**: Wrap heavy UI components (like huge Data Tables).
- **useCallback / useMemo**: Use for stable function references passed to children.
- **React Query**: Configured with `staleTime: 5 * 60 * 1000` (5 mins) to avoid refetching static data too often.

## 4. Bundle Size Analysis
- Run `npx vite-bundle-visualizer` to identify large deps.
- Avoid large imports like full `lodash` (use `lodash/debounce` instead).

## 5. Web Vitals
- Optimize LCP (Largest Contentful Paint) by preloading critical fonts/hero images.
- Optimize CLS (Cumulative Layout Shift) by defining explicit width/height on images and placeholders for dynamic content.
