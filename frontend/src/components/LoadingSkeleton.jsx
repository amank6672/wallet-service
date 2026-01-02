import { memo } from 'react';
import styles from './LoadingSkeleton.module.css';

/**
 * Simple loading spinner component
 */
export const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loaderCard}>
        <div className={styles.spinner}></div>
        <p className={styles.loaderText}>Loading wallet...</p>
      </div>
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

