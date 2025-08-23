import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type MenuItemId = 
  | "freeeInput"
  | "bankImport"
  | "auxiliary"
  | "incomeDetail"
  | "expenseDetail"
  | "report"
  | "divisionStatements"
  | "chart"
  | "bankAccounts"
  | "settings"
  | "closing"
  | "sampleData"
  | "export"
  | "spec"
  | "paymentTest"
  | "manual";

interface NavigationState {
  // State
  activeMenu: MenuItemId;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  
  // Actions
  setActiveMenu: (menu: MenuItemId) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set) => ({
      // Initial state
      activeMenu: "freeeInput",
      sidebarOpen: true,
      mobileMenuOpen: false,
      
      // Actions
      setActiveMenu: (menu) => set({ activeMenu: menu }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      toggleMobileMenu: () => set((state) => ({ 
        mobileMenuOpen: !state.mobileMenuOpen 
      })),
      
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'navigation-store',
    }
  )
);