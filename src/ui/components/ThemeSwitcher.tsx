import React, { useState, useEffect } from 'react';
import styles from './ThemeSwitcher.module.css';

type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * テーマ切り替えコンポーネント
 * CSS変数ベースでライト/ダーク/自動モードを制御
 */
export const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme') as ThemeMode;
    return saved || 'auto'; // デフォルトを'auto'に変更
  });

  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      // DOM操作を削除し、data-theme属性のみを制御
      const root = document.documentElement;
      
      if (mode === 'light') {
        root.setAttribute('data-theme', 'light');
      } else if (mode === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        // autoモードの場合はdata-theme属性を削除
        // CSS側の@media (prefers-color-scheme)が有効になる
        root.removeAttribute('data-theme');
      }
      
      // bodyのクラスも更新（レガシーコードとの互換性）
      document.body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
      document.body.classList.add(`theme-${mode}`);
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    // autoモードの場合、システムテーマの変更を監視
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // data-theme属性は設定せず、CSSのメディアクエリに任せる
        const isDark = mediaQuery.matches;
        console.log(`System theme changed: ${isDark ? 'dark' : 'light'}`);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <div className={styles.themeSwitcher}>
      <button
        className={`${styles.button} ${theme === 'light' ? styles.active : ''}`}
        onClick={() => setTheme('light')}
        title="ライトテーマ"
      >
        ☀️
      </button>
      <button
        className={`${styles.button} ${theme === 'dark' ? styles.active : ''}`}
        onClick={() => setTheme('dark')}
        title="ダークテーマ"
      >
        🌙
      </button>
      <button
        className={`${styles.button} ${theme === 'auto' ? styles.active : ''}`}
        onClick={() => setTheme('auto')}
        title="自動（システム設定に従う）"
      >
        🔄
      </button>
    </div>
  );
};