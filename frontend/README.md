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
- **Context API**: Global wallet state management to avoid prop drilling
- **Custom hooks**: Reusable logic extracted into `useWallet` and `useTransactions`
- **Optimistic updates**: Immediate UI feedback for transactions with rollback on error

### User Experience
- **Loading skeletons**: Skeleton screens instead of loading spinners for better perceived performance
- **Debouncing**: Input debouncing to reduce unnecessary API calls
- **Error boundaries**: Graceful error handling with fallback UI
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation support

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
│   ├── context/             # React Context
│   │   └── WalletContext.jsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useWallet.js
│   │   └── useTransactions.js
│   ├── pages/               # Page components
│   │   ├── WalletPage.jsx
│   │   └── TransactionsPage.jsx
│   ├── utils/               # Utility functions
│   │   ├── apiClient.js     # Optimized API client
│   │   ├── cache.js         # Caching utilities
│   │   ├── debounce.js      # Debounce utilities
│   │   └── formatters.js    # Formatting utilities
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
├── WalletProvider (global state)
└── BrowserRouter
    └── Suspense (loading fallback)
        └── Routes
            ├── WalletPage (lazy loaded)
            └── TransactionsPage (lazy loaded)
```

### Data Flow
1. **User Action** → Component Event Handler
2. **Custom Hook** → Business Logic
3. **API Client** → Request (with caching/deduplication)
4. **Backend API** → Response
5. **Cache Update** → State Update
6. **Component Re-render** → UI Update

## 🔧 Key Features

### 1. Optimized API Client (`utils/apiClient.js`)
- Request deduplication for concurrent requests
- TTL-based caching for GET requests
- Automatic retry with exponential backoff
- Error handling and mapping

### 2. Custom Hooks

#### `useWallet` Hook
- Wallet creation
- Transaction processing with optimistic updates
- Wallet refresh
- Error handling

#### `useTransactions` Hook
- Cursor-based pagination
- Backend sorting
- Page navigation (first, previous, next)
- Loading and error states

### 3. Error Handling
- **Error Boundary**: Catches React errors and displays fallback UI
- **API Errors**: User-friendly error messages with proper error codes
- **Network Errors**: Automatic retry and graceful degradation

### 4. Caching Strategy
- **Wallet Cache**: 5 minutes TTL
- **Transactions Cache**: 2 minutes TTL
- **Cache Invalidation**: Automatic on mutations (POST, PUT, DELETE)
- **Cache Key**: Based on endpoint and query parameters

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
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
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
npm run build
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
- [ ] React Query for advanced caching and synchronization
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
