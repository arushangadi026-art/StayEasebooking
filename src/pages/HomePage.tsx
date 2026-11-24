import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  MapPin,
  Star,
  Calendar,
  Users,
  BedDouble,
  ChevronDown,
  ArrowRight,
  Check,
} from 'lucide-react';
import { apiRequest, formatINR, getDefaultDates } from '../lib/api';
import { SafeImage } from '../components/SafeImage';
import type { Hotel, Review } from '../../shared/types';
import type { PageRoute } from '../components/Navbar';

const HERO_IMG = '/src/assets/images/hero_luxury_hotel_1795366197068.jpg';

const DESTINATIONS = [
  { city: 'Bengaluru', label: 'Garden City Sanctuaries', image: '/src/assets/images/hotel_urban_boutique_1795366197732.jpg' },
  { city: 'Mysuru', label: 'Royal Sandstone Heritage', image: '/src/assets/images/hotel_palace_heritage_1795366198091.jpg' },
  { city: 'Goa', label: 'Coastal Palm Retreats', image: '/src/assets/images/hotel_coastal_resort_1795366207310.jpg' },
  { city: 'Manali', label: 'Cedar Mountain Lodges', image: '/src/assets/images/hotel_mountain_retreat_1795366206492.jpg' },
  { city: 'Mumbai', label: 'Heritage Townhouses', image: '/src/assets/images/hotel_urban_boutique_1795366197732.jpg' },
  { city: 'Hyderabad', label: 'Deccan Courtyards', image: '/src/assets/images/hero_luxury_hotel_1795366197068.jpg' },
  { city: 'Chennai', label: 'Coromandel Verandas', image: '/src/assets/images/hotel_coastal_resort_1795366207310.jpg' },
  { city: 'Delhi', label: 'Classical Ivory Manors', image: '/src/assets/images/hotel_palace_heritage_1795366198091.jpg' },
];

const ROOM_TIERS = [
  { name: 'Single Room', sampleRate: 2100, note: 'Solo comfort · 210–240 sq.ft' },
  { name: 'Double Room', sampleRate: 4300, note: 'Queen bedding · 290–350 sq.ft' },
  { name: 'Deluxe Room', sampleRate: 6200, note: 'Teak interiors · 360–420 sq.ft' },
  { name: 'Premium Room', sampleRate: 6400, note: 'Balcony views · 390–460 sq.ft' },
  { name: 'Family Room', sampleRate: 3900, note: 'Up to 4 guests · 420–680 sq.ft' },
  { name: 'Suite', sampleRate: 9800, note: 'Private lounge · 610–820 sq.ft' },
  { name: 'Executive Suite', sampleRate: 12900, note: 'Butler pantry · 640–940 sq.ft' },
];

const FAQS = [
  {
    q: 'Are the hotels and room prices on STAYEASE real commercial listings?',
    a: 'All preloaded hotels, room categories, ratings, and INR prices are clearly labelled fictional academic demonstration listings built for our BCA III Semester Server-Side Web Development project.',
  },
  {
    q: 'How does STAYEASE prevent double-booking of hotel rooms?',
    a: 'Every reservation checks overlapping date ranges [check-in, check-out) against non-cancelled records stored in bookings.json and ensures booked units never exceed room inventory.',
  },
  {
    q: 'Do I need to enter credit card or UPI payment details to book?',
    a: 'No. STAYEASE intentionally avoids real payment collection and presents a transparent Demonstration Payment Summary showing nights, add-ons, and 12% GST in INR.',
  },
  {
    q: 'Can I cancel an upcoming booking after confirmation?',
    a: 'Yes. Signed-in customers can view their full booking history and cancel eligible Pending or Confirmed stays directly from the Customer Dashboard.',
  },
];

export interface SearchQueryParams {
  search: string;
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  numRooms: number;
}

interface HomePageProps {
  onSearchHotels: (params: SearchQueryParams) => void;
  onSelectHotel: (hotelId: string) => void;
  onSelectRoomCategory: (category: string) => void;
  onNavigate: (page: PageRoute) => void;
}

export function HomePage({
  onSearchHotels,
  onSelectHotel,
  onSelectRoomCategory,
  onNavigate,
}: HomePageProps) {
  const defaults = getDefaultDates();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState(defaults.checkIn);
  const [checkOut, setCheckOut] = useState(defaults.checkOut);
  const [guests, setGuests] = useState(2);
  const [numRooms, setNumRooms] = useState(1);

  const handleCheckInChange = (val: string) => {
    setCheckIn(val);
    if (val && checkOut <= val) {
      const nextDay = new Date(`${val}T00:00:00Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      setCheckOut(nextDay.toISOString().slice(0, 10));
    }
  };

  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<{ hotels: Hotel[] }>('/api/hotels?featured=true'),
      apiRequest<{ reviews: Review[] }>('/api/reviews'),
    ])
      .then(([hRes, rRes]) => {
        if (!active) return;
        setFeaturedHotels(hRes.hotels.slice(0, 6));
        setReviews(rRes.reviews.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchHotels({
      search: destination.trim(),
      city: 'All',
      checkIn,
      checkOut,
      guests,
      numRooms,
    });
  };

  return (
    <div className="space-y-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#2D1D14]">
        <div className="absolute inset-0">
          <SafeImage
            src={HERO_IMG}
            alt="STAYEASE Heritage Luxury Courtyard"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E120B]/90 via-[#1E120B]/55 to-[#1E120B]/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-28 lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl"
          >
            <p className="text-sm font-medium tracking-wide text-[#E6C5A1] mb-3">
              Find Comfort. Book with Ease. · Curated Indian Hospitality Demonstration
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#FFFDF9] leading-[1.1] text-balance">
              Your Perfect Stay Starts Here
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#F2EAE0]/90 max-w-2xl leading-relaxed">
              Discover beautiful stays, enjoy exceptional comfort, and book your next journey with ease.
            </p>
          </motion.div>

          {/* Working Hotel Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSubmitSearch}
            className="mt-10 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-4 sm:p-5 shadow-xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-[#6A5344] mb-1.5">
                  Destination or Hotel
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#A66A38] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Bengaluru, Mysuru, Goa..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-[#2D1D14] placeholder:text-[#9A8472] focus:outline-none focus:border-[#A66A38]"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-[#6A5344] mb-1.5">
                  Check-in
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#A66A38] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    required
                    className="w-full pl-9 pr-2.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-[#2D1D14] focus:outline-none focus:border-[#A66A38]"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-[#6A5344] mb-1.5">
                  Check-out
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#A66A38] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                    className="w-full pl-9 pr-2.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-[#2D1D14] focus:outline-none focus:border-[#A66A38]"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-[#6A5344] mb-1.5">
                  Guests
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-[#A66A38] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-[#2D1D14] focus:outline-none focus:border-[#A66A38]"
                  >
                    {[1, 2, 3, 4, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs font-semibold text-[#6A5344] mb-1.5">
                  Rooms
                </label>
                <div className="relative">
                  <BedDouble className="w-4 h-4 text-[#A66A38] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={numRooms}
                    onChange={(e) => setNumRooms(Number(e.target.value))}
                    className="w-full pl-8 pr-2 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-[#2D1D14] focus:outline-none focus:border-[#A66A38]"
                  >
                    {[1, 2, 3, 4].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  Search Stays
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </section>

      {/* FEATURED HOTELS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-[#A66A38] tracking-wide mb-1.5">
              Fictional Academic Demonstration Listings
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14]">
              Featured Sanctuaries
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('hotels')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A3426] hover:text-[#2D1D14] cursor-pointer whitespace-nowrap"
          >
            Explore All 12 Hotels
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-[#F2EAE0] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {featuredHotels.map((hotel) => (
              <motion.article
                key={hotel.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18 }}
                onClick={() => onSelectHotel(hotel.id)}
                className="group bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#F2EAE0]">
                  <SafeImage
                    src={hotel.images[0]}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs text-[#8C7561] mb-1.5">
                    <span>
                      {hotel.city} · {hotel.category} · {hotel.starCategory}-Star
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-[#2D1D14] tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-[#A66A38] text-[#A66A38]" />
                      {hotel.rating.toFixed(1)}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#2D1D14] mb-2">
                    {hotel.name}
                  </h3>
                  <p className="text-sm text-[#6A5344] line-clamp-2 mb-4 flex-1">
                    {hotel.description}
                  </p>
                  <div className="pt-4 border-t border-[#EFE5D8] flex items-center justify-between">
                    <div>
                      <span className="font-mono text-base font-semibold text-[#2D1D14] tabular-nums">
                        {formatINR(hotel.startingPrice)}
                      </span>
                      <span className="text-xs text-[#8C7561]"> / night (sample)</span>
                    </div>
                    <span className="text-xs font-semibold text-[#A66A38] group-hover:text-[#2D1D14] transition-colors">
                      View Details →
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* POPULAR DESTINATIONS */}
      <section className="bg-[#F2EAE0] py-16 border-y border-[#E4D7C5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-xs font-semibold text-[#A66A38] mb-1.5">Across Eight Indian Cities</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14]">
              Popular Destinations
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {DESTINATIONS.map((dest) => (
              <button
                key={dest.city}
                type="button"
                onClick={() =>
                  onSearchHotels({
                    search: '',
                    city: dest.city,
                    checkIn,
                    checkOut,
                    guests,
                    numRooms,
                  })
                }
                className="group relative aspect-[4/3] rounded-xl overflow-hidden text-left cursor-pointer border border-[#E4D7C5]"
              >
                <SafeImage
                  src={dest.image}
                  alt={dest.city}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E120B]/85 via-[#1E120B]/25 to-transparent" />
                <div className="absolute bottom-3 left-3.5 right-3.5">
                  <div className="font-display text-lg font-semibold text-[#FFFDF9]">
                    {dest.city}
                  </div>
                  <div className="text-xs text-[#F2EAE0]/85">{dest.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ROOM CATEGORIES + WHY CHOOSE STAYEASE + HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#A66A38] mb-1.5">
                Editable Sample Academic Demonstration Rates in INR
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14]">
                Seven Thoughtful Room Categories
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('rooms')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A3426] hover:text-[#2D1D14] cursor-pointer"
            >
              Browse All Rooms
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROOM_TIERS.map((tier) => (
              <button
                key={tier.name}
                type="button"
                onClick={() => onSelectRoomCategory(tier.name)}
                className="text-left p-5 bg-[#FFFDF9] border border-[#E4D7C5] rounded-xl hover:border-[#A66A38] transition-colors cursor-pointer"
              >
                <div className="font-display text-lg font-semibold text-[#2D1D14] mb-1">
                  {tier.name}
                </div>
                <div className="text-xs text-[#8C7561] mb-3">{tier.note}</div>
                <div className="font-mono text-sm font-semibold text-[#A66A38] tabular-nums">
                  From {formatINR(tier.sampleRate)} / night
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Why Choose STAYEASE & How It Works */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4 border-t border-[#E4D7C5]">
          <div>
            <p className="text-xs font-semibold text-[#A66A38] mb-1.5">Hospitality Standards</p>
            <h2 className="font-display text-3xl font-semibold text-[#2D1D14] mb-5">
              Why Choose STAYEASE?
            </h2>
            <ul className="space-y-3.5 text-sm text-[#4A3426]">
              {[
                'Real-time room inventory validation prevents overlapping overbooking across all dates.',
                'Transparent sample INR pricing with automatic nights, optional services, and 12% GST math.',
                'Secure customer accounts using bcrypt password hashing and protected session access.',
                'Persistent local JSON file storage ensures every booking and review survives restarts.',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[#A66A38] shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#A66A38] mb-1.5">Three Simple Steps</p>
            <h2 className="font-display text-3xl font-semibold text-[#2D1D14] mb-5">
              How It Works
            </h2>
            <div className="space-y-4">
              {[
                {
                  step: '01. Discover & Filter',
                  body: 'Search by Indian city, hotel category, star rating, price ceiling, or preferred facilities.',
                },
                {
                  step: '02. Select Room & Dates',
                  body: 'Inspect live room inventory for your exact check-in and check-out window with transparent INR totals.',
                },
                {
                  step: '03. Instant Confirmation',
                  body: 'Receive a unique SE booking reference saved permanently to JSON storage and track it in your dashboard.',
                },
              ].map((item) => (
                <div key={item.step} className="p-4 bg-[#FFFDF9] border border-[#E4D7C5] rounded-xl">
                  <div className="font-semibold text-sm text-[#2D1D14] mb-1">{item.step}</div>
                  <p className="text-sm text-[#6A5344]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GUEST REVIEWS & FAQ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold text-[#A66A38] mb-1.5">Verified Demonstration Stays</p>
          <h2 className="font-display text-3xl font-semibold text-[#2D1D14] mb-6">
            Guest Impressions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 bg-[#FFFDF9] border border-[#E4D7C5] rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#8C7561] mb-2">
                    <span>{rev.hotelName}</span>
                    <span className="font-mono font-semibold text-[#A66A38]">
                      {rev.rating}.0 ★
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-[#2D1D14] mb-1.5">{rev.title}</div>
                  <p className="text-sm text-[#5A4334] leading-relaxed">“{rev.comment}”</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F2EAE0] text-xs text-[#8C7561]">
                  {rev.customerName} · {rev.stayDate}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <p className="text-xs font-semibold text-[#A66A38] mb-1.5">Helpful Answers</p>
          <h2 className="font-display text-3xl font-semibold text-[#2D1D14] mb-6">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-[#E4D7C5] border-y border-[#E4D7C5]">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left font-medium text-sm text-[#2D1D14] cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8C7561] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-sm text-[#6A5344] leading-relaxed">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
