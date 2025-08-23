import React from 'react';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  isMobile = false,
  onToggle,
  onClose 
}) => {
  return (
    <>
      {isMobile && isOpen && (
        <div 
          className={styles.overlay} 
          onClick={onClose}
        />
      )}
      <aside 
        className={`
          ${styles.sidebar} 
          ${isOpen ? styles.open : styles.collapsed}
          ${isMobile ? styles.mobile : styles.desktop}
        `}
      >
        <SidebarHeader 
          isOpen={isOpen}
          isMobile={isMobile}
          onToggle={onToggle}
          onClose={onClose}
        />
        <SidebarNav isOpen={isOpen} isMobile={isMobile} />
      </aside>
    </>
  );
};