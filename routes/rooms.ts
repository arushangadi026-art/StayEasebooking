import { Router } from 'express';
import { readJson, writeJson, withFileLock, generateId } from '../services/storage.ts';
import { requireAdmin } from '../middleware/auth.ts';
import { IMG } from '../services/seedData.ts';
import type { Room, Hotel, Booking, RoomCategoryName } from '../shared/types.ts';

const router = Router();

const VALID_ROOM_CATEGORIES = new Set<RoomCategoryName>([
  'Single Room',
  'Double Room',
  'Deluxe Room',
  'Premium Room',
  'Family Room',
  'Suite',
  'Executive Suite',
]);

export function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

router.get('/', async (req, res) => {
  try {
    const [rooms, hotels, bookings] = await Promise.all([
      readJson<Room[]>('rooms.json', []),
      readJson<Hotel[]>('hotels.json', []),
      readJson<Booking[]>('bookings.json', []),
    ]);

    const hotelMap = new Map(hotels.map((h) => [h.id, h]));
    const { hotelId, category, checkIn, checkOut } = req.query;

    let result = rooms;
    if (typeof hotelId === 'string' && hotelId.trim()) {
      result = result.filter((r) => r.hotelId === hotelId);
    }
    if (typeof category === 'string' && category.trim() && category !== 'All') {
      result = result.filter((r) => r.category === category);
    }

    const enriched = result.map((room) => {
      const hotel = hotelMap.get(room.hotelId);
      let availableUnits = room.totalInventory;

      if (
        typeof checkIn === 'string' &&
        typeof checkOut === 'string' &&
        checkIn < checkOut
      ) {
        const overlappingBooked = bookings
          .filter(
            (b) =>
              b.roomId === room.id &&
              b.status !== 'Cancelled' &&
              datesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)
          )
          .reduce((sum, b) => sum + b.numRooms, 0);
        availableUnits = Math.max(0, room.totalInventory - overlappingBooked);
      }

      return {
        ...room,
        hotelName: hotel?.name ?? 'STAYEASE Property',
        hotelCity: hotel?.city ?? 'India',
        availableUnits,
      };
    });

    res.json({ rooms: enriched, total: enriched.length });
  } catch (err) {
    console.error('[Rooms] GET / error:', err);
    res.status(500).json({ error: 'Unable to load room listings.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      hotelId,
      category,
      description,
      pricePerNight,
      maxGuests,
      totalInventory,
      sizeSqFt,
      bedType,
      amenities,
    } = req.body ?? {};

    const hotels = await readJson<Hotel[]>('hotels.json', []);
    if (!hotels.some((h) => h.id === hotelId)) {
      res.status(400).json({ error: 'Please select a valid hotel.' });
      return;
    }

    if (!VALID_ROOM_CATEGORIES.has(category)) {
      res.status(400).json({ error: 'Invalid room category selected.' });
      return;
    }

    const parsedPrice = Number(pricePerNight);
    if (Number.isNaN(parsedPrice) || parsedPrice < 500) {
      res.status(400).json({ error: 'Price per night must be at least ₹500.' });
      return;
    }

    const room = await withFileLock('rooms.json', async () => {
      const rooms = await readJson<Room[]>('rooms.json', []);
      const isSuite = category === 'Suite' || category === 'Executive Suite';
      const created: Room = {
        id: generateId('rm'),
        hotelId,
        category,
        description:
          typeof description === 'string' && description.trim()
            ? description.trim().slice(0, 400)
            : `Refined ${category} styled in warm cream and walnut tones.`,
        pricePerNight: Math.round(parsedPrice),
        maxGuests: Math.max(1, Math.min(8, Number(maxGuests) || 2)),
        totalInventory: Math.max(1, Math.min(50, Number(totalInventory) || 5)),
        sizeSqFt: Math.max(150, Number(sizeSqFt) || (isSuite ? 680 : 340)),
        bedType: typeof bedType === 'string' && bedType.trim() ? bedType.trim() : 'King Bed',
        amenities: Array.isArray(amenities)
          ? amenities.filter((a: unknown): a is string => typeof a === 'string' && a.trim().length > 0)
          : ['Wi-Fi', 'Artisan Coffee', 'Rain Shower'],
        image: isSuite ? IMG.SUITE : IMG.DELUXE,
        isSamplePrice: true,
      };
      rooms.push(created);
      await writeJson('rooms.json', rooms);
      return created;
    });

    res.status(201).json({ message: 'Room category added successfully.', room });
  } catch (err) {
    console.error('[Rooms] POST / error:', err);
    res.status(500).json({ error: 'Unable to add room listing.' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body ?? {};

    const updated = await withFileLock('rooms.json', async () => {
      const rooms = await readJson<Room[]>('rooms.json', []);
      const idx = rooms.findIndex((r) => r.id === id);
      if (idx === -1) return null;

      const cur = rooms[idx];
      rooms[idx] = {
        ...cur,
        category: VALID_ROOM_CATEGORIES.has(body.category) ? body.category : cur.category,
        description:
          typeof body.description === 'string' && body.description.trim()
            ? body.description.trim().slice(0, 400)
            : cur.description,
        pricePerNight:
          body.pricePerNight !== undefined && !Number.isNaN(Number(body.pricePerNight))
            ? Math.max(500, Math.round(Number(body.pricePerNight)))
            : cur.pricePerNight,
        maxGuests:
          body.maxGuests !== undefined && !Number.isNaN(Number(body.maxGuests))
            ? Math.max(1, Math.min(8, Number(body.maxGuests)))
            : cur.maxGuests,
        totalInventory:
          body.totalInventory !== undefined && !Number.isNaN(Number(body.totalInventory))
            ? Math.max(0, Math.min(100, Number(body.totalInventory)))
            : cur.totalInventory,
        bedType: typeof body.bedType === 'string' && body.bedType.trim() ? body.bedType.trim() : cur.bedType,
      };
      await writeJson('rooms.json', rooms);
      return rooms[idx];
    });

    if (!updated) {
      res.status(404).json({ error: 'Room listing not found.' });
      return;
    }

    res.json({ message: 'Room updated successfully.', room: updated });
  } catch (err) {
    console.error('[Rooms] PUT /:id error:', err);
    res.status(500).json({ error: 'Unable to update room.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const removed = await withFileLock('rooms.json', async () => {
      const rooms = await readJson<Room[]>('rooms.json', []);
      const filtered = rooms.filter((r) => r.id !== id);
      if (filtered.length === rooms.length) return false;
      await writeJson('rooms.json', filtered);
      return true;
    });

    if (!removed) {
      res.status(404).json({ error: 'Room listing not found.' });
      return;
    }
    res.json({ message: 'Room listing deleted successfully.' });
  } catch (err) {
    console.error('[Rooms] DELETE /:id error:', err);
    res.status(500).json({ error: 'Unable to delete room.' });
  }
});

export default router;
