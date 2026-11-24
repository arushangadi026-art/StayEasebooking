import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest, formatINR, getDefaultDates } from '../lib/api';
import { composeBookingEstimate } from '../utils/lab3BookingSpread';
import { SafeImage } from '../components/SafeImage';
import type { Hotel, Room, Review, Booking, PublicUser } from '../../shared/types';
import type { PageRoute } from '../components/Navbar';

interface RoomWithAvailability extends Room {
  availableUnits?: number;
}

interface HotelDetailsPageProps {
  hotelId: string;
  user: PublicUser | null;
  defaultDates?: { checkIn: string; checkOut: string };
  onBack: () => void;
  onNavigate: (page: PageRoute) => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function HotelDetailsPage({
  hotelId,
  user,
  defaultDates,
  onBack,
  onNavigate,
  onNotify,
}: HotelDetailsPageProps) {
  const initialDates = defaultDates ?? getDefaultDates();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<RoomWithAvailability[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);

  // Booking form state
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkIn, setCheckIn] = useState(initialDates.checkIn);
  const [checkOut, setCheckOut] = useState(initialDates.checkOut);
  const [guests, setGuests] = useState(2);
  const [numRooms, setNumRooms] = useState(1);
  const [customerName, setCustomerName] = useState(user?.fullName ?? '');
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? '');
  const [customerMobile, setCustomerMobile] = useState(user?.mobile ?? '');
  const [addBreakfast, setAddBreakfast] = useState(true);
  const [addAirportTransfer, setAddAirportTransfer] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Review form state
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleCheckInChange = (val: string) => {
    setCheckIn(val);
    if (val && checkOut <= val) {
      const next = new Date(`${val}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      setCheckOut(next.toISOString().slice(0, 10));
    }
  };

  useEffect(() => {
    if (user) {
      setCustomerName(user.fullName);
      setCustomerEmail(user.email);
      setCustomerMobile(user.mobile);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest<{ hotel: Hotel; rooms: Room[]; reviews: Review[] }>(`/api/hotels/${hotelId}`)
      .then((res) => {
        if (!active) return;
        setHotel(res.hotel);
        setRooms(res.rooms);
        setReviews(res.reviews);
        setSelectedRoomId(res.rooms[0]?.id ?? '');
      })
      .catch((err: Error) => onNotify('error', err.message))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hotelId, onNotify]);

  // Refresh real-time room availability whenever checkIn / checkOut changes
  useEffect(() => {
    if (!hotelId || !checkIn || !checkOut || checkOut <= checkIn) return;
    let active = true;
    apiRequest<{ rooms: RoomWithAvailability[] }>(
      `/api/rooms?hotelId=${encodeURIComponent(hotelId)}&checkIn=${checkIn}&checkOut=${checkOut}`
    )
      .then((res) => {
        if (active) setRooms(res.rooms);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [hotelId, checkIn, checkOut]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) ?? rooms[0] ?? null,
    [rooms, selectedRoomId]
  );

  const nights = useMemo(() => {
    const start = new Date(`${checkIn}T00:00:00Z`).getTime();
    const end = new Date(`${checkOut}T00:00:00Z`).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return 0;
    return Math.round((end - start) / 86400000);
  }, [checkIn, checkOut]);

  // Uses Lab 3 Spread & Rest operator composition helper
  const estimate = useMemo(() => {
    if (!hotel || !selectedRoom || nights < 1) return null;
    const breakfastFee = addBreakfast ? 700 * nights * numRooms : 0;
    const transferFee = addAirportTransfer ? 1500 : 0;
    return composeBookingEstimate(
      {
        fullName: customerName || 'Guest',
        email: customerEmail || 'guest@example.in',
        mobile: customerMobile || '',
      },
      {
        hotelName: hotel.name,
        roomCategory: selectedRoom.category,
        checkIn,
        checkOut,
        nights,
        numRooms,
        roomPrice: selectedRoom.pricePerNight,
      },
      hotel.facilities,
      selectedRoom.amenities,
      breakfastFee,
      transferFee
    );
  }, [
    hotel,
    selectedRoom,
    nights,
    numRooms,
    addBreakfast,
    addAirportTransfer,
    customerName,
    customerEmail,
    customerMobile,
    checkIn,
    checkOut,
  ]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNotify('error', 'Please sign in or create an account before completing a booking.');
      onNavigate('login');
      return;
    }
    if (!hotel || !selectedRoom) return;
    if (nights < 1) {
      onNotify('error', 'Check-out date must be after check-in date.');
      return;
    }

    setSubmittingBooking(true);
    try {
      const res = await apiRequest<{ message: string; booking: Booking }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          hotelId: hotel.id,
          roomId: selectedRoom.id,
          checkIn,
          checkOut,
          guests,
          numRooms,
          customerName,
          customerEmail,
          customerMobile,
          specialRequests,
          addBreakfast,
          addAirportTransfer,
        }),
      });
      setConfirmedBooking(res.booking);
      onNotify('success', res.message);
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to complete booking.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hotel) {
      onNotify('error', 'Please sign in to submit a guest review.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await apiRequest<{ message: string; review: Review }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          hotelId: hotel.id,
          rating: revRating,
          title: revTitle,
          comment: revComment,
        }),
      });
      setReviews((prev) => [res.review, ...prev]);
      setRevTitle('');
      setRevComment('');
      onNotify('success', res.message);
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-96 bg-[#F2EAE0] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl text-[#2D1D14] mb-4">Hotel Not Found</h1>
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-[#2D1D14] text-[#FAF6F0] rounded-xl text-sm font-semibold cursor-pointer"
        >
          Back to Explore Hotels
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6A5344] hover:text-[#2D1D14] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Hotel Catalogue
      </button>

      {/* Main Split: Left Gallery & Details, Right Contiguous Booking Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#F2EAE0] border border-[#E4D7C5]">
              <SafeImage
                src={hotel.images[activeImg] ?? hotel.images[0]}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
            </div>
            {hotel.images.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                {hotel.images.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImg === i ? 'border-[#A66A38]' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <SafeImage src={img} alt={`${hotel.name} view ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hotel Header Info */}
          <div className="border-b border-[#E4D7C5] pb-6">
            <div className="text-xs font-medium text-[#8C7561] mb-2">
              {hotel.category} · {hotel.starCategory}-Star Property · Fictional Academic Demonstration Listing
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14] mb-2">
              {hotel.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#5A4334]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#A66A38]" />
                {hotel.address}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#2D1D14] tabular-nums">
                <Star className="w-4 h-4 fill-[#A66A38] text-[#A66A38]" />
                {hotel.rating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>
            <p className="mt-4 text-sm sm:text-base text-[#4A3426] leading-relaxed">
              {hotel.description}
            </p>
          </div>

          {/* Check-in / Check-out & Facilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-[#E4D7C5] pb-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#2D1D14] mb-3">
                Check-in & Check-out
              </h2>
              <div className="space-y-2 text-sm text-[#4A3426]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#A66A38]" />
                  Check-in from <strong>{hotel.checkInTime}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#A66A38]" />
                  Check-out until <strong>{hotel.checkOutTime}</strong>
                </div>
              </div>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-[#2D1D14] mb-3">
                Property Facilities
              </h2>
              <div className="grid grid-cols-2 gap-2 text-sm text-[#4A3426]">
                {hotel.facilities.map((fac) => (
                  <div key={fac} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#A66A38] shrink-0" />
                    <span className="truncate">{fac}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Available Rooms Selector */}
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#2D1D14] mb-4">
              Available Room Categories
            </h2>
            <div className="space-y-3.5">
              {rooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                const avail = room.availableUnits ?? room.totalInventory;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row gap-4 ${
                      isSelected
                        ? 'bg-[#FFFDF9] border-[#A66A38] shadow-sm'
                        : 'bg-[#FFFDF9] border-[#E4D7C5] hover:border-[#CBB7A0]'
                    }`}
                  >
                    <div className="sm:w-36 aspect-[4/3] rounded-xl overflow-hidden bg-[#F2EAE0] shrink-0">
                      <SafeImage src={room.image} alt={room.category} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display text-lg font-semibold text-[#2D1D14]">
                            {room.category}
                          </h3>
                          <span className="font-mono text-base font-semibold text-[#2D1D14] tabular-nums">
                            {formatINR(room.pricePerNight)}
                            <span className="text-xs font-sans font-normal text-[#8C7561]"> / night</span>
                          </span>
                        </div>
                        <div className="text-xs text-[#8C7561] mt-0.5">
                          {room.bedType} · {room.sizeSqFt} sq.ft · Max {room.maxGuests} guests ·{' '}
                          <span className={avail > 0 ? 'text-[#3A5A40] font-semibold' : 'text-[#9E3B33] font-semibold'}>
                            {avail} unit(s) open for selected dates
                          </span>
                        </div>
                        <p className="text-xs text-[#5A4334] mt-2">{room.description}</p>
                      </div>
                      <div className="mt-2 text-xs text-[#8C7561]">
                        {room.amenities.join(' · ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guest Reviews & Submit Review */}
          <div className="pt-6 border-t border-[#E4D7C5] space-y-6">
            <h2 className="font-display text-2xl font-semibold text-[#2D1D14]">
              Guest Reviews ({reviews.length})
            </h2>

            {reviews.length === 0 ? (
              <p className="text-sm text-[#6A5344]">No reviews yet for this demonstration property.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-[#FFFDF9] border border-[#E4D7C5] rounded-xl">
                    <div className="flex items-center justify-between text-xs text-[#8C7561] mb-1">
                      <span className="font-semibold text-[#2D1D14]">{rev.customerName}</span>
                      <span className="font-mono font-semibold text-[#A66A38]">
                        {rev.rating}.0 ★ · {rev.stayDate}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#2D1D14] mb-1">{rev.title}</div>
                    <p className="text-sm text-[#5A4334]">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Review Submission Form */}
            <form
              onSubmit={handleSubmitReview}
              className="p-5 bg-[#F2EAE0]/70 border border-[#E4D7C5] rounded-2xl space-y-3.5"
            >
              <div className="text-sm font-semibold text-[#2D1D14]">
                Share a Review (Available for Guests with Confirmed or Completed Stays)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A4334] mb-1">Rating</label>
                  <select
                    value={revRating}
                    onChange={(e) => setRevRating(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF9] border border-[#E4D7C5] rounded-xl"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} Stars
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A4334] mb-1">Review Title</label>
                  <input
                    type="text"
                    value={revTitle}
                    onChange={(e) => setRevTitle(e.target.value)}
                    placeholder="e.g., Peaceful stay & warm hospitality"
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF9] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5A4334] mb-1">Your Experience</label>
                <textarea
                  rows={3}
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  placeholder="Describe room comfort, check-in experience, and hospitality..."
                  required
                  minLength={10}
                  className="w-full px-3 py-2 text-sm bg-[#FFFDF9] border border-[#E4D7C5] rounded-xl"
                />
              </div>
              {user ? (
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 text-sm font-semibold bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Guest Review'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onNotify('error', 'Please sign in to submit a verified guest review.');
                    onNavigate('login');
                  }}
                  className="px-4 py-2 text-sm font-semibold bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] rounded-xl cursor-pointer"
                >
                  Sign In to Write a Review
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Right Sticky Booking Panel */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24">
          {confirmedBooking ? (
            <div className="bg-[#FFFDF9] border border-[#B9CBB9] rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 text-[#3A5A40]">
                <CheckCircle2 className="w-6 h-6" />
                <h2 className="font-display text-2xl font-semibold text-[#2D1D14]">
                  Reservation Confirmed
                </h2>
              </div>
              <p className="text-sm text-[#4A3426]">
                Your stay at <strong>{confirmedBooking.hotelName}</strong> has been saved permanently in{' '}
                <code className="text-xs bg-[#F2EAE0] px-1.5 py-0.5 rounded">bookings.json</code>.
              </p>
              <div className="p-4 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6A5344]">Booking Reference</span>
                  <span className="font-mono font-semibold text-[#2D1D14]">
                    {confirmedBooking.bookingRef}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A5344]">Room Category</span>
                  <span className="font-medium text-[#2D1D14]">{confirmedBooking.roomCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A5344]">Stay Dates</span>
                  <span className="font-mono text-xs text-[#2D1D14]">
                    {confirmedBooking.checkIn} → {confirmedBooking.checkOut} ({confirmedBooking.pricing.nights} nights)
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E4D7C5] font-semibold">
                  <span>Estimated Demo Total</span>
                  <span className="font-mono tabular-nums text-[#2D1D14]">
                    {formatINR(confirmedBooking.pricing.estimatedTotal)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#8C7561]">{confirmedBooking.paymentSummaryNote}</p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="flex-1 py-2.5 px-4 bg-[#2D1D14] text-[#FAF6F0] text-sm font-semibold rounded-xl cursor-pointer"
                >
                  View in My Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmedBooking(null)}
                  className="py-2.5 px-4 border border-[#D9C7B2] text-sm font-medium text-[#2D1D14] rounded-xl cursor-pointer"
                >
                  Book Another
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleConfirmBooking}
              className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <div>
                <p className="text-xs font-semibold text-[#A66A38]">
                  Sample Academic Demonstration Pricing
                </p>
                <h2 className="font-display text-2xl font-semibold text-[#2D1D14]">
                  Reserve Your Stay
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">
                  Room Category
                </label>
                <select
                  value={selectedRoom?.id ?? ''}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-[#2D1D14]"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.category} — {formatINR(r.pricePerNight)}/night
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Rooms</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedRoom?.availableUnits ?? selectedRoom?.totalInventory ?? 5}
                    value={numRooms}
                    onChange={(e) => setNumRooms(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Guest Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="+91 98450 00000"
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="guest@example.in"
                  required
                  className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                />
              </div>

              {/* Optional Add-ons (computed via Lab 3 Rest Operator) */}
              <div className="space-y-2 pt-2 border-t border-[#EFE5D8]">
                <label className="flex items-center justify-between text-xs text-[#4A3426] cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addBreakfast}
                      onChange={(e) => setAddBreakfast(e.target.checked)}
                      className="accent-[#2D1D14]"
                    />
                    Artisan Breakfast Spread
                  </span>
                  <span className="font-mono text-[#6A5344]">+₹700 / room / night</span>
                </label>
                <label className="flex items-center justify-between text-xs text-[#4A3426] cursor-pointer">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addAirportTransfer}
                      onChange={(e) => setAddAirportTransfer(e.target.checked)}
                      className="accent-[#2D1D14]"
                    />
                    Chauffeured Airport Transfer
                  </span>
                  <span className="font-mono text-[#6A5344]">+₹1,500 flat</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">
                  Special Requests (Optional)
                </label>
                <input
                  type="text"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Late check-in, courtyard view..."
                  className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                />
              </div>

              {/* Demonstration Payment Summary */}
              {estimate && nights >= 1 ? (
                <div className="p-4 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl space-y-2 text-sm">
                  <div className="text-xs font-semibold text-[#A66A38]">
                    Demonstration Payment Summary (No Card Details Collected)
                  </div>
                  <div className="flex justify-between text-[#5A4334]">
                    <span>
                      {formatINR(estimate.combinedRecord.roomPrice)} × {nights} night(s) × {numRooms} room(s)
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatINR(estimate.combinedRecord.baseSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5A4334]">
                    <span>Additional Services</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(estimate.combinedRecord.additionalCharges)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5A4334]">
                    <span>Estimated Taxes (12% GST)</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(estimate.combinedRecord.taxes)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E4D7C5] font-semibold text-[#2D1D14]">
                    <span>Final Estimated Total</span>
                    <span className="font-mono text-base tabular-nums">
                      {formatINR(estimate.combinedRecord.estimatedTotal)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8C7561] pt-1">
                    Included highlights: {estimate.primaryPerk} · {estimate.secondaryPerk} (+{estimate.remainingPerksCount} more)
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#F9ECEA] border border-[#E2B6B0] rounded-xl text-xs text-[#7D2922]">
                  Please select a check-out date at least 1 night after check-in.
                </div>
              )}

              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    onNotify('error', 'Please sign in or create an account to confirm your booking.');
                    onNavigate('login');
                  }}
                  className="w-full py-3 px-4 bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Sign In to Book This Room
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    submittingBooking ||
                    nights < 1 ||
                    !hotel.isAvailable ||
                    (selectedRoom?.availableUnits !== undefined && selectedRoom.availableUnits <= 0)
                  }
                  className="w-full py-3 px-4 bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submittingBooking
                    ? 'Confirming Reservation...'
                    : !hotel.isAvailable
                      ? 'Property Currently Unavailable'
                      : selectedRoom?.availableUnits !== undefined && selectedRoom.availableUnits <= 0
                        ? 'Sold Out for Selected Dates'
                        : 'Confirm Demonstration Booking'}
                </button>
              )}
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
