import React, { useState } from 'react';
import { useNavigationStore } from '../../../stores/slices/ui/navigationSlice';
import { menuItems } from './menuItems';
import styles from './Sidebar.module.css';

interface SidebarNavProps {
  isOpen: boolean;
  isMobile?: boolean;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ isOpen, isMobile = false }) => {
  const { activeMenu, setActiveMenu } = useNavigationStore();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ 
    journal: true 
  });

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const handleMenuClick = (itemId: string) => {
    setActiveMenu(itemId);
    if (isMobile) {
      // モバイルの場合はメニューを閉じる処理をトリガー
      // 親コンポーネントで処理
    }
  };

  return (
    <nav className={styles.nav}>
      {menuItems.map((menu) => (
        <div key={menu.id} className={styles.menuGroup}>
          <button
            onClick={() => toggleMenu(menu.id)}
            className={styles.menuItem}
            aria-expanded={expandedMenus[menu.id]}
          >
            <span className={styles.menuItemContent}>
              <span className={styles.menuIcon}>{menu.icon}</span>
              {(isOpen || isMobile) && (
                <span className={styles.menuLabel}>{menu.label}</span>
              )}
            </span>
            {(isOpen || isMobile) && menu.children && (
              <span 
                className={`${styles.chevron} ${
                  expandedMenus[menu.id] ? styles.rotated : ''
                }`}
              >
                ▶
              </span>
            )}
          </button>

          {(isOpen || isMobile) && expandedMenus[menu.id] && menu.children && (
            <div className={styles.submenu}>
              {menu.children.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`
                    ${styles.submenuItem} 
                    ${activeMenu === item.id ? styles.active : ''}
                  `}
                >
                  <span className={styles.menuIcon}>{item.icon}</span>
                  <span className={styles.menuLabel}>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};