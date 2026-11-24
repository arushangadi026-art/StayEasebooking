import { Router } from 'express';
import { readJson, writeJson, withFileLock, generateId } from '../services/storage.ts';
import { requireAdmin } from '../middleware/auth.ts';
import type { ContactMessage } from '../shared/types.ts';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  try {
    const { name, email, mobile, subject, message } = req.body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your name.' });
      return;
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (typeof mobile !== 'string' || mobile.trim().length < 8) {
      res.status(400).json({ error: 'Please enter a valid mobile number.' });
      return;
    }
    if (typeof subject !== 'string' || subject.trim().length < 3) {
      res.status(400).json({ error: 'Please provide a subject.' });
      return;
    }
    if (typeof message !== 'string' || message.trim().length < 10) {
      res.status(400).json({ error: 'Please write a message of at least 10 characters.' });
      return;
    }

    const saved = await withFileLock('messages.json', async () => {
      const messages = await readJson<ContactMessage[]>('messages.json', []);
      const entry: ContactMessage = {
        id: generateId('msg'),
        name: name.trim().slice(0, 100),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim().slice(0, 20),
        subject: subject.trim().slice(0, 140),
        message: message.trim().slice(0, 1000),
        createdAt: new Date().toISOString(),
      };
      messages.unshift(entry);
      await writeJson('messages.json', messages);
      return entry;
    });

    res.status(201).json({
      message: 'Your inquiry has been received. Our concierge team will respond shortly.',
      contactMessage: saved,
    });
  } catch (err) {
    console.error('[Contact] POST / error:', err);
    res.status(500).json({ error: 'Unable to submit your message.' });
  }
});

router.get('/', requireAdmin, async (_req, res) => {
  try {
    const messages = await readJson<ContactMessage[]>('messages.json', []);
    res.json({ messages, total: messages.length });
  } catch (err) {
    console.error('[Contact] GET / error:', err);
    res.status(500).json({ error: 'Unable to load contact messages.' });
  }
});

export default router;
