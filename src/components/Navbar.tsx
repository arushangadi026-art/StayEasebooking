import { useState } from 'react';
import { Menu, X, User as UserIcon, Shield, LogOut } from 'lucide-react';
import type { PublicUser } from '../../shared/types';

export type PageRoute =
  | 'home'
  | 'hotels'
  | 'hotel-details'
  | 'rooms'
  | 'events'
  | 'about'
  | 'contact'
  | 'labs'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'admin';

interface NavbarProps {
  currentPage: PageRoute;
  user: PublicUser | null;
  onNavigate: (page: PageRoute) => void;
  onLogout: () => void;
}

export function Navbar({ currentPage, user, onNavigate, onLogout }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks: { label: string; page: PageRoute }[] = [
    { label: 'Home', page: 'home' },
    { label: 'Explore Hotels', page: 'hotels' },
    { label: 'Rooms', page: 'rooms' },
    { label: 'Events', page: 'events' },
    { label: 'Docs & Labs', page: 'labs' },
    { label: 'Contact', page: 'contact' },
  ];

  const handleNav = (page: PageRoute) => {
    onNavigate(page);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E4D7C5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand wordmark (single line, no clutter) */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-display text-2xl font-bold tracking-tight text-[#2D1D14] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A66A38] rounded"
        >
          STAYEASE
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium"
        >
          {navLinks.map((item) => {
            const active =
              currentPage === item.page ||
              (item.page === 'hotels' && currentPage === 'hotel-details');
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => handleNav(item.page)}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  active
                    ? 'text-[#2D1D14] border-[#A66A38]'
                    : 'text-[#6A5344] border-transparent hover:text-[#2D1D14] hover:border-[#D9C7B2]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Account Action */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {!user ? (
            <>
              <button
                type="button"
                onClick={() => handleNav('login')}
                className="px-3.5 py-2 text-sm font-medium text-[#4A3426] hover:text-[#2D1D14] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleNav('register')}
                className="px-4 py-2 text-sm font-semibold text-[#FAF6F0] bg-[#2D1D14] hover:bg-[#4A3426] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleNav(user.role === 'admin' ? 'admin' : 'dashboard')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#FAF6F0] bg-[#2D1D14] hover:bg-[#4A3426] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {user.role === 'admin' ? (
                  <Shield className="w-4 h-4 text-[#E6B88A]" />
                ) : (
                  <UserIcon className="w-4 h-4 text-[#E6B88A]" />
                )}
                <span className="max-w-[140px] truncate">
                  {user.role === 'admin' ? 'Admin Panel' : user.fullName.split(' ')[0]}
                </span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-2 text-[#6A5344] hover:text-[#2D1D14] hover:bg-[#F2EAE0] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2.5 text-[#2D1D14] hover:bg-[#F2EAE0] rounded-lg transition-colors cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#FFFDF9] border-t border-[#E4D7C5] px-4 py-4 space-y-2">
          {navLinks.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => handleNav(item.page)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === item.page
                  ? 'bg-[#F2EAE0] text-[#2D1D14]'
                  : 'text-[#5A4334] hover:bg-[#FAF6F0]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-3 mt-2 border-t border-[#E4D7C5] flex flex-wrap gap-2">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-[#D9C7B2] rounded-lg text-[#2D1D14]"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('register')}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-[#2D1D14] text-[#FAF6F0] rounded-lg"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNav(user.role === 'admin' ? 'admin' : 'dashboard')}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-[#2D1D14] text-[#FAF6F0] rounded-lg"
                >
                  {user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="px-4 py-2.5 text-sm font-medium border border-[#D9C7B2] rounded-lg text-[#4A3426]"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
