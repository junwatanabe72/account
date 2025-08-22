export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // Main color
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface BrandColors {
  primary: ColorShades;
  secondary: ColorShades;
}

export interface BootstrapColors {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
}

export interface SemanticColors extends BootstrapColors {
  income: string;      // 収入
  expense: string;     // 支出
  transfer: string;    // 振替
  balance: string;     // 残高
  pending: string;     // 保留中
  approved: string;    // 承認済み
  rejected: string;    // 却下
}

export interface SystemColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    light: string;
    inverse: string;
  };
  border: {
    light: string;
    default: string;
    dark: string;
  };
  state: {
    hover: string;
    active: string;
    focus: string;
    disabled: string;
  };
}

export interface TableColors {
  default: string;
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
  striped: string;
  hover: string;
}

export interface ColorConfig {
  brand: BrandColors;
  bootstrap: BootstrapColors;
  semantic: SemanticColors;
  system: SystemColors;
  table: TableColors;
}

// Default color definitions - matching existing theme.css
export const Colors: ColorConfig = {
  brand: {
    primary: {
      50: '#e6f0ff',
      100: '#b3d1ff',
      200: '#80b3ff',
      300: '#4d94ff',
      400: '#1a75ff',
      500: '#0056b3', // Unified with existing theme.css
      600: '#004590',
      700: '#003d82',
      800: '#002d61',
      900: '#001d41'
    },
    secondary: {
      50: '#f5f6f7',
      100: '#e1e3e5',
      200: '#cdd1d4',
      300: '#b9bec3',
      400: '#a5abb2',
      500: '#6c757d', // Bootstrap secondary
      600: '#5a6268',
      700: '#495057',
      800: '#383d42',
      900: '#272b2e'
    }
  },
  
  bootstrap: {
    primary: '#0056b3',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40'
  },
  
  semantic: {
    primary: '#0056b3',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    
    // Accounting system specific
    income: '#28a745',      // 収入（緑）
    expense: '#dc3545',     // 支出（赤）
    transfer: '#007bff',    // 振替（青）
    balance: '#6c757d',     // 残高（グレー）
    pending: '#ffc107',     // 保留中（黄）
    approved: '#28a745',    // 承認済み（緑）
    rejected: '#dc3545'     // 却下（赤）
  },
  
  system: {
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef',
      inverse: '#343a40'
    },
    text: {
      primary: '#212529',
      secondary: '#495057',
      muted: '#6c757d',
      light: '#adb5bd',
      inverse: '#ffffff'
    },
    border: {
      light: '#dee2e6',
      default: '#ced4da',
      dark: '#adb5bd'
    },
    state: {
      hover: 'rgba(0, 0, 0, 0.075)',
      active: 'rgba(0, 0, 0, 0.125)',
      focus: 'rgba(0, 86, 179, 0.25)',
      disabled: 'rgba(0, 0, 0, 0.5)'
    }
  },
  
  table: {
    default: 'transparent',
    primary: '#b8d4ff',
    secondary: '#d6d8db',
    success: '#c3e6cb',
    danger: '#f5c6cb',
    warning: '#ffeeba',
    info: '#bee5eb',
    light: '#fdfdfe',
    dark: '#c6c8ca',
    striped: 'rgba(0, 0, 0, 0.05)',
    hover: 'rgba(0, 0, 0, 0.075)'
  }
};

// Utility functions
export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

export function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}