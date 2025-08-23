import React from 'react';
import styles from './Sidebar.module.css';

interface SidebarHeaderProps {
  isOpen: boolean;
  isMobile?: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ 
  isOpen, 
  isMobile = false,
  onToggle,
  onClose 
}) => {
  return (
    <div className={styles.header}>
      <h5 className={`${styles.title} ${!isOpen && !isMobile ? styles.hidden : ''}`}>
        会計システム
      </h5>
      {isMobile ? (
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="メニューを閉じる"
        >
          ×
        </button>
      ) : (
        <button
          onClick={onToggle}
          className={styles.toggleButton}
          aria-label={isOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
        >
          {isOpen ? '◀' : '▶'}
        </button>
      )}
    </div>
  );
};