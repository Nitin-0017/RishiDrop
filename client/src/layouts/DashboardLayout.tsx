import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { RishihoodLogo } from '../components/common/RishihoodLogo';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  role: 'GUARD' | 'ADMIN';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  return (
    <div
      className="h-screen h-[100dvh] bg-[#F8FAFC] flex relative w-full min-w-0 overflow-hidden antialiased"
      style={{
        '--sidebar-width': isSidebarHovered ? '260px' : '72px',
      } as React.CSSProperties}
    >
      {/* 1. LEFT COLUMN: Continuous Stationary Sidebar with single unified branding from top of viewport */}
      <Sidebar
        role={role}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isHovered={isSidebarHovered}
        onHoverChange={setIsSidebarHovered}
      />

      {/* 2. RIGHT COLUMN: Main Layout Column (Independently scrollable, pushed in lockstep with sidebar) */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-[380ms] ease-in-out">
        
        {/* Mobile Navigation Header (Only visible on mobile screens) */}
        <div className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-[#E6E8EC] sticky top-0 z-30 shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 -ml-1 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <RishihoodLogo variant="compact" size="sm" />
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#FBEAEC] text-[#A6192E] border border-[#F5C6CB]">
              ADMIN
            </span>
          </div>

          <div className="w-8" />
        </div>

        {/* Main Content Area: Reclaims space from duplicate top header, filling available area */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1600px] mx-auto min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;


