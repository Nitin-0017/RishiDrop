import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RishihoodLogo } from './RishihoodLogo';
import {
  LogOut,
  MessageSquare,
  Menu,
} from 'lucide-react';
import { WhatsAppSimulatorModal } from './WhatsAppSimulatorModal';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showWaSim, setShowWaSim] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E6E8EC] shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            
            {/* Left: Mobile Toggle & Brand Logo */}
            <div className="flex items-center space-x-3">
              {onToggleMobileSidebar && (
                <button
                  type="button"
                  onClick={onToggleMobileSidebar}
                  className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors md:hidden cursor-pointer"
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <Link to="/admin" className="flex items-center space-x-2.5">
                <RishihoodLogo variant="compact" size="sm" />
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#FBEAEC] text-[#A6192E] border border-[#F5C6CB] ml-1">
                  ADMIN
                </span>
              </Link>
            </div>

            {/* Right Admin Profile & Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              
              {/* WhatsApp Simulator Tool */}
              <button
                type="button"
                onClick={() => setShowWaSim(true)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold bg-[#F0FDF4] text-[#16865B] border border-[#DCFCE7] hover:bg-[#DCFCE7] transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp Bot</span>
              </button>

              {/* Admin Profile Info */}
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-[#172033]">
                  {user?.name || 'Dr. Vikram Malhotra'}
                </div>
                <div className="text-[10px] text-[#667085]">
                  Administrator
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center space-x-1 px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold text-[#667085] hover:text-[#A6192E] hover:bg-[#FFF6F7] transition-colors cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* WhatsApp Simulator Modal */}
      <WhatsAppSimulatorModal
        isOpen={showWaSim}
        onClose={() => setShowWaSim(false)}
      />
    </>
  );
};

export default Navbar;
