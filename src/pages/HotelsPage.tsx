import { useState, useEffect, useCallback } from 'react';
import { Search, Star, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { apiRequest, formatINR } from '../lib/api';
import { SafeImage } from '../components/SafeImage';
import type { Hotel, HotelCategory } from '../../shared/types';
import type { SearchQueryParams } from './HomePage';

const CITIES = ['All', 'Bengaluru', 'Mysuru', 'Goa', 'Mumbai', 'Hyderabad', 'Chennai', 'Delhi', 'Manali'];
const CATEGORIES: ('All' | HotelCategory)[] = [
  'All',
  'Budget',
  'Standard',
  'Premium',
  'Luxury',
  'Resort',
  'Boutique',
];
const FACILITIES = [
  'Free Wi-Fi',
  'Swimming Pool',
  'Fine Dining',
  'Spa & Wellness',
  'Valet Parking',
  'Airport Shuttle',
  'Breakfast Included',
];

interface HotelsPageProps {
  initialQuery: SearchQueryParams | null;
  onSelectHotel: (hotelId: string) => void;
}

export function HotelsPage({ initialQuery, onSelectHotel }: HotelsPageProps) {
  const [search, setSearch] = useState(initialQuery?.search ?? '');
  const [city, setCity] = useState(initialQuery?.city ?? 'All');
  const [category, setCategory] = useState<'All' | HotelCategory>('All');
  const [stars, setStars] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(20000);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sort, setSort] = useState('default');

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialQuery) {
      setSearch(initialQuery.search);
      setCity(initialQuery.city || 'All');
    }
  }, [initialQuery]);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (city !== 'All') qs.set('city', city);
      if (category !== 'All') qs.set('category', category);
      if (stars !== 'All') qs.set('stars', stars);
      if (maxPrice < 20000) qs.set('maxPrice', String(maxPrice));
      if (selectedFacilities.length > 0) qs.set('facility', selectedFacilities.join(','));
      if (availableOnly) qs.set('availableOnly', 'true');
      if (sort !== 'default') qs.set('sort', sort);

      const res = await apiRequest<{ hotels: Hotel[] }>(`/api/hotels?${qs.toString()}`);
      setHotels(res.hotels);
    } catch {
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [search, city, category, stars, maxPrice, selectedFacilities, availableOnly, sort]);

  useEffect(() => {
    const t = setTimeout(fetchHotels, 160);
    return () => clearTimeout(t);
  }, [fetchHotels]);

  const toggleFacility = (fac: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(fac) ? prev.filter((item) => item !== fac) : [...prev, fac]
    );
  };

  const resetFilters = () => {
    setSearch('');
    setCity('All');
    setCategory('All');
    setStars('All');
    setMaxPrice(20000);
    setSelectedFacilities([]);
    setAvailableOnly(true);
    setSort('default');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E4D7C5]">
        <div>
          <p className="text-xs font-semibold text-[#A66A38] mb-1">
            Fictional Academic Demonstration Catalogue · Prices in INR (₹)
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14]">
            Explore STAYEASE Hotels
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="sortSelect" className="text-xs font-medium text-[#6A5344] whitespace-nowrap">
            Sort by:
          </label>
          <select
            id="sortSelect"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3.5 py-2 text-sm bg-[#FFFDF9] border border-[#E4D7C5] rounded-xl text-[#2D1D14] focus:outline-none focus:border-[#A66A38]"
          >
            <option value="default">Featured Order</option>
            <option value="price_asc">Lowest Price First</option>
            <option value="price_desc">Highest Price First</option>
            <option value="rating_desc">Highest Guest Rating</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#2D1D14]">
                <SlidersHorizontal className="w-4 h-4 text-[#A66A38]" />
                Refine Stays
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#8C7561] hover:text-[#2D1D14] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1.5">
                Search Name or City
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C7561] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Hotel or destination..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-[#2D1D14] focus:outline-none focus:border-[#A66A38]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1.5">
                Destination City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-[#2D1D14] focus:outline-none focus:border-[#A66A38]"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Destinations' : c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-2">
                Hotel Category
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                      category === cat
                        ? 'bg-[#2D1D14] text-[#FAF6F0] border-[#2D1D14]'
                        : 'bg-[#FAF6F0] text-[#5A4334] border-[#E4D7C5] hover:border-[#A66A38]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-2">
                Star Category
              </label>
              <div className="flex gap-1.5">
                {['All', '3', '4', '5'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStars(s)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      stars === s
                        ? 'bg-[#2D1D14] text-[#FAF6F0] border-[#2D1D14]'
                        : 'bg-[#FAF6F0] text-[#5A4334] border-[#E4D7C5] hover:border-[#A66A38]'
                    }`}
                  >
                    {s === 'All' ? 'Any' : `${s}★`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#6A5344]">Max Nightly Rate</span>
                <span className="font-mono font-semibold text-[#2D1D14] tabular-nums">
                  {formatINR(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min={2000}
                max={20000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#A66A38]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-2">
                Facilities
              </label>
              <div className="space-y-2">
                {FACILITIES.map((fac) => (
                  <label
                    key={fac}
                    className="flex items-center gap-2.5 text-xs text-[#4A3426] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFacilities.includes(fac)}
                      onChange={() => toggleFacility(fac)}
                      className="rounded border-[#CBB7A0] accent-[#2D1D14]"
                    />
                    <span>{fac}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2.5 pt-3 border-t border-[#EFE5D8] text-xs font-medium text-[#2D1D14] cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-[#CBB7A0] accent-[#2D1D14]"
              />
              <span>Show available hotels only</span>
            </label>
          </div>
        </aside>

        {/* Hotel Results Grid */}
        <div className="lg:col-span-9">
          <div className="mb-4 text-sm text-[#6A5344]">
            Showing <strong className="text-[#2D1D14] tabular-nums">{hotels.length}</strong>{' '}
            {hotels.length === 1 ? 'property' : 'properties'}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-80 bg-[#F2EAE0] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-12 text-center">
              <h2 className="font-display text-2xl font-semibold text-[#2D1D14] mb-2">
                No matching properties found
              </h2>
              <p className="text-sm text-[#6A5344] mb-6">
                Try broadening your price ceiling, city, or selected facility filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 text-sm font-semibold bg-[#2D1D14] text-[#FAF6F0] rounded-xl cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hotels.map((hotel) => (
                <article
                  key={hotel.id}
                  onClick={() => onSelectHotel(hotel.id)}
                  className="group bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="aspect-[16/10] bg-[#F2EAE0] overflow-hidden">
                    <SafeImage
                      src={hotel.images[0]}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs text-[#8C7561] mb-1.5">
                      <span>
                        {hotel.city} · {hotel.category} · {hotel.starCategory}★
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#2D1D14] tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-[#A66A38] text-[#A66A38]" />
                        {hotel.rating.toFixed(1)}
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-[#2D1D14] mb-1.5">
                      {hotel.name}
                    </h2>
                    <p className="text-sm text-[#6A5344] line-clamp-2 mb-3 flex-1">
                      {hotel.description}
                    </p>
                    <div className="text-xs text-[#8C7561] mb-4 truncate">
                      {hotel.facilities.slice(0, 4).join(' · ')}
                    </div>
                    <div className="pt-3.5 border-t border-[#EFE5D8] flex items-center justify-between">
                      <div>
                        <span className="font-mono text-base font-semibold text-[#2D1D14] tabular-nums">
                          {formatINR(hotel.startingPrice)}
                        </span>
                        <span className="text-xs text-[#8C7561]"> / night</span>
                      </div>
                      <span className="px-3.5 py-1.5 text-xs font-semibold bg-[#2D1D14] text-[#FAF6F0] rounded-lg group-hover:bg-[#4A3426] transition-colors">
                        {hotel.isAvailable ? 'View & Book' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
