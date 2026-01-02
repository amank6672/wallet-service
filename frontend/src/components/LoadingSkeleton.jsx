import { memo } from 'react';
import styles from './LoadingSkeleton.module.css';

/**
 * Loading skeleton component for better UX
 */
export const LoadingSkeleton = memo(function LoadingSkeleton({ 
  lines = 3, 
  showHeader = false,
  className = '' 
}) {
  return (
    <div className={`${styles.skeletonContainer} ${className}`}>
      {showHeader && (
        <div className={styles.skeletonHeader}>
          <div className={styles.skeletonLine} style={{ width: '40%', height: '24px' }} />
          <div className={styles.skeletonLine} style={{ width: '30%', height: '24px' }} />
        </div>
      )}
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className={styles.skeletonLine} />
      ))}
    </div>
  );
});

/**
 * Table skeleton for transaction table
 */
export const TableSkeleton = memo(function TableSkeleton({ rows = 5 }) {
  return (
    <div className={styles.tableSkeleton}>
      <div className={styles.skeletonTableHeader}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={styles.skeletonHeaderCell} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={styles.skeletonTableRow}>
          {Array.from({ length: 5 }).map((_, cellIndex) => (
            <div key={cellIndex} className={styles.skeletonTableCell} />
          ))}
        </div>
      ))}
    </div>
  );
});

