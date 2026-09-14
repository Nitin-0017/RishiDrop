import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RishihoodLogo } from './RishihoodLogo';
import { WhatsAppSimulatorModal } from './WhatsAppSimulatorModal';
import {
  LayoutDashboard,
  Truck,
  Users,
  Shield,
  Box,
  QrCode,
  BarChart3,
  FileSpreadsheet,
  Settings,
  X,
  MessageSquare,
  LogOut,
  Home,
  PackagePlus,
  Search,
} from 'lucide-react';

interface SidebarProps {
  role?: 'GUARD' | 'ADMIN';
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  isHovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = 'ADMIN',
  mobileOpen = false,
  onCloseMobile,
  isHovered: controlledHovered,
  onHoverChange,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [internalHovered, setInternalHovered] = useState(false);
  const [showWaSim, setShowWaSim] = useState(false);
  const isHovered = controlledHovered !== undefined ? controlledHovered : internalHovered;

  const handleMouseEnter = () => {
    setInternalHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setInternalHovered(false);
    onHoverChange?.(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = role === 'GUARD'
    ? (user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'RK')
    : (user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'VM');

  const displayName = user?.name || (role === 'GUARD' ? 'Rajesh Kumar' : 'Dr. Vikram Malhotra');
  const roleSubtitle = role === 'GUARD'
    ? `Security Guard • ${user?.guard?.badgeNumber || 'GD-001'}`
    : 'Administrator';

  // Styling helper for desktop links
  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center h-10 rounded-xl text-xs font-semibold transition-colors mx-3 select-none relative group ${
      isActive
        ? 'bg-[#FBEAEC] text-[#A6192E] font-bold border border-[#F5C6CB] shadow-2xs'
        : 'text-[#344054] hover:text-[#172033] hover:bg-[#FFF6F7]'
    }`;

  // Styling helper for mobile drawer links
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold min-h-[44px] transition-all ${
      isActive
        ? 'bg-[#FBEAEC] text-[#A6192E] font-bold border-l-4 border-[#A6192E] shadow-xs'
        : 'text-[#344054] hover:text-[#172033] hover:bg-[#FFF6F7]'
    }`;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR: Continuous left rail from the very top of viewport    */}
      {/* ========================================================================= */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden md:flex flex-col shrink-0 h-full bg-white border-r border-[#E6E8EC] transition-[width] duration-[380ms] ease-in-out select-none overflow-x-hidden z-20 ${
          isHovered ? 'w-[260px]' : 'w-[72px]'
        }`}
        style={{
          width: isHovered ? '260px' : '72px',
          willChange: 'width',
        }}
      >
        {/* Top Unified Branding Section (h-14 / 56px) with Role Badge */}
        <div className="h-14 border-b border-[#E6E8EC] flex items-center shrink-0 overflow-hidden bg-white select-none">
          {/* Collapsed icon-rail center mark */}
          <div className="w-[72px] h-14 flex items-center justify-center shrink-0">
            <RishihoodLogo variant="mark-only" size="sm" />
          </div>
          {/* Expanded full brand + Role badge */}
          <div
            className={`flex items-center space-x-2 truncate whitespace-nowrap transition-all duration-[380ms] ease-in-out ${
              isHovered
                ? 'opacity-100 max-w-[180px] translate-x-0'
                : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-black tracking-wider uppercase text-[#A6192E] leading-none">
                RISHIHOOD
              </span>
              <span className="text-xs font-bold text-[#172033] tracking-tight leading-tight mt-0.5">
                RishiDrop
              </span>
            </div>
            <span
              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${
                role === 'GUARD'
                  ? 'bg-[#F0FDF4] text-[#16865B] border border-[#DCFCE7]'
                  : 'bg-[#FBEAEC] text-[#A6192E] border border-[#F5C6CB]'
              }`}
            >
              {role === 'GUARD' ? 'GUARD' : 'ADMIN'}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar py-3.5 space-y-2.5">
          {role === 'GUARD' ? (
            <>
              {/* Home */}
              <div>
                <NavLink to="/guard" end className={desktopLinkClass} title="Home">
                  <div className="w-12 h-10 flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5 text-inherit shrink-0" />
                  </div>
                  <span
                    className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                      isHovered
                        ? 'opacity-100 max-w-[170px] translate-x-0 font-bold'
                        : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                    }`}
                  >
                    Home
                  </span>
                </NavLink>
              </div>

              {/* Operations Section */}
              <div className="space-y-1">
                <div className="pt-1.5 pb-0.5">
                  {isHovered ? (
                    <div className="px-4 text-[10px] font-bold uppercase tracking-wider text-[#667085] whitespace-nowrap transition-opacity duration-[350ms] animate-fade-in">
                      Operations
                    </div>
                  ) : (
                    <div className="mx-3.5 border-t border-slate-100" />
                  )}
                </div>

                <NavLink to="/guard/receive" className={desktopLinkClass} title="Receive Parcel">
                  <div className="w-12 h-10 flex items-center justify-center shrink-0">
                    <PackagePlus className="w-5 h-5 text-inherit shrink-0" />
                  </div>
                  <span
                    className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                      isHovered
                        ? 'opacity-100 max-w-[170px] translate-x-0'
                        : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                    }`}
                  >
                    Receive Parcel
                  </span>
                </NavLink>

                <NavLink to="/guard/pickup" className={desktopLinkClass} title="Handover / Scan QR">
                  <div className="w-12 h-10 flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5 text-inherit shrink-0" />
                  </div>
                  <span
                    className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                      isHovered
                        ? 'opacity-100 max-w-[170px] translate-x-0'
                        : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                    }`}
                  >
                    Handover / Scan QR
                  </span>
                </NavLink>

                <NavLink to="/guard/search" className={desktopLinkClass} title="Search Student">
                  <div className="w-12 h-10 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-inherit shrink-0" />
                  </div>
                  <span
                    className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                      isHovered
                        ? 'opacity-100 max-w-[170px] translate-x-0'
                        : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                    }`}
                  >
                    Search Student
                  </span>
                </NavLink>
              </div>

              {/* Storage Section */}
              <div className="space-y-1">
                <div className="pt-1.5 pb-0.5">
                  {isHovered ? (
                    <div className="px-4 text-[10px] font-bold uppercase tracking-wider text-[#667085] whitespace-nowrap transition-opacity duration-[350ms] animate-fade-in">
                      Storage
                    </div>
                  ) : (
                    <div className="mx-3.5 border-t border-slate-100" />
                  )}
                </div>

                <NavLink to="/guard/storage" className={desktopLinkClass} title="Storage Racks">
                  <div className="w-12 h-10 flex items-center justify-center shrink-0">
                    <Box className="w-5 h-5 text-inherit shrink-0" />
                  </div>
                  <span
                    className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                      isHovered
                        ? 'opacity-100 max-w-[170px] translate-x-0'
                        : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                    }`}
                  >
                    Storage Racks
                  </span>
                </NavLink>
              </div>

              {/* Account Section */}
              <div className="space-y-1">
                <div className="pt-1.5 pb-0.5">
                  {isHovered ? (
                    <div className="px-4 text-[10px] font-bold uppercase tracking-wider text-[#667085] whitespace-nowrap transition-opacity duration-[350ms] animate-fade-in">
                      Account
                    </div>
                  ) : (
                    <div className="mx-3.5 border-t border-slate-100" />
                  )}
                </div>

                <NavLink to="/guard/profile" className={desktopLinkClass} title="Profile">
                  <div className="w-12 h-10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-inherit shrink-0" />
                  </div>
                  <span
                    className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                      isHovered
                        ? 'opacity-100 max-w-[170px] translate-x-0'
                        : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                    }`}
                  >
                    Profile
                  </span>
                </NavLink>
              </div>
            </>
          ) : (
            <>
              {/* Command Center */}
              <div>
                <NavLink to="/admin" end className={desktopLinkClass} title="Command Center">
                  <div className="w-12 h-10 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="w-5 h-5 text-inherit shrink-0" />
                  </div>
                  <span
                    className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                      isHovered
                        ? 'opacity-100 max-w-[170px] translate-x-0 font-bold'
                        : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                    }`}
                  >
                    Command Center
                  </span>
                </NavLink>
              </div>

          {/* Operations Section */}
          <div className="space-y-1">
            <div className="pt-1.5 pb-0.5">
              {isHovered ? (
                <div className="px-4 text-[10px] font-bold uppercase tracking-wider text-[#667085] whitespace-nowrap transition-opacity duration-[350ms] animate-fade-in">
                  Operations
                </div>
              ) : (
                <div className="mx-3.5 border-t border-slate-100" />
              )}
            </div>

            <NavLink to="/admin/deliveries" className={desktopLinkClass} title="Deliveries">
              <div className="w-12 h-10 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-inherit shrink-0" />
              </div>
              <span
                className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                  isHovered
                    ? 'opacity-100 max-w-[170px] translate-x-0'
                    : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                }`}
              >
                Deliveries
              </span>
            </NavLink>

            <NavLink to="/admin/students" className={desktopLinkClass} title="Students">
              <div className="w-12 h-10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-inherit shrink-0" />
              </div>
              <span
                className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                  isHovered
                    ? 'opacity-100 max-w-[170px] translate-x-0'
                    : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                }`}
              >
                Students
              </span>
            </NavLink>

            <NavLink to="/admin/pickups" className={desktopLinkClass} title="Handover Ledger">
              <div className="w-12 h-10 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-inherit shrink-0" />
              </div>
              <span
                className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                  isHovered
                    ? 'opacity-100 max-w-[170px] translate-x-0'
                    : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                }`}
              >
                Handover Ledger
              </span>
            </NavLink>
          </div>

          {/* People Section */}
          <div className="space-y-1">
            <div className="pt-1.5 pb-0.5">
              {isHovered ? (
                <div className="px-4 text-[10px] font-bold uppercase tracking-wider text-[#667085] whitespace-nowrap transition-opacity duration-[350ms] animate-fade-in">
                  People
                </div>
              ) : (
                <div className="mx-3.5 border-t border-slate-100" />
              )}
            </div>

            <NavLink to="/admin/guards" className={desktopLinkClass} title="Guards">
              <div className="w-12 h-10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-inherit shrink-0" />
              </div>
              <span
                className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                  isHovered
                    ? 'opacity-100 max-w-[170px] translate-x-0'
                    : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                }`}
              >
                Guards
              </span>
            </NavLink>
          </div>

          {/* Storage Section */}
          <div className="space-y-1">
            <div className="pt-1.5 pb-0.5">
              {isHovered ? (
                <div className="px-4 text-[10px] font-bold uppercase tracking-wider text-[#667085] whitespace-nowrap transition-opacity duration-[350ms] animate-fade-in">
                  Storage
                </div>
              ) : (
                <div className="mx-3.5 border-t border-slate-100" />
              )}
            </div>

            <NavLink to="/admin/storage" className={desktopLinkClass} title="Storage Racks">
              <div className="w-12 h-10 flex items-center justify-center shrink-0">
                <Box className="w-5 h-5 text-inherit shrink-0" />
              </div>
              <span
                className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                  isHovered
                    ? 'opacity-100 max-w-[170px] translate-x-0'
                    : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                }`}
              >
                Storage Racks
              </span>
            </NavLink>
          </div>

          {/* Analytics Section */}
          <div className="space-y-1">
            <div className="pt-1.5 pb-0.5">
              {isHovered ? (
                <div className="px-4 text-[10px] font-bold uppercase tracking-wider text-[#667085] whitespace-nowrap transition-opacity duration-[350ms] animate-fade-in">
                  Analytics
                </div>
              ) : (
                <div className="mx-3.5 border-t border-slate-100" />
              )}
            </div>

            <NavLink to="/admin/analytics" className={desktopLinkClass} title="Analytics & AI">
              <div className="w-12 h-10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-inherit shrink-0" />
              </div>
              <span
                className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                  isHovered
                    ? 'opacity-100 max-w-[170px] translate-x-0'
                    : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                }`}
              >
                Analytics & AI
              </span>
            </NavLink>

            <NavLink to="/admin/reports" className={desktopLinkClass} title="Reports">
              <div className="w-12 h-10 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-inherit shrink-0" />
              </div>
              <span
                className={`truncate whitespace-nowrap transition-all duration-[350ms] ease-in-out ${
                  isHovered
                    ? 'opacity-100 max-w-[170px] translate-x-0'
                    : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                }`}
              >
                Reports
              </span>
            </NavLink>
          </div>

          {/* Settings Section */}
          <div className="pt-2 border-t border-[#E6E8EC]">
            <NavLink to="/admin/settings" className={desktopLinkClass} title="Settings">
              <div className="w-12 h-10 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-inherit shrink-0" />
              </div>
              <span
                className={`truncate whitespace-nowrap transition-all duration-[380ms] ease-in-out ${
                  isHovered
                    ? 'opacity-100 max-w-[170px] translate-x-0'
                    : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                }`}
              >
                Settings
              </span>
            </NavLink>
          </div>
        </>
      )}

        </div>

        {/* Desktop Bottom Utility & Profile Section */}
        <div className="border-t border-[#E6E8EC] p-3 space-y-2 shrink-0 bg-white">
          {/* WhatsApp Simulator Launch Button */}
          <button
            type="button"
            onClick={() => setShowWaSim(true)}
            className={`w-full flex items-center rounded-xl text-xs font-semibold transition-colors bg-[#F0FDF4] text-[#16865B] border border-[#DCFCE7] hover:bg-[#DCFCE7] cursor-pointer ${
              isHovered ? 'px-3 py-2 space-x-2.5' : 'h-10 justify-center px-0'
            }`}
            title="Open WhatsApp Bot Simulator"
          >
            <MessageSquare className="w-4 h-4 shrink-0 text-[#16865B]" />
            <span
              className={`truncate whitespace-nowrap transition-all duration-[380ms] ease-in-out ${
                isHovered
                  ? 'opacity-100 max-w-[170px] translate-x-0'
                  : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
              }`}
            >
              WhatsApp Bot
            </span>
          </button>

          {/* User Profile & Logout */}
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
            {!isHovered ? (
              <div className="w-full flex flex-col items-center space-y-1.5 py-0.5">
                <div
                  className="w-8 h-8 rounded-full bg-[#FBEAEC] text-[#A6192E] font-bold text-[11px] flex items-center justify-center border border-[#F5C6CB]"
                  title={`${displayName} (${roleSubtitle})`}
                >
                  {initials}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-[#667085] hover:text-[#A6192E] hover:bg-[#FFF6F7] rounded-lg transition-colors cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between py-0.5">
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="w-8 h-8 rounded-full bg-[#FBEAEC] text-[#A6192E] font-bold text-[11px] flex items-center justify-center border border-[#F5C6CB] shrink-0">
                    {initials}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-[#172033] truncate">
                      {displayName}
                    </div>
                    <div className="text-[10px] text-[#667085] truncate">
                      {roleSubtitle}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-[#667085] hover:text-[#A6192E] hover:bg-[#FFF6F7] rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE SIDEBAR: Slide-in Drawer with Touch Friendly Backdrop           */}
      {/* ========================================================================= */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fadeIn cursor-pointer"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <aside className="relative z-50 w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col border-r border-slate-200 animate-slideInLeft">
            
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-[#E6E8EC] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RishihoodLogo variant="compact" size="sm" />
                <span
                  className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    role === 'GUARD'
                      ? 'bg-[#F0FDF4] text-[#16865B] border border-[#DCFCE7]'
                      : 'bg-[#FBEAEC] text-[#A6192E] border border-[#F5C6CB]'
                  }`}
                >
                  {role === 'GUARD' ? 'GUARD' : 'ADMIN'}
                </span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {role === 'GUARD' ? (
                <>
                  {/* Home */}
                  <div>
                    <NavLink to="/guard" end className={mobileLinkClass} onClick={onCloseMobile}>
                      <Home className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Home</span>
                    </NavLink>
                  </div>

                  {/* Operations */}
                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                      Operations
                    </div>
                    <NavLink to="/guard/receive" className={mobileLinkClass} onClick={onCloseMobile}>
                      <PackagePlus className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Receive Parcel</span>
                    </NavLink>
                    <NavLink to="/guard/pickup" className={mobileLinkClass} onClick={onCloseMobile}>
                      <QrCode className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Handover / Scan QR</span>
                    </NavLink>
                    <NavLink to="/guard/search" className={mobileLinkClass} onClick={onCloseMobile}>
                      <Search className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Search Student</span>
                    </NavLink>
                  </div>

                  {/* Storage */}
                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                      Storage
                    </div>
                    <NavLink to="/guard/storage" className={mobileLinkClass} onClick={onCloseMobile}>
                      <Box className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Storage Racks</span>
                    </NavLink>
                  </div>

                  {/* Account */}
                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                      Account
                    </div>
                    <NavLink to="/guard/profile" className={mobileLinkClass} onClick={onCloseMobile}>
                      <Shield className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Profile</span>
                    </NavLink>
                  </div>
                </>
              ) : (
                <>
                  {/* Command Center */}
                  <div>
                    <NavLink to="/admin" end className={mobileLinkClass} onClick={onCloseMobile}>
                      <LayoutDashboard className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Command Center</span>
                    </NavLink>
                  </div>

                  {/* Operations */}
                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                      Operations
                    </div>
                    <NavLink to="/admin/deliveries" className={mobileLinkClass} onClick={onCloseMobile}>
                      <Truck className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Deliveries</span>
                    </NavLink>
                    <NavLink to="/admin/students" className={mobileLinkClass} onClick={onCloseMobile}>
                      <Users className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Students</span>
                    </NavLink>
                    <NavLink to="/admin/pickups" className={mobileLinkClass} onClick={onCloseMobile}>
                      <QrCode className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Handover Ledger</span>
                    </NavLink>
                  </div>

                  {/* People */}
                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                      People
                    </div>
                    <NavLink to="/admin/guards" className={mobileLinkClass} onClick={onCloseMobile}>
                      <Shield className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Guards</span>
                    </NavLink>
                  </div>

                  {/* Storage */}
                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                      Storage
                    </div>
                    <NavLink to="/admin/storage" className={mobileLinkClass} onClick={onCloseMobile}>
                      <Box className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Storage Racks</span>
                    </NavLink>
                  </div>

                  {/* Analytics */}
                  <div className="space-y-1">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                      Analytics
                    </div>
                    <NavLink to="/admin/analytics" className={mobileLinkClass} onClick={onCloseMobile}>
                      <BarChart3 className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Analytics & AI</span>
                    </NavLink>
                    <NavLink to="/admin/reports" className={mobileLinkClass} onClick={onCloseMobile}>
                      <FileSpreadsheet className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Reports</span>
                    </NavLink>
                  </div>

                  {/* Settings */}
                  <div className="pt-2 border-t border-[#E6E8EC]">
                    <NavLink to="/admin/settings" className={mobileLinkClass} onClick={onCloseMobile}>
                      <Settings className="w-4 h-4 shrink-0 text-inherit" />
                      <span>Settings</span>
                    </NavLink>
                  </div>
                </>
              )}

              {/* Mobile Actions: WhatsApp Bot & Logout */}
              <div className="pt-3 border-t border-[#E6E8EC] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onCloseMobile?.();
                    setShowWaSim(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#F0FDF4] text-[#16865B] border border-[#DCFCE7]"
                >
                  <MessageSquare className="w-4 h-4 shrink-0 text-[#16865B]" />
                  <span>WhatsApp Bot Simulator</span>
                </button>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FBEAEC] text-[#A6192E] font-bold text-[11px] flex items-center justify-center border border-[#F5C6CB]">
                      {initials}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#172033] truncate">
                        {displayName}
                      </div>
                      <div className="text-[10px] text-[#667085] truncate">{roleSubtitle}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 text-[#667085] hover:text-[#A6192E] rounded-lg cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </aside>
        </div>
      )}

      {/* WhatsApp Simulator Modal */}
      <WhatsAppSimulatorModal
        isOpen={showWaSim}
        onClose={() => setShowWaSim(false)}
      />
    </>
  );
};

export default Sidebar;
