import React, { useState, useEffect } from 'react';

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
    <div className="theme-switcher" style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => setTheme('light')}
        title="ライトテーマ"
        style={{ 
          padding: '0.25rem 0.5rem',
          fontSize: '1.2rem',
          border: 'none',
          background: theme === 'light' ? 'var(--color-primary)' : 'transparent',
          color: theme === 'light' ? 'white' : 'var(--color-text-primary)',
          cursor: 'pointer',
          borderRadius: '0.25rem',
          transition: 'all 0.2s ease'
        }}
      >
        ☀️
      </button>
      <button
        className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => setTheme('dark')}
        title="ダークテーマ"
        style={{ 
          padding: '0.25rem 0.5rem',
          fontSize: '1.2rem',
          border: 'none',
          background: theme === 'dark' ? 'var(--color-primary)' : 'transparent',
          color: theme === 'dark' ? 'white' : 'var(--color-text-primary)',
          cursor: 'pointer',
          borderRadius: '0.25rem',
          transition: 'all 0.2s ease'
        }}
      >
        🌙
      </button>
      <button
        className={`btn btn-sm ${theme === 'auto' ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => setTheme('auto')}
        title="自動（システム設定に従う）"
        style={{ 
          padding: '0.25rem 0.5rem',
          fontSize: '1.2rem',
          border: 'none',
          background: theme === 'auto' ? 'var(--color-primary)' : 'transparent',
          color: theme === 'auto' ? 'white' : 'var(--color-text-primary)',
          cursor: 'pointer',
          borderRadius: '0.25rem',
          transition: 'all 0.2s ease'
        }}
      >
        🔄
      </button>
    </div>
  );
};