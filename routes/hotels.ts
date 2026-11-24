import { Router } from 'express';
import { readJson, writeJson, withFileLock, generateId } from '../services/storage.ts';
import { requireAdmin } from '../middleware/auth.ts';
import { IMG } from '../services/seedData.ts';
import type { Hotel, Room, Review, HotelCategory } from '../shared/types.ts';

const router = Router();

const VALID_CATEGORIES = new Set<HotelCategory>([
  'Budget',
  'Standard',
  'Premium',
  'Luxury',
  'Resort',
  'Boutique',
]);

router.get('/', async (req, res) => {
  try {
    const [hotels, rooms] = await Promise.all([
      readJson<Hotel[]>('hotels.json', []),
      readJson<Room[]>('rooms.json', []),
    ]);

    // Sync startingPrice dynamically from lowest room price if rooms exist
    const enriched = hotels.map((hotel) => {
      const hotelRooms = rooms.filter((r) => r.hotelId === hotel.id);
      const minPrice =
        hotelRooms.length > 0
          ? Math.min(...hotelRooms.map((r) => r.pricePerNight))
          : hotel.startingPrice;
      return {
        ...hotel,
        startingPrice: minPrice,
        roomCount: hotelRooms.length,
        roomCategories: [...new Set(hotelRooms.map((r) => r.category))],
      };
    });

    const {
      search,
      city,
      category,
      stars,
      minPrice,
      maxPrice,
      facility,
      availableOnly,
      sort,
      featured,
    } = req.query;

    let result = enriched;

    if (typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.address.toLowerCase().includes(q) ||
          h.category.toLowerCase().includes(q)
      );
    }

    if (typeof city === 'string' && city.trim() && city !== 'All') {
      const c = city.trim().toLowerCase();
      result = result.filter((h) => h.city.toLowerCase() === c);
    }

    if (typeof category === 'string' && category.trim() && category !== 'All') {
      result = result.filter((h) => h.category === category);
    }

    if (typeof stars === 'string' && stars.trim() && stars !== 'All') {
      const starNum = Number(stars);
      if (!Number.isNaN(starNum)) {
        result = result.filter((h) => h.starCategory === starNum);
      }
    }

    if (typeof minPrice === 'string' && minPrice.trim()) {
      const minP = Number(minPrice);
      if (!Number.isNaN(minP)) {
        result = result.filter((h) => h.startingPrice >= minP);
      }
    }

    if (typeof maxPrice === 'string' && maxPrice.trim()) {
      const maxP = Number(maxPrice);
      if (!Number.isNaN(maxP)) {
        result = result.filter((h) => h.startingPrice <= maxP);
      }
    }

    if (typeof facility === 'string' && facility.trim()) {
      const reqFacilities = facility
        .split(',')
        .map((f) => f.trim().toLowerCase())
        .filter(Boolean);
      if (reqFacilities.length > 0) {
        result = result.filter((h) =>
          reqFacilities.every((rf) =>
            h.facilities.some((hf) => hf.toLowerCase() === rf)
          )
        );
      }
    }

    if (availableOnly === 'true') {
      result = result.filter((h) => h.isAvailable);
    }

    if (featured === 'true') {
      result = result.filter((h) => h.featured);
    }

    if (sort === 'price_asc') {
      result.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sort === 'price_desc') {
      result.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sort === 'rating_desc') {
      result.sort((a, b) => b.rating - a.rating);
    }

    res.json({ hotels: result, total: result.length });
  } catch (err) {
    console.error('[Hotels] GET / error:', err);
    res.status(500).json({ error: 'Unable to load hotels catalogue.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [hotels, rooms, reviews] = await Promise.all([
      readJson<Hotel[]>('hotels.json', []),
      readJson<Room[]>('rooms.json', []),
      readJson<Review[]>('reviews.json', []),
    ]);

    const hotel = hotels.find((h) => h.id === req.params.id);
    if (!hotel) {
      res.status(404).json({ error: 'Hotel not found.' });
      return;
    }

    const hotelRooms = rooms.filter((r) => r.hotelId === hotel.id);
    const hotelReviews = reviews
      .filter((rv) => rv.hotelId === hotel.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json({ hotel, rooms: hotelRooms, reviews: hotelReviews });
  } catch (err) {
    console.error('[Hotels] GET /:id error:', err);
    res.status(500).json({ error: 'Unable to load hotel details.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      city,
      address,
      category,
      starCategory,
      description,
      facilities,
      startingPrice,
      isAvailable,
      checkInTime,
      checkOutTime,
      image,
      featured,
    } = req.body ?? {};

    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Hotel name is required.' });
      return;
    }
    if (typeof city !== 'string' || city.trim().length < 2) {
      res.status(400).json({ error: 'City / destination is required.' });
      return;
    }
    const parsedCat = VALID_CATEGORIES.has(category) ? (category as HotelCategory) : 'Standard';
    const parsedStars = [3, 4, 5].includes(Number(starCategory))
      ? (Number(starCategory) as 3 | 4 | 5)
      : 4;
    const parsedPrice = Math.max(500, Number(startingPrice) || 3500);

    const safeImage =
      typeof image === 'string' && image.startsWith('/src/assets/images/')
        ? image
        : IMG.URBAN;

    const newHotel = await withFileLock('hotels.json', async () => {
      const hotels = await readJson<Hotel[]>('hotels.json', []);
      const hotel: Hotel = {
        id: generateId('htl'),
        name: name.trim().slice(0, 120),
        city: city.trim().slice(0, 60),
        address:
          typeof address === 'string' && address.trim()
            ? address.trim().slice(0, 200)
            : `${city.trim()}, India`,
        category: parsedCat,
        starCategory: parsedStars,
        description:
          typeof description === 'string' && description.trim()
            ? description.trim().slice(0, 600)
            : 'Curated STAYEASE demonstration property offering serene hospitality.',
        images: [safeImage, IMG.SUITE, IMG.DELUXE],
        facilities: Array.isArray(facilities)
          ? facilities.filter((f): f is string => typeof f === 'string' && f.trim().length > 0).slice(0, 12)
          : ['Free Wi-Fi', 'Fine Dining', 'Valet Parking'],
        startingPrice: parsedPrice,
        rating: 4.6,
        reviewCount: 0,
        isAvailable: isAvailable !== false,
        checkInTime: typeof checkInTime === 'string' && checkInTime.trim() ? checkInTime.trim() : '2:00 PM',
        checkOutTime: typeof checkOutTime === 'string' && checkOutTime.trim() ? checkOutTime.trim() : '11:00 AM',
        isDemoListing: true,
        featured: Boolean(featured),
      };
      hotels.unshift(hotel);
      await writeJson('hotels.json', hotels);
      return hotel;
    });

    res.status(201).json({ message: 'Hotel added successfully.', hotel: newHotel });
  } catch (err) {
    console.error('[Hotels] POST / error:', err);
    res.status(500).json({ error: 'Unable to create hotel.' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body ?? {};

    const updated = await withFileLock('hotels.json', async () => {
      const hotels = await readJson<Hotel[]>('hotels.json', []);
      const idx = hotels.findIndex((h) => h.id === id);
      if (idx === -1) return null;

      const current = hotels[idx];
      const next: Hotel = {
        ...current,
        name: typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 120) : current.name,
        city: typeof body.city === 'string' && body.city.trim() ? body.city.trim().slice(0, 60) : current.city,
        address: typeof body.address === 'string' && body.address.trim() ? body.address.trim().slice(0, 200) : current.address,
        category: VALID_CATEGORIES.has(body.category) ? body.category : current.category,
        starCategory: [3, 4, 5].includes(Number(body.starCategory))
          ? (Number(body.starCategory) as 3 | 4 | 5)
          : current.starCategory,
        description:
          typeof body.description === 'string' && body.description.trim()
            ? body.description.trim().slice(0, 600)
            : current.description,
        facilities: Array.isArray(body.facilities)
          ? body.facilities.filter((f: unknown): f is string => typeof f === 'string' && f.trim().length > 0)
          : current.facilities,
        startingPrice:
          body.startingPrice !== undefined && !Number.isNaN(Number(body.startingPrice))
            ? Math.max(500, Number(body.startingPrice))
            : current.startingPrice,
        isAvailable: typeof body.isAvailable === 'boolean' ? body.isAvailable : current.isAvailable,
        featured: typeof body.featured === 'boolean' ? body.featured : current.featured,
      };
      hotels[idx] = next;
      await writeJson('hotels.json', hotels);
      return next;
    });

    if (!updated) {
      res.status(404).json({ error: 'Hotel not found.' });
      return;
    }

    res.json({ message: 'Hotel updated successfully.', hotel: updated });
  } catch (err) {
    console.error('[Hotels] PUT /:id error:', err);
    res.status(500).json({ error: 'Unable to update hotel.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const removed = await withFileLock('hotels.json', async () => {
      const hotels = await readJson<Hotel[]>('hotels.json', []);
      const filtered = hotels.filter((h) => h.id !== id);
      if (filtered.length === hotels.length) return false;
      await writeJson('hotels.json', filtered);
      return true;
    });

    if (!removed) {
      res.status(404).json({ error: 'Hotel not found.' });
      return;
    }

    // Cascade-clean associated rooms
    await withFileLock('rooms.json', async () => {
      const rooms = await readJson<Room[]>('rooms.json', []);
      await writeJson(
        'rooms.json',
        rooms.filter((r) => r.hotelId !== id)
      );
    });

    res.json({ message: 'Hotel and associated room listings deleted.' });
  } catch (err) {
    console.error('[Hotels] DELETE /:id error:', err);
    res.status(500).json({ error: 'Unable to delete hotel.' });
  }
});

export default router;
