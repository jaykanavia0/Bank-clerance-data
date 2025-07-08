import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, memo } from 'react';
import {
  Menu,
  X,
  Github,
  BarChart3,
  User,
  Settings,
  Users,
  ChevronDown,
  Search,
  Bell,
  Zap,
  Moon,
  Sun,
  Star,
  Building,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

const NavItem = memo(({ to, label, Icon, isScrolled, onClick, isActive = false, hasDropdown = false, children }) => (
  <li className="relative group">
    {hasDropdown ? (
      <div className="relative">
        <button
          className={`relative flex items-center gap-2 text-sm font-semibold px-3 lg:px-4 py-2.5 rounded-2xl transition-all duration-300 group overflow-hidden transform hover:scale-105 active:scale-95 ${
            isActive
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
              : isScrolled
              ? 'text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md'
              : 'text-white hover:bg-white/20 backdrop-blur-sm hover:shadow-lg'
          }`}
        >
          {/* Animated background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${!isActive ? 'group-hover:animate-pulse' : ''}`} />
          
          {/* Icon with rotation on hover */}
          <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">
            <Icon size={16} lg:size={18} className={isActive ? 'drop-shadow-sm' : ''} />
          </div>
          
          <span className="relative z-10 hidden sm:inline">{label}</span>
          
          {/* Dropdown arrow */}
          <ChevronDown size={12} className={`relative z-10 transition-transform duration-300 group-hover:rotate-180 ${
            isScrolled ? 'text-slate-600' : 'text-white/80'
          }`} />
          
          {/* Active indicator */}
          {isActive && (
            <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 animate-pulse" />
          )}
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transform -skew-x-12 transition-opacity duration-500" />
        </button>
        
        {/* Dropdown Menu */}
        <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0">
          <div className="py-2">
            {children}
          </div>
        </div>
      </div>
    ) : (
      <Link
        to={to}
        onClick={onClick}
        className={`relative flex items-center gap-2 text-sm font-semibold px-3 lg:px-4 py-2.5 rounded-2xl transition-all duration-300 group overflow-hidden transform hover:scale-105 active:scale-95 ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
            : isScrolled
            ? 'text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md'
            : 'text-white hover:bg-white/20 backdrop-blur-sm hover:shadow-lg'
        }`}
      >
        {/* Animated background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${!isActive ? 'group-hover:animate-pulse' : ''}`} />
        
        {/* Icon with rotation on hover */}
        <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">
          <Icon size={16} lg:size={18} className={isActive ? 'drop-shadow-sm' : ''} />
        </div>
        
        <span className="relative z-10 hidden sm:inline">{label}</span>
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 animate-pulse" />
        )}
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transform -skew-x-12 transition-opacity duration-500" />
      </Link>
    )}
  </li>
));

const DropdownItem = memo(({ to, label, Icon, description }) => (
  <Link
    to={to}
    className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200 group"
  >
    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-200">
      <Icon size={16} className="text-purple-600" />
    </div>
    <div className="flex-1">
      <div className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">{label}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  </Link>
));

const MobileNavItem = memo(({ to, label, Icon, onClick, isActive = false, hasDropdown = false, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (hasDropdown) {
    return (
      <li className="overflow-hidden relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl transition-all duration-300 group transform hover:scale-[1.02] hover:translate-x-2 active:scale-98 ${
            isActive
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl transition-all duration-300 transform group-hover:rotate-12 ${
              isActive 
                ? 'bg-white/20' 
                : 'bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200'
            }`}>
              <Icon size={20} className={isActive ? 'text-white' : 'text-blue-600'} />
            </div>
            <span className="font-semibold text-base">{label}</span>
          </div>
          <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="ml-4 mt-2 space-y-1">
            {children}
          </div>
        )}
      </li>
    );
  }
  
  return (
    <li className="overflow-hidden relative group">
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group transform hover:scale-[1.02] hover:translate-x-2 active:scale-98 ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
            : 'text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md'
        }`}
      >
        <div className={`p-2 rounded-xl transition-all duration-300 transform group-hover:rotate-12 ${
          isActive 
            ? 'bg-white/20' 
            : 'bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200'
        }`}>
          <Icon size={20} className={isActive ? 'text-white' : 'text-blue-600'} />
        </div>
        <span className="font-semibold text-base">{label}</span>
        
        {/* Arrow indicator */}
        <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <ChevronDown size={16} className="rotate-[-90deg]" />
        </div>
      </Link>
    </li>
  );
});

const MobileDropdownItem = memo(({ to, label, Icon, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 p-3 ml-6 rounded-xl hover:bg-purple-50 transition-colors text-sm"
  >
    <Icon size={16} className="text-purple-600" />
    <span className="text-gray-700">{label}</span>
  </Link>
));

const SearchBar = memo(({ isScrolled }) => (
  <div className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
    isScrolled 
      ? 'bg-slate-100 border border-slate-200 hover:shadow-md' 
      : 'bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/25'
  }`}>
    <Search size={16} className={`transition-colors duration-300 ${isScrolled ? 'text-slate-500' : 'text-white/70'}`} />
    <input
      type="text"
      placeholder="Search anything..."
      className={`bg-transparent outline-none text-sm font-medium placeholder:font-normal w-32 xl:w-48 transition-colors duration-300 ${
        isScrolled ? 'text-slate-700 placeholder:text-slate-400' : 'text-white placeholder:text-white/60'
      }`}
    />
    <div className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-110 ${
      isScrolled ? 'bg-slate-200 text-slate-600' : 'bg-white/20 text-white/80'
    }`}>
      ⌘K
    </div>
  </div>
));

const UserAvatar = memo(({ isScrolled }) => (
  <div className="relative">
    <button className={`p-2 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
      isScrolled 
        ? 'bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 hover:shadow-md' 
        : 'bg-white/20 backdrop-blur-md hover:bg-white/30'
    }`}>
      <div className="w-6 h-6 md:w-8 md:h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
        <User size={14} md:size={18} className="text-white" />
      </div>
    </button>
    
    {/* Online indicator with pulse */}
    <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
  </div>
));

// Updated Header component with SEBI navigation
const Header = ({ notificationService }) => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasShadow, setHasShadow] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    setIsScrolled(scrollY > 20);
    setHasShadow(scrollY > 80);
  }, []);

  useEffect(() => {
    let lastScrollTime = 0;
    const debouncedHandleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime > 16) {
        handleScroll();
        lastScrollTime = now;
      }
    };

    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', debouncedHandleScroll);
  }, [handleScroll]);

  // Check if current path is under SEBI section
  const isSebiActive = location.pathname.startsWith('/sebi');

  const navItems = [
    { to: '/', label: 'Dashboard', Icon: BarChart3 },
    { to: '/contacts', label: 'Bank Contacts', Icon: Users },
    { 
      label: 'SEBI Services', 
      Icon: TrendingUp, 
      hasDropdown: true,
      isActive: isSebiActive,
      children: [
        { to: '/sebi/directory', label: 'Entity Directory', Icon: Building, description: 'Browse registered entities' },
        { to: '/sebi/routing', label: 'Issue Routing', Icon: FileText, description: 'Route SEBI concerns' }
      ]
    },
    { to: '/settings', label: 'Settings', Icon: Settings },
  ];

  // Mobile nav items
  const mobileNavItems = [
    { to: '/', label: 'Dashboard', Icon: BarChart3 },
    { to: '/contacts', label: 'Bank Contacts', Icon: Users },
    { 
      label: 'SEBI Services', 
      Icon: TrendingUp, 
      hasDropdown: true,
      isActive: isSebiActive,
      children: [
        { to: '/sebi/directory', label: 'Entity Directory', Icon: Building },
        { to: '/sebi/routing', label: 'Issue Routing', Icon: FileText }
      ]
    },
    { to: '/settings', label: 'Settings', Icon: Settings },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(147, 51, 234, 0.4), 0 0 40px rgba(59, 130, 246, 0.2); }
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 6s ease infinite;
        }
        @keyframes slideInFromRight {
          0% {
            opacity: 0;
            transform: translateX(50px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Premium Header */}
      <header
        className={`fixed w-full z-50 transition-all duration-500 transform ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/60 translate-y-0' 
            : 'bg-gradient-to-r from-blue-600/95 via-purple-600/95 to-indigo-600/95 backdrop-blur-lg translate-y-0'
        } ${hasShadow ? 'shadow-2xl shadow-blue-500/10' : ''}`}
        style={{
          background: !isScrolled 
            ? 'linear-gradient(-45deg, #3b82f6, #8b5cf6, #6366f1, #3b82f6)' 
            : undefined
        }}
      >
        {/* Ambient glow effect */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${
          isScrolled ? 'opacity-0' : 'opacity-100 animate-gradient'
        }`} 
        style={{
          background: 'linear-gradient(-45deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1), rgba(99,102,241,0.1), rgba(59,130,246,0.1))',
          backgroundSize: '400% 400%'
        }} />

        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4 flex justify-between items-center relative z-10">
          {/* Enhanced Logo */}
          <Link to="/" className="flex items-center space-x-2 md:space-x-3 group">
            <div className={`relative h-10 w-10 md:h-12 md:w-12 rounded-2xl md:rounded-3xl shadow-xl flex items-center justify-center overflow-hidden transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-12 group-active:scale-95 ${
              isScrolled 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 animate-glow' 
                : 'bg-white/20 backdrop-blur-md border border-white/30'
            }`}>
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 opacity-80" />
              
              {/* Logo text */}
              <span className="relative z-10 font-bold text-lg md:text-xl text-white drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                B
              </span>
              
              {/* Sparkle effect */}
              <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 transition-all duration-300 group-hover:scale-125">
                <Star size={6} md:size={8} className="text-yellow-300 animate-pulse" />
              </div>
            </div>
            
            <div className="flex flex-col transition-transform duration-300 group-hover:translate-x-2">
              <span className={`text-lg sm:text-xl md:text-2xl font-bold tracking-tight transition-all duration-300 ${
                isScrolled ? 'text-slate-800' : 'text-white drop-shadow-lg'
              }`}>
                Banking Router
              </span>
              <span className={`text-xs font-medium transition-all duration-300 hidden sm:block ${
                isScrolled ? 'text-slate-500' : 'text-white/70'
              }`}>
                Smart Financial Hub
              </span>
            </div>
          </Link>

          {/* Enhanced Navigation */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
            <ul className="flex gap-1">
              {navItems.map((item) => (
                <NavItem 
                  key={item.label} 
                  to={item.to} 
                  label={item.label} 
                  Icon={item.Icon} 
                  isScrolled={isScrolled}
                  isActive={item.hasDropdown ? item.isActive : location.pathname === item.to}
                  hasDropdown={item.hasDropdown}
                  onClick={() => {}}
                >
                  {item.children && item.children.map((child) => (
                    <DropdownItem
                      key={child.to}
                      to={child.to}
                      label={child.label}
                      Icon={child.Icon}
                      description={child.description}
                    />
                  ))}
                </NavItem>
              ))}
            </ul>
          </nav>

          {/* Enhanced Right Section */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search Bar */}
            <SearchBar isScrolled={isScrolled} />
            
            {/* Notifications */}
            <div className="hidden sm:block">
              {notificationService ? (
                <NotificationBell 
                  notificationService={notificationService} 
                  isScrolled={isScrolled} 
                />
              ) : (
                <div className={`p-2 md:p-2.5 rounded-2xl animate-pulse ${
                  isScrolled 
                    ? 'bg-slate-100' 
                    : 'bg-white/20 backdrop-blur-md'
                }`}>
                  <Bell size={16} className={isScrolled ? 'text-slate-400' : 'text-white/50'} />
                </div>
              )}
            </div>
            
            {/* User Avatar */}
            {/* <div className="hidden sm:block">
              <UserAvatar isScrolled={isScrolled} />
            </div> */}

            {/* Enhanced Mobile Menu Button */}
            <button
              className={`md:hidden p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                isScrolled 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:shadow-md' 
                  : 'bg-white/20 backdrop-blur-md hover:bg-white/30 text-white'
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <div className={`transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : 'rotate-0'}`}>
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Enhanced Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <nav
            className={`fixed top-0 right-0 h-full w-72 sm:w-80 z-50 bg-white/95 backdrop-blur-xl border-l border-slate-200 p-4 sm:p-6 md:hidden overflow-y-auto mobile-menu-container transition-transform duration-300 ${
              isMobileMenuOpen ? 'transform translate-x-0' : 'transform translate-x-full'
            }`}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg animate-glow">
                  <span className="font-bold text-white">B</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Banking Router</h3>
                  <p className="text-xs text-slate-500">Smart Financial Hub</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-300 transform hover:scale-105 hover:rotate-90 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Navigation */}
            <ul className="space-y-3 mb-6 sm:mb-8">
              {mobileNavItems.map((item, index) => (
                <div
                  key={item.label}
                  className="transition-all duration-300"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'slideInFromRight 0.5s ease-out forwards'
                  }}
                >
                  <MobileNavItem 
                    to={item.to} 
                    label={item.label} 
                    Icon={item.Icon} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    isActive={item.hasDropdown ? item.isActive : location.pathname === item.to}
                    hasDropdown={item.hasDropdown}
                  >
                    {item.children && item.children.map((child) => (
                      <MobileDropdownItem
                        key={child.to}
                        to={child.to}
                        label={child.label}
                        Icon={child.Icon}
                        onClick={() => setIsMobileMenuOpen(false)}
                      />
                    ))}
                  </MobileNavItem>
                </div>
              ))}
              
              {/* Mobile Notification Bell */}
              <div className="sm:hidden pt-3 border-t border-gray-200 mt-6">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <Bell size={16} className="text-blue-600" />
                    Notifications
                  </h4>
                  {notificationService && (
                    <div className="text-sm text-gray-600">
                      {notificationService.getUnreadCount()} unread notifications
                    </div>
                  )}
                </div>
              </div>
            </ul>

            {/* Mobile Footer */}
            <div className="mt-auto pt-4 sm:pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <UserAvatar isScrolled={true} />
                  <div>
                    <p className="font-semibold text-slate-800">Banking Team</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Star size={12} className="text-yellow-500" />
                      Premium User
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 transition-all duration-300 transform hover:scale-105 hover:rotate-180 active:scale-95 shadow-sm"
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
};

export default Header;