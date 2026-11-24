import { Router } from 'express';
import crypto from 'crypto';
import { readJson, writeJson, withFileLock, generateId } from '../services/storage.ts';
import { requireAuth, requireAdmin, type AuthenticatedRequest } from '../middleware/auth.ts';
import { datesOverlap } from './rooms.ts';
import type { Booking, Hotel, Room, BookingStatus } from '../shared/types.ts';

const router = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_STATUSES = new Set<BookingStatus>([
  'Pending',
  'Confirmed',
  'Cancelled',
  'Completed',
]);

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T00:00:00Z`).getTime();
  const end = new Date(`${checkOut}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function sumAdditionalCharges(...charges: number[]): number {
  return charges.reduce((acc, value) => acc + value, 0);
}

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const bookings = await readJson<Booking[]>('bookings.json', []);
    const isAdmin = req.user!.role === 'admin';
    const filtered = isAdmin
      ? bookings
      : bookings.filter((b) => b.userId === req.user!.id);

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ bookings: filtered, total: filtered.length });
  } catch (err) {
    console.error('[Bookings] GET / error:', err);
    res.status(500).json({ error: 'Unable to load bookings.' });
  }
});

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const bookings = await readJson<Booking[]>('bookings.json', []);
    const booking = bookings.find(
      (b) => b.id === req.params.id || b.bookingRef === req.params.id
    );
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    if (req.user!.role !== 'admin' && booking.userId !== req.user!.id) {
      res.status(403).json({ error: 'You do not have permission to view this booking.' });
      return;
    }
    res.json({ booking });
  } catch (err) {
    console.error('[Bookings] GET /:id error:', err);
    res.status(500).json({ error: 'Unable to fetch booking details.' });
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      hotelId,
      roomId,
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
    } = req.body ?? {};

    if (typeof checkIn !== 'string' || typeof checkOut !== 'string' || !DATE_RE.test(checkIn) || !DATE_RE.test(checkOut)) {
      res.status(400).json({ error: 'Please select valid check-in and check-out dates.' });
      return;
    }

    const nights = calculateNights(checkIn, checkOut);
    if (nights < 1 || nights > 30) {
      res.status(400).json({
        error: 'Check-out date must be at least 1 night after check-in (maximum 30 nights).',
      });
      return;
    }

    const requestedRooms = Math.max(1, Math.min(10, Number(numRooms) || 1));
    const requestedGuests = Math.max(1, Math.min(20, Number(guests) || 2));

    const [hotels, rooms] = await Promise.all([
      readJson<Hotel[]>('hotels.json', []),
      readJson<Room[]>('rooms.json', []),
    ]);

    const hotel = hotels.find((h) => h.id === hotelId);
    if (!hotel || !hotel.isAvailable) {
      res.status(400).json({ error: 'Selected hotel is currently unavailable for booking.' });
      return;
    }

    const room = rooms.find((r) => r.id === roomId && r.hotelId === hotel.id);
    if (!room) {
      res.status(400).json({ error: 'Selected room category does not belong to this hotel.' });
      return;
    }

    if (requestedGuests > room.maxGuests * requestedRooms) {
      res.status(400).json({
        error: `Selected rooms accommodate up to ${room.maxGuests * requestedRooms} guests. Please increase the number of rooms.`,
      });
      return;
    }

    const result = await withFileLock('bookings.json', async () => {
      const bookings = await readJson<Booking[]>('bookings.json', []);
      const overlappingBooked = bookings
        .filter(
          (b) =>
            b.roomId === room.id &&
            b.status !== 'Cancelled' &&
            datesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)
        )
        .reduce((sum, b) => sum + b.numRooms, 0);

      const remainingInventory = room.totalInventory - overlappingBooked;
      if (requestedRooms > remainingInventory) {
        return {
          error:
            remainingInventory <= 0
              ? 'No rooms of this category are available for your selected dates.'
              : `Only ${remainingInventory} room(s) available for the chosen dates.`,
        };
      }

      const baseSubtotal = room.pricePerNight * nights * requestedRooms;
      const breakfastCharge = addBreakfast ? 700 * nights * requestedRooms : 0;
      const transferCharge = addAirportTransfer ? 1500 : 0;
      const additionalCharges = sumAdditionalCharges(breakfastCharge, transferCharge);
      const taxes = Math.round((baseSubtotal + additionalCharges) * 0.12);
      const estimatedTotal = baseSubtotal + additionalCharges + taxes;

      const year = new Date().getFullYear();
      const suffix = crypto.randomInt(1000, 9999);
      const bookingRef = `SE-${year}-${suffix}`;

      const booking: Booking = {
        id: generateId('bkg'),
        bookingRef,
        userId: req.user!.id,
        customerName:
          typeof customerName === 'string' && customerName.trim().length >= 2
            ? customerName.trim().slice(0, 100)
            : req.user!.fullName,
        customerEmail:
          typeof customerEmail === 'string' && customerEmail.includes('@')
            ? customerEmail.trim().toLowerCase()
            : req.user!.email,
        customerMobile:
          typeof customerMobile === 'string' && customerMobile.trim().length >= 8
            ? customerMobile.trim().slice(0, 20)
            : req.user!.mobile,
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelCity: hotel.city,
        roomId: room.id,
        roomCategory: room.category,
        checkIn,
        checkOut,
        guests: requestedGuests,
        numRooms: requestedRooms,
        specialRequests:
          typeof specialRequests === 'string' ? specialRequests.trim().slice(0, 400) : '',
        addBreakfast: Boolean(addBreakfast),
        addAirportTransfer: Boolean(addAirportTransfer),
        pricing: {
          nights,
          roomPrice: room.pricePerNight,
          numRooms: requestedRooms,
          baseSubtotal,
          additionalCharges,
          taxes,
          estimatedTotal,
        },
        status: 'Confirmed',
        paymentSummaryNote:
          'Academic Demonstration Payment Summary — Sample INR prices; no real card or payment collected.',
        createdAt: new Date().toISOString(),
      };

      bookings.unshift(booking);
      await writeJson('bookings.json', bookings);
      return { booking };
    });

    if ('error' in result) {
      res.status(409).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: `Booking confirmed! Reference ${result.booking.bookingRef}`,
      booking: result.booking,
    });
  } catch (err) {
    console.error('[Bookings] POST / error:', err);
    res.status(500).json({ error: 'Unable to complete your reservation.' });
  }
});

router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body ?? {};

    if (!VALID_STATUSES.has(status)) {
      res.status(400).json({ error: 'Invalid booking status provided.' });
      return;
    }

    const result = await withFileLock('bookings.json', async () => {
      const bookings = await readJson<Booking[]>('bookings.json', []);
      const idx = bookings.findIndex((b) => b.id === id);
      if (idx === -1) return { code: 404 as const, error: 'Booking not found.' };

      const target = bookings[idx];
      const isAdmin = req.user!.role === 'admin';

      if (!isAdmin) {
        if (target.userId !== req.user!.id) {
          return { code: 403 as const, error: 'You cannot modify another customer’s booking.' };
        }
        if (status !== 'Cancelled') {
          return { code: 403 as const, error: 'Customers may only cancel eligible bookings.' };
        }
        if (target.status === 'Completed' || target.status === 'Cancelled') {
          return {
            code: 400 as const,
            error: `Cannot cancel a booking that is already ${target.status.toLowerCase()}.`,
          };
        }
      }

      bookings[idx] = { ...target, status };
      await writeJson('bookings.json', bookings);
      return { code: 200 as const, booking: bookings[idx] };
    });

    if (result.code !== 200) {
      res.status(result.code).json({ error: result.error });
      return;
    }

    res.json({
      message: `Booking status updated to ${result.booking.status}.`,
      booking: result.booking,
    });
  } catch (err) {
    console.error('[Bookings] PUT /:id error:', err);
    res.status(500).json({ error: 'Unable to update booking status.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await withFileLock('bookings.json', async () => {
      const bookings = await readJson<Booking[]>('bookings.json', []);
      const filtered = bookings.filter((b) => b.id !== id);
      if (filtered.length === bookings.length) return false;
      await writeJson('bookings.json', filtered);
      return true;
    });

    if (!deleted) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    res.json({ message: 'Booking record deleted.' });
  } catch (err) {
    console.error('[Bookings] DELETE /:id error:', err);
    res.status(500).json({ error: 'Unable to delete booking.' });
  }
});

export default router;
