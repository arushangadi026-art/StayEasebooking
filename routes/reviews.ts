import { Router } from 'express';
import { readJson, writeJson, withFileLock, generateId } from '../services/storage.ts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import type { Review, Booking, Hotel } from '../shared/types.ts';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const reviews = await readJson<Review[]>('reviews.json', []);
    const { hotelId } = req.query;
    const filtered =
      typeof hotelId === 'string' && hotelId.trim()
        ? reviews.filter((r) => r.hotelId === hotelId)
        : reviews;
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ reviews: filtered, total: filtered.length });
  } catch (err) {
    console.error('[Reviews] GET / error:', err);
    res.status(500).json({ error: 'Unable to load guest reviews.' });
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { hotelId, rating, title, comment } = req.body ?? {};
    const numRating = Number(rating);

    if (typeof hotelId !== 'string' || !hotelId.trim()) {
      res.status(400).json({ error: 'Hotel identifier is required.' });
      return;
    }
    if (Number.isNaN(numRating) || numRating < 1 || numRating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
      return;
    }
    if (typeof comment !== 'string' || comment.trim().length < 10) {
      res.status(400).json({ error: 'Please write a review of at least 10 characters.' });
      return;
    }

    const [hotels, bookings] = await Promise.all([
      readJson<Hotel[]>('hotels.json', []),
      readJson<Booking[]>('bookings.json', []),
    ]);

    const hotel = hotels.find((h) => h.id === hotelId);
    if (!hotel) {
      res.status(404).json({ error: 'Hotel not found.' });
      return;
    }

    const hasEligibleStay =
      req.user!.role === 'admin' ||
      bookings.some(
        (b) =>
          b.userId === req.user!.id &&
          b.hotelId === hotelId &&
          (b.status === 'Completed' || b.status === 'Confirmed')
      );

    if (!hasEligibleStay) {
      res.status(403).json({
        error: 'You can submit a review after having a confirmed or completed stay at this property.',
      });
      return;
    }

    const review = await withFileLock('reviews.json', async () => {
      const reviews = await readJson<Review[]>('reviews.json', []);
      const created: Review = {
        id: generateId('rev'),
        hotelId: hotel.id,
        hotelName: hotel.name,
        userId: req.user!.id,
        customerName: req.user!.fullName,
        rating: Math.round(numRating),
        title:
          typeof title === 'string' && title.trim()
            ? title.trim().slice(0, 100)
            : 'Memorable stay at STAYEASE',
        comment: comment.trim().slice(0, 600),
        stayDate: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        createdAt: new Date().toISOString(),
      };
      reviews.unshift(created);
      await writeJson('reviews.json', reviews);

      // Update demonstration rating on hotel
      const hotelReviews = reviews.filter((r) => r.hotelId === hotel.id);
      const avg =
        hotelReviews.reduce((acc, r) => acc + r.rating, 0) / hotelReviews.length;

      await withFileLock('hotels.json', async () => {
        const allHotels = await readJson<Hotel[]>('hotels.json', []);
        const idx = allHotels.findIndex((h) => h.id === hotel.id);
        if (idx !== -1) {
          allHotels[idx] = {
            ...allHotels[idx],
            rating: Number(avg.toFixed(1)),
            reviewCount: hotelReviews.length,
          };
          await writeJson('hotels.json', allHotels);
        }
      });

      return created;
    });

    res.status(201).json({ message: 'Thank you for sharing your guest review!', review });
  } catch (err) {
    console.error('[Reviews] POST / error:', err);
    res.status(500).json({ error: 'Unable to submit review.' });
  }
});

export default router;
