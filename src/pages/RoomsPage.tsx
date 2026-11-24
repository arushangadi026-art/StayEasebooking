import { useState, useEffect } from 'react';
import { BedDouble, Maximize2, Users } from 'lucide-react';
import { apiRequest, formatINR } from '../lib/api';
import { SafeImage } from '../components/SafeImage';
import type { Room, RoomCategoryName } from '../../shared/types';

interface EnrichedRoom extends Room {
  hotelName: string;
  hotelCity: string;
  availableUnits: number;
}

const ROOM_CATEGORIES: ('All' | RoomCategoryName)[] = [
  'All',
  'Single Room',
  'Double Room',
  'Deluxe Room',
  'Premium Room',
  'Family Room',
  'Suite',
  'Executive Suite',
];

interface RoomsPageProps {
  initialCategory?: 'All' | RoomCategoryName;
  onSelectHotel: (hotelId: string) => void;
}

export function RoomsPage({ initialCategory = 'All', onSelectHotel }: RoomsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | RoomCategoryName>(initialCategory);
  const [rooms, setRooms] = useState<EnrichedRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const qs = selectedCategory === 'All' ? '' : `?category=${encodeURIComponent(selectedCategory)}`;
    apiRequest<{ rooms: EnrichedRoom[] }>(`/api/rooms${qs}`)
      .then((res) => {
        if (active) setRooms(res.rooms);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="pb-6 border-b border-[#E4D7C5]">
        <p className="text-xs font-semibold text-[#A66A38] mb-1">
          Editable Sample Academic Demonstration Prices in Indian Rupees (₹)
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14]">
          Room Categories & Suites
        </h1>
        <p className="mt-2 text-sm text-[#6A5344] max-w-2xl">
          Compare all seven room tiers across STAYEASE’s twelve demonstration properties—from crisp
          solo rooms to expansive walnut-panelled executive suites.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {ROOM_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#2D1D14] text-[#FAF6F0] border-[#2D1D14]'
                  : 'bg-[#FFFDF9] text-[#4A3426] border-[#E4D7C5] hover:border-[#A66A38]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-[#F2EAE0] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {rooms.map((room) => (
            <article
              key={room.id}
              className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] bg-[#F2EAE0] overflow-hidden">
                <SafeImage src={room.image} alt={`${room.category} at ${room.hotelName}`} className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs text-[#8C7561] mb-1">
                  {room.hotelName} · {room.hotelCity}
                </div>
                <h2 className="font-display text-xl font-semibold text-[#2D1D14] mb-2">
                  {room.category}
                </h2>
                <p className="text-sm text-[#5A4334] line-clamp-2 mb-4 flex-1">
                  {room.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#6A5344] mb-4">
                  <span className="inline-flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5 text-[#A66A38]" />
                    {room.bedType}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-[#A66A38]" />
                    {room.sizeSqFt} sq.ft
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#A66A38]" />
                    Max {room.maxGuests}
                  </span>
                </div>
                <div className="pt-3.5 border-t border-[#EFE5D8] flex items-center justify-between">
                  <div>
                    <div className="font-mono text-base font-semibold text-[#2D1D14] tabular-nums">
                      {formatINR(room.pricePerNight)}
                    </div>
                    <div className="text-[11px] text-[#8C7561]">
                      per night · {room.totalInventory} total units
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectHotel(room.hotelId)}
                    className="px-3.5 py-2 text-xs font-semibold bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] rounded-xl transition-colors cursor-pointer"
                  >
                    Reserve Room
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
