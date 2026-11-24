import { Router } from 'express';
import crypto from 'crypto';
import { readJson, writeJson, withFileLock, generateId } from '../services/storage.ts';
import { PROMOTIONAL_EVENTS } from '../services/seedData.ts';
import { optionalAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import type { EventRegistration } from '../shared/types.ts';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const registrations = await readJson<EventRegistration[]>('eventRegistrations.json', []);
    const isAdmin = req.user?.role === 'admin';

    const eventsWithCounts = PROMOTIONAL_EVENTS.map((ev) => {
      const bookedGuests = registrations
        .filter((r) => r.eventId === ev.id)
        .reduce((sum, r) => sum + r.guestsCount, 0);
      return {
        ...ev,
        registeredGuests: bookedGuests,
        seatsRemaining: Math.max(0, ev.seatsAvailable - bookedGuests),
      };
    });

    // Public view returns anonymized count + recent public initials; Admin gets full records
    const visibleRegistrations = isAdmin
      ? registrations
      : registrations.map((r) => ({
          id: r.id,
          registrationRef: r.registrationRef,
          eventId: r.eventId,
          eventTitle: r.eventTitle,
          fullName: r.fullName,
          guestsCount: r.guestsCount,
          createdAt: r.createdAt,
        }));

    res.json({
      events: eventsWithCounts,
      registrations: visibleRegistrations,
      totalRegistrations: registrations.length,
    });
  } catch (err) {
    console.error('[Events] GET / error:', err);
    res.status(500).json({ error: 'Unable to load promotional events.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { eventId, fullName, email, mobile, guestsCount, notes } = req.body ?? {};
    const event = PROMOTIONAL_EVENTS.find((e) => e.id === eventId);
    if (!event) {
      res.status(400).json({ error: 'Please select a valid promotional event.' });
      return;
    }
    if (typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      res.status(400).json({ error: 'Valid email address is required.' });
      return;
    }
    if (typeof mobile !== 'string' || mobile.trim().length < 8) {
      res.status(400).json({ error: 'Valid mobile number is required.' });
      return;
    }
    const guests = Math.max(1, Math.min(10, Number(guestsCount) || 1));

    const saved = await withFileLock('eventRegistrations.json', async () => {
      const list = await readJson<EventRegistration[]>('eventRegistrations.json', []);
      const bookedGuests = list
        .filter((r) => r.eventId === event.id)
        .reduce((sum, r) => sum + r.guestsCount, 0);

      if (bookedGuests + guests > event.seatsAvailable) {
        return null;
      }

      const registration: EventRegistration = {
        id: generateId('evr'),
        registrationRef: `SE-EVT-${crypto.randomInt(400, 999)}`,
        eventId: event.id,
        eventTitle: event.title,
        fullName: fullName.trim().slice(0, 100),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim().slice(0, 20),
        guestsCount: guests,
        notes: typeof notes === 'string' ? notes.trim().slice(0, 300) : '',
        createdAt: new Date().toISOString(),
      };
      list.unshift(registration);
      await writeJson('eventRegistrations.json', list);
      return registration;
    });

    if (!saved) {
      res.status(409).json({ error: 'Not enough seats remaining for this event.' });
      return;
    }

    res.status(201).json({
      message: `Event registration confirmed! Reference ${saved.registrationRef}`,
      registration: saved,
    });
  } catch (err) {
    console.error('[Events] POST / error:', err);
    res.status(500).json({ error: 'Unable to complete event registration.' });
  }
});

export default router;
