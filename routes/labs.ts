import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { DATA_DIR } from '../services/storage.ts';
import { generateWordBuffer, type DocType } from '../services/wordDocs.ts';
import type { Hotel, Room, Booking, User } from '../shared/types.ts';

const router = Router();

/**
 * LAB 4: Read JSON File Using Node.js (fs.promises + async/await + error handling)
 * Generates Hotel List, Room Prices, Booking Summary, and Customer Booking Report.
 */
router.get('/labs/report', async (_req, res) => {
  try {
    const readSafe = async <T>(file: string): Promise<T[]> => {
      const fullPath = path.resolve(DATA_DIR, file);
      if (!fullPath.startsWith(DATA_DIR + path.sep)) {
        throw new Error('Unsafe path rejected.');
      }
      const raw = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(raw) as T[];
    };

    const [hotels, rooms, bookings, users] = await Promise.all([
      readSafe<Hotel>('hotels.json'),
      readSafe<Room>('rooms.json'),
      readSafe<Booking>('bookings.json'),
      readSafe<User>('users.json'),
    ]);

    const hotelList = hotels.map((h) => ({
      id: h.id,
      name: h.name,
      city: h.city,
      category: h.category,
      starCategory: h.starCategory,
      startingPrice: h.startingPrice,
      isAvailable: h.isAvailable,
    }));

    const roomPrices = rooms.map((r) => {
      const hotel = hotels.find((h) => h.id === r.hotelId);
      return {
        roomId: r.id,
        hotelName: hotel?.name ?? 'Unknown',
        category: r.category,
        pricePerNight: r.pricePerNight,
        totalInventory: r.totalInventory,
      };
    });

    const bookingSummary = {
      totalBookings: bookings.length,
      confirmed: bookings.filter((b) => b.status === 'Confirmed').length,
      pending: bookings.filter((b) => b.status === 'Pending').length,
      completed: bookings.filter((b) => b.status === 'Completed').length,
      cancelled: bookings.filter((b) => b.status === 'Cancelled').length,
      totalEstimatedValueINR: bookings
        .filter((b) => b.status !== 'Cancelled')
        .reduce((sum, b) => sum + b.pricing.estimatedTotal, 0),
    };

    const customerBookingReport = users
      .filter((u) => u.role === 'customer')
      .map((u) => {
        const custBookings = bookings.filter((b) => b.userId === u.id);
        return {
          customerName: u.fullName,
          city: u.city ?? 'India',
          totalBookings: custBookings.length,
          totalEstimatedSpendINR: custBookings
            .filter((b) => b.status !== 'Cancelled')
            .reduce((sum, b) => sum + b.pricing.estimatedTotal, 0),
        };
      });

    res.json({
      generatedAt: new Date().toISOString(),
      source: 'Node.js fs.promises.readFile (Lab 4 Async/Await Demonstration)',
      hotelList,
      roomPrices,
      bookingSummary,
      customerBookingReport,
    });
  } catch (err) {
    console.error('[Lab 4] JSON Report generation failed:', err);
    res.status(500).json({ error: 'Failed to read JSON files for Lab 4 report.' });
  }
});

/**
 * LAB 6: Documented MongoDB CRUD Practical Demonstration (HotelDB)
 */
router.get('/labs/mongodb-guide', (_req, res) => {
  res.json({
    database: 'HotelDB',
    collection: 'hotels',
    note: 'STAYEASE uses local JSON file storage as its primary zero-dependency engine. This Lab 6 practical demonstrates equivalent MongoDB CRUD commands for academic viva evaluation.',
    commands: [
      {
        step: '1. Create / Switch Database',
        command: 'use HotelDB',
        explanation: 'Creates the HotelDB database in MongoDB shell and switches active context to it.',
      },
      {
        step: '2. Create Collection',
        command: 'db.createCollection("hotels")',
        explanation: 'Explicitly initializes the hotels collection to store STAYEASE hotel documents.',
      },
      {
        step: '3. insertOne()',
        command: `db.hotels.insertOne({
  hotelId: "htl_01",
  name: "The Verandah on Lavelle",
  city: "Bengaluru",
  category: "Luxury",
  starCategory: 5,
  startingPriceINR: 7800,
  isAvailable: true,
  isDemoListing: true
})`,
        explanation: 'Adds a single new hotel property document — equivalent to Admin Add Hotel in STAYEASE.',
      },
      {
        step: '4. insertMany()',
        command: `db.hotels.insertMany([
  { hotelId: "htl_02", name: "Deccan Sandalwood Palace", city: "Mysuru", category: "Luxury", starCategory: 5, startingPriceINR: 8900 },
  { hotelId: "htl_03", name: "Aurelia Palm Retreat", city: "Goa", category: "Resort", starCategory: 5, startingPriceINR: 9200 },
  { hotelId: "htl_04", name: "Deodar Hearth Lodge", city: "Manali", category: "Boutique", starCategory: 4, startingPriceINR: 6400 }
])`,
        explanation: 'Bulk-loads multiple demonstration properties across Indian destinations in one operation.',
      },
      {
        step: '5. find().pretty()',
        command: 'db.hotels.find({ starCategory: 5 }).pretty()',
        explanation: 'Retrieves matching 5-star hotel documents in indented, human-readable JSON format — analogous to STAYEASE hotel filtering.',
      },
      {
        step: '6. countDocuments()',
        command: 'db.hotels.countDocuments({ city: "Bengaluru" })',
        explanation: 'Counts hotel documents matching a filter, mirroring STAYEASE Admin Dashboard KPI statistics.',
      },
      {
        step: '7. deleteOne()',
        command: 'db.hotels.deleteOne({ hotelId: "htl_10" })',
        explanation: 'Deletes a single specified hotel document from the collection — equivalent to Admin Delete Hotel.',
      },
    ],
  });
});

/**
 * Downloadable Microsoft Word (.docx) Academic Documents
 */
const VALID_DOC_TYPES = new Set<DocType>(['backend', 'database', 'frontend', 'report']);

router.get('/docs/download/:type', async (req, res) => {
  try {
    const rawType = req.params.type as DocType;
    if (!VALID_DOC_TYPES.has(rawType)) {
      res.status(400).json({ error: 'Invalid document type requested.' });
      return;
    }

    const { filename, buffer } = await generateWordBuffer(rawType);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.send(buffer);
  } catch (err) {
    console.error('[Docs] Word generation failed:', err);
    res.status(500).json({ error: 'Unable to generate Word document.' });
  }
});

export default router;
