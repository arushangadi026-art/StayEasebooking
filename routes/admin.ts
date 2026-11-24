import { Router } from 'express';
import { readJson, writeJson, withFileLock } from '../services/storage.ts';
import { invalidateUserSessions } from '../services/authStore.ts';
import { requireAdmin } from '../middleware/auth.ts';
import type {
  Hotel,
  Room,
  User,
  Booking,
  Review,
  ContactMessage,
  EventRegistration,
  AdminStats,
} from '../shared/types.ts';

const router = Router();

router.use(requireAdmin);

router.get('/stats', async (_req, res) => {
  try {
    const [hotels, rooms, users, bookings, reviews, messages, eventRegs] =
      await Promise.all([
        readJson<Hotel[]>('hotels.json', []),
        readJson<Room[]>('rooms.json', []),
        readJson<User[]>('users.json', []),
        readJson<Booking[]>('bookings.json', []),
        readJson<Review[]>('reviews.json', []),
        readJson<ContactMessage[]>('messages.json', []),
        readJson<EventRegistration[]>('eventRegistrations.json', []),
      ]);

    const pendingBookings = bookings.filter((b) => b.status === 'Pending').length;
    const confirmedBookings = bookings.filter((b) => b.status === 'Confirmed').length;
    const completedBookings = bookings.filter((b) => b.status === 'Completed').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'Cancelled').length;
    const estimatedRevenue = bookings
      .filter((b) => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + b.pricing.estimatedTotal, 0);

    const stats: AdminStats = {
      totalHotels: hotels.length,
      totalRooms: rooms.length,
      totalInventoryUnits: rooms.reduce((sum, r) => sum + r.totalInventory, 0),
      totalCustomers: users.filter((u) => u.role === 'customer').length,
      totalBookings: bookings.length,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      estimatedRevenue,
      totalReviews: reviews.length,
      totalMessages: messages.length,
      totalEventRegistrations: eventRegs.length,
    };

    res.json({ stats });
  } catch (err) {
    console.error('[Admin] GET /stats error:', err);
    res.status(500).json({ error: 'Unable to calculate dashboard statistics.' });
  }
});

router.get('/customers', async (_req, res) => {
  try {
    const [users, bookings] = await Promise.all([
      readJson<User[]>('users.json', []),
      readJson<Booking[]>('bookings.json', []),
    ]);

    const customers = users
      .filter((u) => u.role === 'customer')
      .map(({ passwordHash: _ignored, ...pub }) => {
        const userBookings = bookings.filter((b) => b.userId === pub.id);
        const totalSpent = userBookings
          .filter((b) => b.status !== 'Cancelled')
          .reduce((sum, b) => sum + b.pricing.estimatedTotal, 0);
        return {
          ...pub,
          bookingCount: userBookings.length,
          totalSpent,
          bookings: userBookings,
        };
      });

    res.json({ customers, total: customers.length });
  } catch (err) {
    console.error('[Admin] GET /customers error:', err);
    res.status(500).json({ error: 'Unable to load customer records.' });
  }
});

router.put('/customers/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body ?? {};
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'isActive boolean value is required.' });
      return;
    }

    const updated = await withFileLock('users.json', async () => {
      const users = await readJson<User[]>('users.json', []);
      const idx = users.findIndex((u) => u.id === req.params.id && u.role === 'customer');
      if (idx === -1) return null;

      users[idx] = { ...users[idx], isActive };
      await writeJson('users.json', users);
      const { passwordHash: _ignored, ...pub } = users[idx];
      return pub;
    });

    if (!updated) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    if (!isActive) {
      invalidateUserSessions(updated.id);
    }

    res.json({
      message: isActive ? 'Customer access restored.' : 'Customer access suspended.',
      customer: updated,
    });
  } catch (err) {
    console.error('[Admin] PUT /customers/:id/status error:', err);
    res.status(500).json({ error: 'Unable to update customer access.' });
  }
});

export default router;
