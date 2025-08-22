import React, { useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

export const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme') as ThemeMode;
    return saved || 'light';
  });

  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      let isDark = false;
      
      if (mode === 'auto') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = mode === 'dark';
      }
      
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
        // ダークテーマの背景色を直接適用
        document.body.style.backgroundColor = '#1a1a1a';
        document.body.style.color = '#e5e7eb';
        
        // インラインスタイルを持つ要素の色を強制的に変更
        const elementsWithStyle = document.querySelectorAll('[style]');
        elementsWithStyle.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          // 背景色が白系の場合、ダーク系に変更
          if (htmlEl.style.backgroundColor) {
            const bgColor = htmlEl.style.backgroundColor;
            if (bgColor.includes('255') || bgColor.includes('fff') || bgColor === 'white') {
              htmlEl.style.backgroundColor = '#2a2a2a';
            }
            if (bgColor.includes('248') || bgColor.includes('f8') || bgColor.includes('f5')) {
              htmlEl.style.backgroundColor = '#2d2d2d';
            }
          }
          // 文字色を強制的に設定
          if (!htmlEl.style.color || htmlEl.style.color.includes('255') || htmlEl.style.color === 'white') {
            htmlEl.style.color = '#e5e7eb';
          }
        });
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.body.classList.add('theme-light');
        document.body.classList.remove('theme-dark');
        // ライトテーマの背景色を直接適用
        document.body.style.backgroundColor = '#f8f9fa';
        document.body.style.color = '#212529';
        
        // インラインスタイルをリセット
        const elementsWithStyle = document.querySelectorAll('[style]');
        elementsWithStyle.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          // スタイルを元に戻すために、data属性から復元するか、ページをリロード
        });
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <div className="theme-switcher">
      <button
        className={theme === 'light' ? 'active' : ''}
        onClick={() => setTheme('light')}
        title="ライトテーマ"
      >
        ☀️
      </button>
      <button
        className={theme === 'dark' ? 'active' : ''}
        onClick={() => setTheme('dark')}
        title="ダークテーマ"
      >
        🌙
      </button>
      <button
        className={theme === 'auto' ? 'active' : ''}
        onClick={() => setTheme('auto')}
        title="自動（システム設定に従う）"
      >
        🔄
      </button>
    </div>
  );
};