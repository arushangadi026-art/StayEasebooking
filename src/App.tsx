import { useState, useCallback } from 'react';
import { Navbar, type PageRoute } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastBanner, type ToastMessage } from './components/ToastBanner';
import { HomePage, type SearchQueryParams } from './pages/HomePage';
import { HotelsPage } from './pages/HotelsPage';
import { HotelDetailsPage } from './pages/HotelDetailsPage';
import { RoomsPage } from './pages/RoomsPage';
import { EventsPage } from './pages/EventsPage';
import { ContactPage } from './pages/ContactPage';
import { AcademicLabsPage } from './pages/AcademicLabsPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { apiRequest, setAuthToken } from './lib/api';
import type { PublicUser, RoomCategoryName } from '../shared/types';

export default function App() {
  const [page, setPage] = useState<PageRoute>('home');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('htl_01');
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<'All' | RoomCategoryName>('All');
  const [searchQuery, setSearchQuery] = useState<SearchQueryParams | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = useCallback((type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToast({ id, type, text });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 5000);
  }, []);

  const handleNavigate = useCallback(
    (target: PageRoute) => {
      if (target === 'dashboard' && !user) {
        notify('error', 'Please sign in to access your Customer Dashboard.');
        setPage('login');
        return;
      }
      if (target === 'admin' && user?.role !== 'admin') {
        notify('error', 'Administrator sign-in is required to access the Admin Dashboard.');
        setPage('login');
        return;
      }
      if (target === 'rooms') {
        setSelectedRoomCategory('All');
      }
      setPage(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [user, notify]
  );

  const handleSelectHotel = useCallback((hotelId: string) => {
    setSelectedHotelId(hotelId);
    setPage('hotel-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectRoomCategory = useCallback((category: string) => {
    setSelectedRoomCategory(category as RoomCategoryName);
    setPage('rooms');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearchHotels = useCallback((params: SearchQueryParams) => {
    setSearchQuery(params);
    setPage('hotels');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore if session already expired
    }
    setAuthToken(null);
    setUser(null);
    notify('success', 'You have been signed out safely.');
    setPage('home');
  }, [notify]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#2D1D14]">
      <Navbar
        currentPage={page}
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            onSearchHotels={handleSearchHotels}
            onSelectHotel={handleSelectHotel}
            onSelectRoomCategory={handleSelectRoomCategory}
            onNavigate={handleNavigate}
          />
        )}

        {page === 'hotels' && (
          <HotelsPage initialQuery={searchQuery} onSelectHotel={handleSelectHotel} />
        )}

        {page === 'hotel-details' && (
          <HotelDetailsPage
            hotelId={selectedHotelId}
            user={user}
            defaultDates={
              searchQuery
                ? { checkIn: searchQuery.checkIn, checkOut: searchQuery.checkOut }
                : undefined
            }
            onBack={() => handleNavigate('hotels')}
            onNavigate={handleNavigate}
            onNotify={notify}
          />
        )}

        {page === 'rooms' && (
          <RoomsPage
            initialCategory={selectedRoomCategory}
            onSelectHotel={handleSelectHotel}
          />
        )}

        {page === 'events' && <EventsPage user={user} onNotify={notify} />}

        {(page === 'contact' || page === 'about') && <ContactPage onNotify={notify} />}

        {page === 'labs' && <AcademicLabsPage />}

        {page === 'login' && (
          <LoginPage
            onAuthSuccess={setUser}
            onNavigate={handleNavigate}
            onNotify={notify}
          />
        )}

        {page === 'register' && (
          <RegisterPage
            onAuthSuccess={setUser}
            onNavigate={handleNavigate}
            onNotify={notify}
          />
        )}

        {page === 'dashboard' && user && (
          <CustomerDashboardPage
            user={user}
            onUserUpdated={setUser}
            onSelectHotel={handleSelectHotel}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            onNotify={notify}
          />
        )}

        {page === 'admin' && user?.role === 'admin' && (
          <AdminDashboardPage onNotify={notify} />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
