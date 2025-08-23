import React, { PropsWithChildren, useEffect } from 'react';
import { useNavigationStore } from '../../stores/slices/ui/navigationSlice';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import styles from './MainLayout.module.css';

interface MainLayoutProps extends PropsWithChildren {
  title?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title = "マンション管理組合会計エンジン" 
}) => {
  const {
    sidebarOpen,
    mobileMenuOpen,
    toggleSidebar,
    setMobileMenuOpen,
  } = useNavigationStore();

  // ウィンドウリサイズ時の処理
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileMenuOpen]);

  const isMobile = window.innerWidth <= 768;

  return (
    <div className={styles.layout}>
      {/* モバイル用メニューボタン */}
      {isMobile && (
        <button
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="メニューを開く"
        >
          ☰
        </button>
      )}

      {/* サイドバー */}
      {isMobile ? (
        <Sidebar
          isOpen={mobileMenuOpen}
          isMobile={true}
          onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onClose={() => setMobileMenuOpen(false)}
        />
      ) : (
        <Sidebar
          isOpen={sidebarOpen}
          isMobile={false}
          onToggle={toggleSidebar}
        />
      )}

      {/* メインコンテンツ */}
      <div className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          <ThemeSwitcher />
        </header>
        
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};