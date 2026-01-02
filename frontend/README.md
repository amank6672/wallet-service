# Frontend - Wallet Service

A high-performance React frontend optimized for 10 million users, built with modern best practices and enterprise-grade architecture.

## 🚀 Performance Optimizations

### Code Splitting & Lazy Loading
- **Route-based code splitting**: Pages are lazy-loaded using React's `lazy()` and `Suspense`
- **Vendor chunk splitting**: React, React Router, and React Table are split into separate chunks for better caching
- **Dynamic imports**: Reduces initial bundle size and improves Time to Interactive (TTI)

### React Performance Optimizations
- **React.memo**: All components are memoized to prevent unnecessary re-renders
- **useMemo**: Expensive computations (column definitions, computed values) are memoized
- **useCallback**: Event handlers and functions are memoized to maintain referential equality
- **Optimized re-renders**: Components only re-render when their props actually change

### API Client Optimizations
- **Request deduplication**: Prevents duplicate concurrent requests
- **Intelligent caching**: In-memory cache with TTL for GET requests
- **Automatic retry**: Exponential backoff retry logic for failed requests
- **Error handling**: Comprehensive error mapping and user-friendly messages

### State Management
- **React Query**: Advanced data fetching and caching with automatic background updates
- **Custom hooks**: Reusable logic extracted into `useWalletQuery` and `useTransactionsQuery`
- **Optimistic updates**: Immediate UI feedback for transactions with rollback on error
- **Smart caching**: React Query manages cache with 2-minute stale time for transactions

### User Experience
- **Loading states**: Simple spinner loader for wallet loading
- **Transaction type toggle**: Compact CREDIT/DEBIT segmented control for intuitive transaction selection
- **Error boundaries**: Graceful error handling with fallback UI
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation support
- **Decimal precision**: All amounts displayed with up to 4 decimal places (e.g., ₹20.5612, ₹4.12)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/                 # API client layer
│   │   └── walletApi.js    # Wallet API functions
│   ├── components/          # Reusable components
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   └── TransactionTable.jsx
│   ├── config/              # Configuration
│   │   └── constants.js     # App constants and config
│   ├── hooks/               # Custom React hooks
│   │   ├── useWalletQuery.js
│   │   └── useTransactionsQuery.js
│   ├── pages/               # Page components
│   │   ├── WalletPage.jsx
│   │   └── TransactionsPage.jsx
│   ├── utils/               # Utility functions
│   │   ├── apiClient.js     # Optimized API client
│   │   └── formatters.js    # Formatting utilities (amount display)
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── package.json
├── vite.config.js           # Vite configuration
└── README.md
```

## 🏗️ Architecture

### Component Hierarchy
```
App
├── ErrorBoundary (catches all errors)
├── QueryClientProvider (React Query)
└── BrowserRouter
    └── Suspense (loading fallback)
        └── Routes
            ├── WalletPage (lazy loaded)
            └── TransactionsPage (lazy loaded)
```

### Data Flow
1. **User Action** → Component Event Handler
2. **React Query Hook** → Data Fetching/Mutation
3. **API Client** → Request
4. **Backend API** → Response
5. **React Query Cache** → Automatic cache update
6. **Component Re-render** → UI Update

## 🔧 Key Features

### 1. Wallet Management
- **Wallet Setup**: Create wallet with optional initial balance (supports up to 4 decimal places, e.g., 20.5612)
- **Balance Display**: Real-time balance updates after transactions, displayed with up to 4 decimal places
- **Transaction Processing**: Compact CREDIT/DEBIT segmented toggle with amount input
- **Local Storage**: Wallet ID persisted in browser for seamless return visits

### 2. Transaction History
- **Pagination**: Skip/limit pagination for efficient data loading
- **Sorting**: Sort by date or amount (ascending/descending)
- **CSV Export**: Download transaction history as CSV file
- **Real-time Updates**: Automatic refresh after new transactions

### 3. Optimized API Client (`utils/apiClient.js`)
- Request deduplication for concurrent requests
- TTL-based caching for GET requests
- Automatic retry with exponential backoff
- Error handling and mapping

### 4. React Query Hooks

#### `useWalletQuery` Hook
- Wallet data fetching with React Query
- Automatic cache management
- Wallet refresh on mutations
- Error handling and loading states

#### `useTransactionsQuery` Hook
- Skip/limit pagination with React Query
- Backend sorting (by date or amount)
- Page navigation (first, previous, next)
- Smart caching (2-minute stale time)
- Loading and error states

### 5. Error Handling
- **Error Boundary**: Catches React errors and displays fallback UI
- **API Errors**: User-friendly error messages with proper error codes
- **Network Errors**: Automatic retry and graceful degradation

### 6. Caching Strategy (React Query)
- **Wallet Cache**: Managed by React Query with automatic invalidation
- **Transactions Cache**: 2-minute stale time, cached per page (skip/limit)
- **Cache Invalidation**: Automatic on mutations (POST, PUT, DELETE)
- **Cache Key**: Based on endpoint and query parameters (walletId, skip, limit, sortBy, sortOrder)
- **Background Refetching**: Automatic refetch on window focus and network reconnect

## 🎨 Styling

- **CSS Modules**: Scoped styling to prevent conflicts
- **Dark Theme**: Optimized for dark mode
- **Responsive Design**: Mobile-first approach
- **Accessibility**: High contrast ratios, focus indicators

## 📦 Build Optimizations

### Vite Configuration
- **Code Splitting**: Manual chunks for vendors
- **Minification**: Terser with console removal
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Optimized file naming with hashes

### Bundle Analysis
- React vendor: ~150KB (gzipped)
- Table vendor: ~50KB (gzipped)
- App code: ~30KB (gzipped)
- Total initial load: ~230KB (gzipped)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- yarn

### Installation
```bash
yarn install
```

### Development
```bash
yarn dev
```

### Production Build
```bash
yarn build
```

### Preview Production Build
```bash
yarn preview
```

## 🔍 Performance Metrics

### Lighthouse Scores (Target)
- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 95+
- **SEO**: 90+

### Key Metrics
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Total Blocking Time (TBT)**: < 200ms

## 🧪 Testing Strategy

### Unit Tests (Recommended)
- Component rendering
- Hook behavior
- Utility functions
- API client logic

### Integration Tests (Recommended)
- User flows
- API integration
- Error scenarios

### E2E Tests (Recommended)
- Critical user paths
- Cross-browser testing

## 🔐 Security

- **XSS Protection**: React's built-in escaping
- **CSRF Protection**: Backend handles CSRF tokens
- **Input Validation**: Client and server-side validation
- **Error Messages**: No sensitive data in error messages

## 📱 Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚀 Deployment

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3000/api/wallet
```

### Build for Production
```bash
yarn build
```

### Deploy
The `dist/` folder contains the production build ready for deployment to:
- Static hosting (Vercel, Netlify, AWS S3)
- CDN (CloudFront, Cloudflare)
- Container (Docker)

## 📚 Best Practices Implemented

1. **Component Composition**: Small, focused components
2. **Separation of Concerns**: UI, logic, and data layers separated
3. **DRY Principle**: Reusable hooks and utilities
4. **Error Handling**: Comprehensive error boundaries and handling
5. **Performance**: Memoization, code splitting, lazy loading
6. **Accessibility**: ARIA labels, semantic HTML
7. **Type Safety**: PropTypes or TypeScript (recommended for future)
8. **Code Quality**: ESLint, consistent formatting

## 🔄 Future Enhancements

- [ ] TypeScript migration for type safety
- [ ] Service Worker for offline support
- [ ] Virtual scrolling for very large transaction lists
- [ ] WebSocket integration for real-time updates
- [ ] Progressive Web App (PWA) features
- [ ] Internationalization (i18n)
- [ ] Advanced analytics and monitoring

## 📖 API Integration

The frontend integrates with the backend API. See [Backend README](../backend/README.md) for API documentation.

### Endpoints Used
- `POST /api/wallet/setup` - Create wallet
- `GET /api/wallet/wallet/:id` - Get wallet
- `POST /api/wallet/transact/:id` - Process transaction
- `GET /api/wallet/transactions` - Get transactions (paginated)
- `GET /api/wallet/transactions/export/csv` - Export CSV

## 🤝 Contributing

1. Follow the existing code structure
2. Use custom hooks for reusable logic
3. Memoize components and callbacks
4. Add proper error handling
5. Write tests for new features
6. Update documentation

## 📄 License

See root LICENSE file.
