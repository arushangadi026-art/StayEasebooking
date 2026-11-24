import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, Shield, CheckCircle2, Ban, Pencil, X } from 'lucide-react';
import { apiRequest, formatINR } from '../lib/api';
import type {
  AdminStats,
  Hotel,
  Room,
  Booking,
  PublicUser,
  ContactMessage,
  EventRegistration,
  HotelCategory,
  RoomCategoryName,
  BookingStatus,
} from '../../shared/types';

interface CustomerWithStats extends PublicUser {
  bookingCount: number;
  totalSpent: number;
}

interface AdminDashboardProps {
  onNotify: (type: 'success' | 'error', text: string) => void;
}

const HOTEL_CATEGORIES: HotelCategory[] = [
  'Budget',
  'Standard',
  'Premium',
  'Luxury',
  'Resort',
  'Boutique',
];

const ROOM_CATEGORIES: RoomCategoryName[] = [
  'Single Room',
  'Double Room',
  'Deluxe Room',
  'Premium Room',
  'Family Room',
  'Suite',
  'Executive Suite',
];

export function AdminDashboardPage({ onNotify }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'bookings' | 'hotels' | 'rooms' | 'customers' | 'inquiries'
  >('bookings');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<(Room & { hotelName?: string })[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [eventRegs, setEventRegs] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Hotel form
  const [hName, setHName] = useState('');
  const [hCity, setHCity] = useState('Bengaluru');
  const [hAddress, setHAddress] = useState('');
  const [hCategory, setHCategory] = useState<HotelCategory>('Luxury');
  const [hStars, setHStars] = useState<3 | 4 | 5>(5);
  const [hPrice, setHPrice] = useState(6500);
  const [hDesc, setHDesc] = useState('');

  // Add Room form
  const [rHotelId, setRHotelId] = useState('');
  const [rCategory, setRCategory] = useState<RoomCategoryName>('Deluxe Room');
  const [rPrice, setRPrice] = useState(5500);
  const [rInventory, setRInventory] = useState(5);
  const [rMaxGuests, setRMaxGuests] = useState(2);

  // Edit Hotel & Edit Room modals
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [editingRoom, setEditingRoom] = useState<(Room & { hotelName?: string }) | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, hRes, rRes, bRes, cRes, mRes, eRes] = await Promise.all([
        apiRequest<{ stats: AdminStats }>('/api/admin/stats'),
        apiRequest<{ hotels: Hotel[] }>('/api/hotels'),
        apiRequest<{ rooms: (Room & { hotelName?: string })[] }>('/api/rooms'),
        apiRequest<{ bookings: Booking[] }>('/api/bookings'),
        apiRequest<{ customers: CustomerWithStats[] }>('/api/admin/customers'),
        apiRequest<{ messages: ContactMessage[] }>('/api/contact'),
        apiRequest<{ registrations: EventRegistration[] }>('/api/events'),
      ]);
      setStats(sRes.stats);
      setHotels(hRes.hotels);
      setRooms(rRes.rooms);
      setBookings(bRes.bookings);
      setCustomers(cRes.customers);
      setMessages(mRes.messages);
      setEventRegs(eRes.registrations);
      setRHotelId((prev) => prev || hRes.hotels[0]?.id || '');
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ message: string }>('/api/hotels', {
        method: 'POST',
        body: JSON.stringify({
          name: hName,
          city: hCity,
          address: hAddress,
          category: hCategory,
          starCategory: hStars,
          startingPrice: hPrice,
          description: hDesc,
        }),
      });
      setHName('');
      setHAddress('');
      setHDesc('');
      onNotify('success', res.message);
      await loadAll();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to add hotel.');
    }
  };

  const handleToggleHotelAvailability = async (hotel: Hotel) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/hotels/${hotel.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: !hotel.isAvailable }),
      });
      onNotify('success', res.message);
      await loadAll();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleSaveEditHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    try {
      const res = await apiRequest<{ message: string }>(`/api/hotels/${editingHotel.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingHotel.name,
          city: editingHotel.city,
          address: editingHotel.address,
          category: editingHotel.category,
          starCategory: editingHotel.starCategory,
          startingPrice: editingHotel.startingPrice,
          description: editingHotel.description,
        }),
      });
      setEditingHotel(null);
      onNotify('success', res.message);
      await loadAll();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to update hotel.');
    }
  };

  const handleSaveEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      const res = await apiRequest<{ message: string }>(`/api/rooms/${editingRoom.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          category: editingRoom.category,
          pricePerNight: editingRoom.pricePerNight,
          totalInventory: editingRoom.totalInventory,
          maxGuests: editingRoom.maxGuests,
          description: editingRoom.description,
        }),
      });
      setEditingRoom(null);
      onNotify('success', res.message);
      await loadAll();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to update room.');
    }
  };

  const handleDeleteHotel = async (id: string) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/hotels/${id}`, {
        method: 'DELETE',
      });
      onNotify('success', res.message);
      await loadAll();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ message: string }>('/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          hotelId: rHotelId,
          category: rCategory,
          pricePerNight: rPrice,
          totalInventory: rInventory,
          maxGuests: rMaxGuests,
        }),
      });
      onNotify('success', res.message);
      await loadAll();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to add room.');
    }
  };

  const handleUpdateRoomQuick = async (
    room: Room,
    pricePerNight: number,
    totalInventory: number
  ) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/rooms/${room.id}`, {
        method: 'PUT',
        body: JSON.stringify({ pricePerNight, totalInventory }),
      });
      onNotify('success', res.message);
      await loadAll();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to update room.');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/rooms/${id}`, {
        method: 'DELETE',
      });
      onNotify('success', res.message);
      await loadAll();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to delete room.');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      onNotify('success', res.message);
      await loadAll();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  const handleToggleCustomer = async (cust: CustomerWithStats) => {
    try {
      const res = await apiRequest<{ message: string }>(
        `/api/admin/customers/${cust.id}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ isActive: !cust.isActive }),
        }
      );
      onNotify('success', res.message);
      await loadAll();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to update customer.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E4D7C5]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A66A38] mb-1">
            <Shield className="w-3.5 h-3.5" />
            Protected Administrator Console · Live JSON Persistence
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14]">
            STAYEASE Operations Dashboard
          </h1>
        </div>
        <button
          type="button"
          onClick={loadAll}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#FFFDF9] border border-[#D9C7B2] hover:bg-[#F2EAE0] text-[#2D1D14] rounded-xl cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh JSON Metrics
        </button>
      </div>

      {/* Live KPI Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Hotels', val: String(stats.totalHotels), sub: 'Fictional demo listings' },
            {
              label: 'Room Categories',
              val: String(stats.totalRooms),
              sub: `${stats.totalInventoryUnits} total room units`,
            },
            {
              label: 'Registered Customers',
              val: String(stats.totalCustomers),
              sub: 'Stored in users.json',
            },
            {
              label: 'Estimated Revenue',
              val: formatINR(stats.estimatedRevenue),
              sub: 'Sample demo INR total',
            },
            { label: 'Total Bookings', val: String(stats.totalBookings), sub: 'All statuses' },
            { label: 'Pending Bookings', val: String(stats.pendingBookings), sub: 'Awaiting action' },
            {
              label: 'Confirmed & Completed',
              val: `${stats.confirmedBookings} / ${stats.completedBookings}`,
              sub: 'Confirmed · Completed',
            },
            {
              label: 'Cancelled Bookings',
              val: String(stats.cancelledBookings),
              sub: `${stats.totalEventRegistrations} event signups`,
            },
          ].map((k) => (
            <div key={k.label} className="p-4 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl">
              <div className="text-xs text-[#8C7561]">{k.label}</div>
              <div className="font-mono text-2xl font-semibold text-[#2D1D14] tabular-nums mt-1">
                {k.val}
              </div>
              <div className="text-[11px] text-[#8C7561] mt-1">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#F2EAE0] rounded-xl w-fit">
        {[
          { key: 'bookings', label: `Bookings (${bookings.length})` },
          { key: 'hotels', label: `Hotels (${hotels.length})` },
          { key: 'rooms', label: `Rooms (${rooms.length})` },
          { key: 'customers', label: `Customers (${customers.length})` },
          { key: 'inquiries', label: `Messages & Events (${messages.length + eventRegs.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === t.key
                ? 'bg-[#2D1D14] text-[#FAF6F0]'
                : 'text-[#5A4334] hover:text-[#2D1D14]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F2EAE0] text-xs text-[#6A5344] border-b border-[#E4D7C5]">
                  <th className="py-3 px-4 font-semibold">Reference</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Hotel & Room</th>
                  <th className="py-3 px-4 font-semibold">Dates</th>
                  <th className="py-3 px-4 font-semibold text-right">Est. Total</th>
                  <th className="py-3 px-4 font-semibold">Status Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE5D8]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FAF6F0]/60">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-[#2D1D14]">
                      {b.bookingRef}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#2D1D14]">{b.customerName}</div>
                      <div className="text-xs text-[#8C7561]">{b.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#2D1D14]">{b.hotelName}</div>
                      <div className="text-xs text-[#8C7561]">
                        {b.roomCategory} · {b.numRooms} room(s)
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#4A3426]">
                      {b.checkIn} → {b.checkOut}
                    </td>
                    <td className="py-3 px-4 font-mono text-right font-semibold tabular-nums text-[#2D1D14]">
                      {formatINR(b.pricing.estimatedTotal)}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={b.status}
                        onChange={(e) =>
                          handleUpdateBookingStatus(b.id, e.target.value as BookingStatus)
                        }
                        className="px-2.5 py-1.5 text-xs font-semibold bg-[#FAF6F0] border border-[#D9C7B2] rounded-lg text-[#2D1D14]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HOTELS */}
      {activeTab === 'hotels' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddHotel}
            className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-display text-xl font-semibold text-[#2D1D14] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#A66A38]" />
              Add New Demonstration Hotel
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <input
                type="text"
                value={hName}
                onChange={(e) => setHName(e.target.value)}
                placeholder="Hotel Name *"
                required
                className="px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
              <input
                type="text"
                value={hCity}
                onChange={(e) => setHCity(e.target.value)}
                placeholder="City (e.g., Bengaluru) *"
                required
                className="px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
              <input
                type="text"
                value={hAddress}
                onChange={(e) => setHAddress(e.target.value)}
                placeholder="Street Address"
                className="px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
              <select
                value={hCategory}
                onChange={(e) => setHCategory(e.target.value as HotelCategory)}
                className="px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              >
                {HOTEL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={hStars}
                onChange={(e) => setHStars(Number(e.target.value) as 3 | 4 | 5)}
                className="px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              >
                <option value={3}>3-Star</option>
                <option value={4}>4-Star</option>
                <option value={5}>5-Star</option>
              </select>
              <input
                type="number"
                min={500}
                value={hPrice}
                onChange={(e) => setHPrice(Number(e.target.value))}
                placeholder="Starting Price INR"
                required
                className="px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl tabular-nums"
              />
            </div>
            <input
              type="text"
              value={hDesc}
              onChange={(e) => setHDesc(e.target.value)}
              placeholder="Short architectural / hospitality description"
              className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] rounded-xl cursor-pointer"
            >
              Save Hotel to hotels.json
            </button>
          </form>

          <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F2EAE0] text-xs text-[#6A5344] border-b border-[#E4D7C5]">
                    <th className="py-3 px-4 font-semibold">Hotel</th>
                    <th className="py-3 px-4 font-semibold">City & Category</th>
                    <th className="py-3 px-4 font-semibold text-right">Starting Rate</th>
                    <th className="py-3 px-4 font-semibold">Availability</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE5D8]">
                  {hotels.map((h) => (
                    <tr key={h.id} className="hover:bg-[#FAF6F0]/60">
                      <td className="py-3 px-4 font-medium text-[#2D1D14]">{h.name}</td>
                      <td className="py-3 px-4 text-xs text-[#6A5344]">
                        {h.city} · {h.category} · {h.starCategory}★
                      </td>
                      <td className="py-3 px-4 font-mono text-right tabular-nums text-[#2D1D14]">
                        {formatINR(h.startingPrice)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleHotelAvailability(h)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border cursor-pointer ${
                            h.isAvailable
                              ? 'border-[#B9CBB9] text-[#3A5A40] bg-[#EDF3EE]'
                              : 'border-[#DFB5AE] text-[#9E3B33] bg-[#F9ECEA]'
                          }`}
                        >
                          {h.isAvailable ? 'Available' : 'Paused'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => setEditingHotel(h)}
                          aria-label={`Edit ${h.name}`}
                          className="p-1.5 text-[#4A3426] hover:bg-[#F2EAE0] rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHotel(h.id)}
                          aria-label={`Delete ${h.name}`}
                          className="p-1.5 text-[#9E3B33] hover:bg-[#F9ECEA] rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROOMS */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddRoom}
            className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-display text-xl font-semibold text-[#2D1D14]">
              Add Room Category & Inventory
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={rHotelId}
                onChange={(e) => setRHotelId(e.target.value)}
                className="px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl lg:col-span-2"
              >
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
              <select
                value={rCategory}
                onChange={(e) => setRCategory(e.target.value as RoomCategoryName)}
                className="px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              >
                {ROOM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={500}
                value={rPrice}
                onChange={(e) => setRPrice(Number(e.target.value))}
                placeholder="Price INR"
                required
                className="px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl tabular-nums"
              />
              <input
                type="number"
                min={1}
                max={50}
                value={rInventory}
                onChange={(e) => setRInventory(Number(e.target.value))}
                placeholder="Inventory"
                required
                className="px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl tabular-nums"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-[#6A5344]">Max Guests:</label>
              <input
                type="number"
                min={1}
                max={8}
                value={rMaxGuests}
                onChange={(e) => setRMaxGuests(Number(e.target.value))}
                className="w-20 px-2.5 py-1.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-lg tabular-nums"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-[#2D1D14] text-[#FAF6F0] rounded-xl cursor-pointer"
              >
                Save Room to rooms.json
              </button>
            </div>
          </form>

          <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F2EAE0] text-xs text-[#6A5344] border-b border-[#E4D7C5]">
                    <th className="py-3 px-4 font-semibold">Hotel</th>
                    <th className="py-3 px-4 font-semibold">Room Category</th>
                    <th className="py-3 px-4 font-semibold text-right">Nightly INR</th>
                    <th className="py-3 px-4 font-semibold text-right">Inventory</th>
                    <th className="py-3 px-4 font-semibold text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE5D8]">
                  {rooms.map((rm) => (
                    <tr key={rm.id} className="hover:bg-[#FAF6F0]/60">
                      <td className="py-3 px-4 font-medium text-[#2D1D14]">{rm.hotelName}</td>
                      <td className="py-3 px-4 text-xs text-[#5A4334]">{rm.category}</td>
                      <td className="py-3 px-4 font-mono text-right tabular-nums text-[#2D1D14]">
                        {formatINR(rm.pricePerNight)}
                      </td>
                      <td className="py-3 px-4 font-mono text-right tabular-nums text-[#2D1D14]">
                        {rm.totalInventory} units
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingRoom(rm)}
                          aria-label={`Edit ${rm.category}`}
                          className="p-1.5 text-[#4A3426] hover:bg-[#F2EAE0] rounded-lg cursor-pointer align-middle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateRoomQuick(rm, rm.pricePerNight + 500, rm.totalInventory)
                          }
                          className="px-2 py-1 text-xs border border-[#D9C7B2] rounded-lg hover:bg-[#F2EAE0] cursor-pointer"
                        >
                          +₹500
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateRoomQuick(rm, rm.pricePerNight, rm.totalInventory + 1)
                          }
                          className="px-2 py-1 text-xs border border-[#D9C7B2] rounded-lg hover:bg-[#F2EAE0] cursor-pointer"
                        >
                          +1 Unit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(rm.id)}
                          aria-label={`Delete ${rm.category}`}
                          className="p-1 text-[#9E3B33] hover:bg-[#F9ECEA] rounded-lg cursor-pointer align-middle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F2EAE0] text-xs text-[#6A5344] border-b border-[#E4D7C5]">
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Mobile & City</th>
                  <th className="py-3 px-4 font-semibold text-right">Bookings</th>
                  <th className="py-3 px-4 font-semibold text-right">Est. Spend</th>
                  <th className="py-3 px-4 font-semibold text-right">Account Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE5D8]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF6F0]/60">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#2D1D14]">{c.fullName}</div>
                      <div className="text-xs text-[#8C7561]">{c.email}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#5A4334]">
                      {c.mobile} · {c.city ?? 'India'}
                    </td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums">
                      {c.bookingCount}
                    </td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums font-semibold">
                      {formatINR(c.totalSpent)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleCustomer(c)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border cursor-pointer ${
                          c.isActive
                            ? 'border-[#B9CBB9] text-[#3A5A40] bg-[#EDF3EE]'
                            : 'border-[#DFB5AE] text-[#9E3B33] bg-[#F9ECEA]'
                        }`}
                      >
                        {c.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" /> Suspended
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MESSAGES & EVENTS */}
      {activeTab === 'inquiries' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-xl font-semibold text-[#2D1D14]">
              Contact Inquiries (messages.json)
            </h2>
            {messages.length === 0 ? (
              <p className="text-sm text-[#6A5344]">No inquiries recorded yet.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="p-3.5 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-sm">
                  <div className="font-semibold text-[#2D1D14]">{m.subject}</div>
                  <div className="text-xs text-[#8C7561] mb-1.5">
                    {m.name} · {m.email} · {m.mobile}
                  </div>
                  <p className="text-xs text-[#4A3426]">{m.message}</p>
                </div>
              ))
            )}
          </div>

          <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-xl font-semibold text-[#2D1D14]">
              Event Registrations (eventRegistrations.json)
            </h2>
            {eventRegs.map((reg) => (
              <div key={reg.id} className="p-3.5 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-sm">
                <div className="flex justify-between text-xs text-[#8C7561]">
                  <span className="font-mono font-semibold text-[#2D1D14]">
                    {reg.registrationRef}
                  </span>
                  <span>{reg.guestsCount} guest(s)</span>
                </div>
                <div className="font-semibold text-[#2D1D14] mt-0.5">{reg.eventTitle}</div>
                <div className="text-xs text-[#5A4334]">
                  {reg.fullName} {reg.email ? `· ${reg.email}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT HOTEL MODAL */}
      {editingHotel && (
        <div
          className="fixed inset-0 z-50 bg-[#1E120B]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveEditHotel}
            className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-[#2D1D14]">Edit Hotel</h3>
              <button
                type="button"
                onClick={() => setEditingHotel(null)}
                aria-label="Close edit hotel modal"
                className="p-1.5 text-[#6A5344] hover:bg-[#F2EAE0] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">Hotel Name</label>
                <input
                  type="text"
                  value={editingHotel.name}
                  onChange={(e) => setEditingHotel({ ...editingHotel, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">City</label>
                <input
                  type="text"
                  value={editingHotel.city}
                  onChange={(e) => setEditingHotel({ ...editingHotel, city: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">Category</label>
                <select
                  value={editingHotel.category}
                  onChange={(e) =>
                    setEditingHotel({ ...editingHotel, category: e.target.value as HotelCategory })
                  }
                  className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                >
                  {HOTEL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">
                  Starting Rate (INR)
                </label>
                <input
                  type="number"
                  min={500}
                  value={editingHotel.startingPrice}
                  onChange={(e) =>
                    setEditingHotel({ ...editingHotel, startingPrice: Number(e.target.value) })
                  }
                  required
                  className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">Address</label>
              <input
                type="text"
                value={editingHotel.address}
                onChange={(e) => setEditingHotel({ ...editingHotel, address: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">Description</label>
              <textarea
                rows={3}
                value={editingHotel.description}
                onChange={(e) => setEditingHotel({ ...editingHotel, description: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingHotel(null)}
                className="px-4 py-2 text-xs font-semibold border border-[#D9C7B2] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-[#2D1D14] text-[#FAF6F0] rounded-xl cursor-pointer"
              >
                Save Hotel Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {editingRoom && (
        <div
          className="fixed inset-0 z-50 bg-[#1E120B]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveEditRoom}
            className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-[#2D1D14]">
                Edit Room Pricing & Inventory
              </h3>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                aria-label="Close edit room modal"
                className="p-1.5 text-[#6A5344] hover:bg-[#F2EAE0] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-[#6A5344]">
              Property: <strong>{editingRoom.hotelName}</strong>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">Room Category</label>
              <select
                value={editingRoom.category}
                onChange={(e) =>
                  setEditingRoom({ ...editingRoom, category: e.target.value as RoomCategoryName })
                }
                className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              >
                {ROOM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">Nightly INR</label>
                <input
                  type="number"
                  min={500}
                  value={editingRoom.pricePerNight}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, pricePerNight: Number(e.target.value) })
                  }
                  required
                  className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">Inventory</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingRoom.totalInventory}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, totalInventory: Number(e.target.value) })
                  }
                  required
                  className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">Max Guests</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={editingRoom.maxGuests}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, maxGuests: Number(e.target.value) })
                  }
                  required
                  className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl tabular-nums"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="px-4 py-2 text-xs font-semibold border border-[#D9C7B2] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-[#2D1D14] text-[#FAF6F0] rounded-xl cursor-pointer"
              >
                Save Room Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
