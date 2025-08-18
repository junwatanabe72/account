import '@testing-library/jest-dom'

// モックLocalStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

// モックalert
global.alert = vi.fn()

// モックconsole（必要に応じて）
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn()
}