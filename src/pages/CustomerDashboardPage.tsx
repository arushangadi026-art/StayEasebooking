import { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Edit3, XCircle, Star, LogOut } from 'lucide-react';
import { apiRequest, formatINR } from '../lib/api';
import { buildCustomerBookingSummary } from '../utils/lab1GuestSummary';
import type { PublicUser, Booking } from '../../shared/types';
import type { PageRoute } from '../components/Navbar';

interface CustomerDashboardProps {
  user: PublicUser;
  onUserUpdated: (user: PublicUser) => void;
  onSelectHotel: (hotelId: string) => void;
  onNavigate: (page: PageRoute) => void;
  onLogout: () => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

const STATUS_STYLE: Record<Booking['status'], string> = {
  Confirmed: 'text-[#3A5A40]',
  Pending: 'text-[#B4690E]',
  Completed: 'text-[#4A3426]',
  Cancelled: 'text-[#9E3B33]',
};

export function CustomerDashboardPage({
  user,
  onUserUpdated,
  onSelectHotel,
  onNavigate,
  onLogout,
  onNotify,
}: CustomerDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  const [editingProfile, setEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [mobile, setMobile] = useState(user.mobile);
  const [city, setCity] = useState(user.city ?? 'Bengaluru');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadBookings = () => {
    setLoading(true);
    apiRequest<{ bookings: Booking[] }>('/api/bookings')
      .then((res) => setBookings(res.bookings))
      .catch((err: Error) => onNotify('error', err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // LAB 1 ES6 Destructuring + Arrow Functions + Array Methods + Template Literals
  const es6Summary = useMemo(
    () => buildCustomerBookingSummary(user, bookings),
    [user, bookings]
  );

  const filteredBookings = useMemo(() => {
    if (tab === 'upcoming') {
      return bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending');
    }
    if (tab === 'completed') {
      return bookings.filter((b) => b.status === 'Completed');
    }
    if (tab === 'cancelled') {
      return bookings.filter((b) => b.status === 'Cancelled');
    }
    return bookings;
  }, [bookings, tab]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await apiRequest<{ message: string; booking: Booking }>(
        `/api/bookings/${bookingId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'Cancelled' }),
        }
      );
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? res.booking : b)));
      onNotify('success', res.message);
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to cancel booking.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiRequest<{ message: string; user: PublicUser }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName, mobile, city }),
      });
      onUserUpdated(res.user);
      setEditingProfile(false);
      onNotify('success', res.message);
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Profile update failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  const upcomingCount = bookings.filter(
    (b) => b.status === 'Confirmed' || b.status === 'Pending'
  ).length;
  const completedCount = bookings.filter((b) => b.status === 'Completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'Cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E4D7C5]">
        <div>
          <p className="text-xs font-semibold text-[#A66A38] mb-1">Guest Account Dashboard</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14]">
            Welcome back, {user.fullName}
          </h1>
          <p className="text-sm text-[#6A5344] mt-1">{es6Summary.statsLine}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('hotels')}
            className="px-4 py-2 text-sm font-semibold bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] rounded-xl cursor-pointer whitespace-nowrap"
          >
            Book New Stay
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-[#D9C7B2] text-[#4A3426] hover:bg-[#F2EAE0] rounded-xl cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: String(bookings.length) },
          { label: 'Upcoming Stays', value: String(upcomingCount) },
          { label: 'Completed Stays', value: String(completedCount) },
          { label: 'Est. Demo Spend', value: formatINR(es6Summary.totalEstimatedSpend) },
        ].map((stat) => (
          <div key={stat.label} className="p-5 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl">
            <div className="text-xs text-[#8C7561] mb-1">{stat.label}</div>
            <div className="font-mono text-2xl font-semibold text-[#2D1D14] tabular-nums">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Profile & Lab 1 ES6 Summary */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-[#2D1D14]">My Profile</h2>
              <button
                type="button"
                onClick={() => setEditingProfile((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#A66A38] hover:text-[#2D1D14] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {editingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 bg-[#2D1D14] text-[#FAF6F0] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </form>
            ) : (
              <dl className="space-y-2.5 text-sm">
                <div>
                  <dt className="text-xs text-[#8C7561]">Full Name</dt>
                  <dd className="font-medium text-[#2D1D14]">{user.fullName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8C7561]">Email</dt>
                  <dd className="font-medium text-[#2D1D14]">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8C7561]">Mobile</dt>
                  <dd className="font-medium text-[#2D1D14]">{user.mobile}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8C7561]">Home City</dt>
                  <dd className="font-medium text-[#2D1D14]">{user.city ?? 'India'}</dd>
                </div>
              </dl>
            )}
          </div>

          {/* Lab 1 ES6 Live Integration Card */}
          <div className="bg-[#F2EAE0] border border-[#E4D7C5] rounded-2xl p-5 space-y-2">
            <div className="text-xs font-semibold text-[#A66A38]">
              Lab 1 ES6 Summary (Destructuring & Template Literals)
            </div>
            <div className="text-sm font-semibold text-[#2D1D14]">{es6Summary.headline}</div>
            <div className="text-xs text-[#5A4334]">{es6Summary.contactLine}</div>
            {es6Summary.activeDestinations.length > 0 && (
              <div className="text-xs text-[#6A5344] pt-1">
                Visited / Planned Cities: {es6Summary.activeDestinations.join(' · ')}
              </div>
            )}
          </div>
        </aside>

        {/* Right Bookings List */}
        <section className="lg:col-span-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-[#2D1D14]">My Bookings</h2>
            <div className="flex items-center gap-1 p-1 bg-[#F2EAE0] rounded-xl">
              {[
                { key: 'all', label: `All (${bookings.length})` },
                { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
                { key: 'completed', label: `Completed (${completedCount})` },
                { key: 'cancelled', label: `Cancelled (${cancelledCount})` },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key as typeof tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    tab === t.key
                      ? 'bg-[#FFFDF9] text-[#2D1D14] shadow-sm'
                      : 'text-[#6A5344] hover:text-[#2D1D14]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-48 bg-[#F2EAE0] rounded-2xl animate-pulse" />
          ) : filteredBookings.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-10 text-center">
              <p className="text-sm text-[#6A5344] mb-4">
                No bookings found in this category yet.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('hotels')}
                className="px-4 py-2 text-xs font-semibold bg-[#2D1D14] text-[#FAF6F0] rounded-xl cursor-pointer"
              >
                Explore Hotels
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((b) => (
                <article
                  key={b.id}
                  className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-[#8C7561] flex items-center gap-2">
                        <span className="font-mono font-semibold text-[#2D1D14]">{b.bookingRef}</span>
                        <span>·</span>
                        <span className={`font-semibold ${STATUS_STYLE[b.status]}`}>
                          Status: {b.status}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-semibold text-[#2D1D14] mt-1">
                        {b.hotelName}
                      </h3>
                      <div className="text-xs text-[#6A5344] flex flex-wrap items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#A66A38]" />
                          {b.hotelCity}
                        </span>
                        <span>{b.roomCategory}</span>
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#A66A38]" />
                          {b.checkIn} → {b.checkOut} ({b.pricing.nights} nights)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-semibold text-[#2D1D14] tabular-nums">
                        {formatINR(b.pricing.estimatedTotal)}
                      </div>
                      <div className="text-[11px] text-[#8C7561]">
                        {b.numRooms} room(s) · {b.guests} guest(s) · incl. 12% GST
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EFE5D8] flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-[#8C7561]">{b.paymentSummaryNote}</span>
                    <div className="flex items-center gap-2.5">
                      {(b.status === 'Confirmed' || b.status === 'Completed') && (
                        <button
                          type="button"
                          onClick={() => onSelectHotel(b.hotelId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-[#D9C7B2] text-[#2D1D14] hover:bg-[#F2EAE0] rounded-lg cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 text-[#A66A38]" />
                          Write Review
                        </button>
                      )}
                      {(b.status === 'Pending' || b.status === 'Confirmed') && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-[#DFB5AE] text-[#9E3B33] hover:bg-[#F9ECEA] rounded-lg cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
