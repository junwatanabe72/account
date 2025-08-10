// 共通スタイル定義

export const tableStyles = {
  // 基本テーブルスタイル
  base: {
    width: '100%',
    borderCollapse: 'collapse' as const
  },
  
  // ストライプテーブル
  striped: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 14
  },
  
  // 小さいテーブル
  small: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 12
  }
}

export const cardStyles = {
  // 基本カード
  base: {
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: 12
  },
  
  // ヘッダー付きカード
  withHeader: {
    border: '1px solid #ddd',
    borderRadius: 8
  },
  
  // カードヘッダー
  header: {
    padding: '8px 12px',
    fontWeight: 600,
    borderBottom: '1px solid #ddd'
  },
  
  // カードボディ
  body: {
    padding: 12
  }
}

export const cellStyles = {
  // 基本セル
  base: {
    border: '1px solid #ddd',
    padding: 8
  },
  
  // ヘッダーセル
  header: {
    border: '1px solid #ddd',
    padding: 8,
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold'
  },
  
  // 数値セル（右寄せ）
  numeric: {
    border: '1px solid #ddd',
    padding: 8,
    textAlign: 'right' as const
  },
  
  // 小さいセル
  small: {
    border: '1px solid #ddd',
    padding: 4,
    fontSize: 12
  }
}

export const buttonStyles = {
  // プライマリボタン
  primary: 'btn btn-primary',
  
  // セカンダリボタン
  secondary: 'btn btn-secondary',
  
  // アウトラインボタン
  outlinePrimary: 'btn btn-outline-primary',
  outlineSecondary: 'btn btn-outline-secondary',
  outlineDanger: 'btn btn-outline-danger',
  
  // 小さいボタン
  smallPrimary: 'btn btn-sm btn-primary',
  smallOutlinePrimary: 'btn btn-sm btn-outline-primary',
  smallOutlineSecondary: 'btn btn-sm btn-outline-secondary',
  smallOutlineDanger: 'btn btn-sm btn-outline-danger'
}

export const colorStyles = {
  // テキストカラー
  textPrimary: '#0d6efd',
  textDanger: '#dc3545',
  textSuccess: '#198754',
  textWarning: '#ffc107',
  textMuted: '#6c757d',
  
  // 背景カラー
  bgLight: '#f8f9fa',
  bgWarning: '#fff7db',
  bgInfo: '#cff4fc',
  
  // ボーダーカラー
  borderPrimary: '#0d6efd',
  borderDanger: '#dc3545',
  borderWarning: '#ffe08a',
  borderDefault: '#ddd'
}