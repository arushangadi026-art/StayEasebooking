import fs from 'fs/promises';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';

export type DocType = 'backend' | 'database' | 'frontend' | 'report';

const DOC_FILENAMES: Record<DocType, string> = {
  backend: 'STAYEASE_Backend_Documentation.docx',
  database: 'STAYEASE_Database_Documentation.docx',
  frontend: 'STAYEASE_Frontend_Documentation.docx',
  report: 'STAYEASE_BCA_Project_Report.docx',
};

const BRAND_ESPRESSO = '2D1D14';
const BRAND_COFFEE = '4A3426';
const BRAND_CARAMEL = 'A66A38';
const BRAND_CREAM_BG = 'F2EAE0';
const BRAND_BORDER = 'D9C7B2';

function titleBlock(title: string, subtitle: string): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'STAYEASE — HOTEL BOOKING & MANAGEMENT SYSTEM',
          bold: true,
          size: 20,
          color: BRAND_CARAMEL,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 36,
          color: BRAND_ESPRESSO,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
      children: [
        new TextRun({
          text: subtitle,
          italics: true,
          size: 22,
          color: BRAND_COFFEE,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [
        new TextRun({
          text: 'BCA III Semester — Server-Side Web Development Project | KLE Technological University Syllabus',
          size: 20,
          color: BRAND_COFFEE,
        }),
      ],
    }),
  ];
}

function h1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        color: BRAND_ESPRESSO,
      }),
    ],
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 23,
        color: BRAND_CARAMEL,
      }),
    ],
  });
}

function p(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [
      new TextRun({
        text,
        size: 21,
        color: '33241B',
      }),
    ],
  });
}

function bullet(label: string, text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 260 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 21, color: BRAND_ESPRESSO }),
      new TextRun({ text, size: 21, color: '33241B' }),
    ],
  });
}

function simpleTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (head) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: BRAND_CREAM_BG },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_CARAMEL },
            left: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BORDER },
            right: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BORDER },
          },
          children: [
            new Paragraph({
              spacing: { before: 60, after: 60 },
              children: [
                new TextRun({ text: head, bold: true, size: 20, color: BRAND_ESPRESSO }),
              ],
            }),
          ],
        })
    ),
  });

  const dataRows = rows.map(
    (cells) =>
      new TableRow({
        children: cells.map(
          (val) =>
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 2, color: BRAND_BORDER },
                bottom: { style: BorderStyle.SINGLE, size: 2, color: BRAND_BORDER },
                left: { style: BorderStyle.SINGLE, size: 2, color: BRAND_BORDER },
                right: { style: BorderStyle.SINGLE, size: 2, color: BRAND_BORDER },
              },
              children: [
                new Paragraph({
                  spacing: { before: 50, after: 50 },
                  children: [new TextRun({ text: val, size: 19, color: '33241B' })],
                }),
              ],
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function buildBackendDoc(): Document {
  return new Document({
    sections: [
      {
        children: [
          ...titleBlock(
            'Backend Architecture & REST API Documentation',
            'Node.js, Express.js, Built-in HTTP Server, bcrypt Security & JSON Persistence'
          ),
          h1('1. Server Architecture Overview'),
          p(
            'The STAYEASE backend is built using Node.js and Express.js wrapped inside Node.js’s built-in http.createServer() module (demonstrating Lab 5). It exposes modular RESTful APIs under /api/*, enforces session-based Bearer authentication with bcrypt password hashing, protects admin routes using role middleware, and persists all records atomically to local JSON files under data/.'
          ),
          bullet('Entry Point', 'server.ts initializes data storage, pre-generates Word documentation, attaches Express routes, serves static Bootstrap 5 lab pages, and boots the HTTP server on port 3000.'),
          bullet('Middleware Layer', 'middleware/auth.ts implements requireAuth, optionalAuth, requireAdmin, and express-rate-limit protection on login and registration endpoints.'),
          bullet('Storage Engine', 'services/storage.ts handles validated filesystem paths, serialized async file locks (preventing race conditions during concurrent bookings), and atomic temporary-file renames.'),

          h1('2. Complete REST API Specification'),
          simpleTable(
            ['Method & Endpoint', 'Access Level', 'Purpose'],
            [
              ['POST /api/auth/register', 'Public (Rate Limited)', 'Validates customer details, prevents duplicate emails, hashes password with bcrypt, creates session'],
              ['POST /api/auth/login', 'Public (Rate Limited)', 'Authenticates customer (users.json) or administrator (env/claimed hash) and returns session token'],
              ['POST /api/auth/logout', 'Authenticated', 'Invalidates active server-side session token'],
              ['GET /api/auth/me', 'Authenticated', 'Returns current authenticated user profile without password hash'],
              ['PUT /api/auth/profile', 'Customer', 'Updates customer full name, mobile number, and city'],
              ['GET /api/hotels', 'Public', 'Supports search, destination, category, star rating, price range, facilities, availability & sorting'],
              ['GET /api/hotels/:id', 'Public', 'Returns full hotel details alongside room categories and verified guest reviews'],
              ['POST/PUT/DELETE /api/hotels', 'Admin Only', 'Creates, edits, toggles availability, or removes hotel listings in hotels.json'],
              ['GET /api/rooms', 'Public', 'Lists rooms with real-time date-overlap inventory availability calculation'],
              ['POST/PUT/DELETE /api/rooms', 'Admin Only', 'Manages room categories, sample INR nightly rates, and inventory counts'],
              ['GET/POST /api/bookings', 'Authenticated', 'Lists customer bookings (or all for admin); creates validated booking with overlap check and GST math'],
              ['PUT /api/bookings/:id', 'Owner / Admin', 'Allows customer cancellation or admin status transition (Pending, Confirmed, Completed, Cancelled)'],
              ['GET/POST /api/reviews', 'Public / Eligible Guest', 'Fetches hotel reviews and allows guests with Confirmed/Completed stays to submit ratings'],
              ['POST/GET /api/contact', 'Public / Admin', 'Persists contact inquiries into data/messages.json; admin can inspect all inquiries'],
              ['GET/POST /api/events', 'Public', 'Powers Lab 8 Bootstrap promotional events and saves registrations to data/eventRegistrations.json'],
              ['GET /api/admin/stats', 'Admin Only', 'Computes live hotel, room, customer, booking status, and estimated INR revenue statistics'],
              ['GET /api/labs/report', 'Public', 'Lab 4 Node.js fs.promises async/await JSON reporting engine'],
              ['GET /lab5-http-server', 'Public', 'Lab 5 built-in HTTP HTML response showing Content-Type header and live server date/time'],
            ]
          ),

          h1('3. Security & Validation Safeguards'),
          bullet('Password Hashing', 'Customer and claimed administrator passwords are hashed using bcryptjs (10 salt rounds) before saving to JSON files; plaintext passwords are never persisted.'),
          bullet('Environment-Based Admin Secrets', 'Admin credentials are read from ADMIN_EMAIL and ADMIN_PASSWORD environment variables using constant-time comparison, with a one-time first-run setup option when unset.'),
          bullet('Booking Inventory Integrity', 'Before writing a booking, the backend acquires an async lock on bookings.json and checks all non-cancelled overlapping date intervals [checkIn, checkOut) against room.totalInventory.'),
          bullet('Path Confinement', 'storage.ts validates every JSON file name against an explicit allowlist and confirms resolved paths remain strictly inside data/.'),
          bullet('Rate Limiting', 'express-rate-limit caps brute-force attempts on /api/auth/login and /api/auth/register.'),
        ],
      },
    ],
  });
}

function buildDatabaseDoc(): Document {
  return new Document({
    sections: [
      {
        children: [
          ...titleBlock(
            'Database & JSON File Storage Documentation',
            'Primary File-Based JSON Storage Architecture & Lab 6 MongoDB Practical Reference'
          ),
          h1('1. Primary Data Storage Strategy (JSON Filesystem)'),
          p(
            'STAYEASE uses zero-cost, persistent local JSON file storage managed through Node.js fs/promises operations. All operational collections reside inside the data/ directory and are seeded automatically on first boot without ever overwriting existing user modifications across server restarts.'
          ),
          simpleTable(
            ['JSON File', 'Preloaded Demo Count', 'Primary Key & Key Fields'],
            [
              ['data/users.json', '5 Fictional Customers', 'id, fullName, email (unique), mobile, passwordHash (bcrypt), role, isActive, city, createdAt'],
              ['data/hotels.json', '12 Fictional Hotels', 'id, name, city, address, category, starCategory, facilities[], startingPrice, rating, isAvailable'],
              ['data/rooms.json', '24 Room Listings', 'id, hotelId (FK), category (7 types), pricePerNight (INR), maxGuests, totalInventory, sizeSqFt'],
              ['data/bookings.json', '8 Sample Bookings', 'id, bookingRef (SE-YYYY-XXXX), userId (FK), hotelId (FK), roomId (FK), checkIn, checkOut, pricing{}, status'],
              ['data/reviews.json', '5 Guest Reviews', 'id, hotelId (FK), userId (FK), customerName, rating (1-5), title, comment, stayDate'],
              ['data/messages.json', '1 Sample Inquiry', 'id, name, email, mobile, subject, message, createdAt'],
              ['data/eventRegistrations.json', '3 Event Signups', 'id, registrationRef, eventId, eventTitle, fullName, email, mobile, guestsCount, createdAt'],
            ]
          ),

          h1('2. Entity Relationships & Referential Logic'),
          bullet('Hotels → Rooms (1:N)', 'Each hotel in hotels.json maps to multiple room category documents in rooms.json via room.hotelId. Deleting a hotel cascades removal to its rooms.'),
          bullet('Users → Bookings (1:N)', 'Every booking stores userId alongside immutable customer contact snapshots so historical invoices remain accurate.'),
          bullet('Rooms → Bookings (1:N)', 'Date-overlap availability sums numRooms of all non-cancelled bookings matching roomId where checkInA < checkOutB && checkInB < checkOutA.'),
          bullet('Hotels → Reviews (1:N)', 'Submitting a review validates a Confirmed or Completed booking for that userId + hotelId and recalculates hotel.rating.'),

          h1('3. Pricing & Tax Calculation Model (INR ₹)'),
          p('Every booking computes transparent sample academic demonstration totals in Indian Rupees (₹):'),
          bullet('Base Subtotal', 'pricePerNight × numberOfNights × numRooms'),
          bullet('Additional Charges', 'Artisan Breakfast (₹700 × nights × rooms) + Airport Transfer (₹1,500 flat), summed using ES6 Rest parameters (Lab 3).'),
          bullet('Taxes (12% GST)', 'Math.round((baseSubtotal + additionalCharges) × 0.12)'),
          bullet('Final Estimated Total', 'baseSubtotal + additionalCharges + taxes (clearly marked as a demonstration payment summary with no card details collected).'),

          h1('4. Lab 6 — MongoDB CRUD Practical Demonstration (HotelDB)'),
          p(
            'While STAYEASE runs completely on JSON files with no mandatory external database, the project includes docs/lab6-mongodb-practical.js demonstrating all Lab 6 MongoDB operations mapped directly to hotel management:'
          ),
          bullet('use HotelDB', 'Creates or switches to the HotelDB database.'),
          bullet('db.createCollection("hotels")', 'Explicitly initializes the hotels collection.'),
          bullet('insertOne()', 'Inserts a single luxury hotel document (e.g., The Verandah on Lavelle, Bengaluru).'),
          bullet('insertMany()', 'Bulk inserts multiple regional properties across Mysuru, Goa, and Manali.'),
          bullet('find().pretty()', 'Queries and displays formatted JSON hotel records for inspection or city filtering.'),
          bullet('countDocuments()', 'Returns total hotel count for dashboard KPI verification.'),
          bullet('deleteOne()', 'Removes a specific retired or demonstration hotel listing by filter.'),
        ],
      },
    ],
  });
}

function buildFrontendDoc(): Document {
  return new Document({
    sections: [
      {
        children: [
          ...titleBlock(
            'Frontend UI/UX & Client Architecture Documentation',
            'Luxury Cream & Brown Hospitality Interface, React SPA, Tailwind CSS & Bootstrap 5 Lab Modules'
          ),
          h1('1. Visual Identity & Colour System'),
          p(
            'STAYEASE embodies refined Indian heritage hospitality using an exclusive warm cream, ivory, beige, caramel, coffee brown, and deep espresso palette—strictly avoiding blue or purple accents.'
          ),
          simpleTable(
            ['Design Token', 'Hex Value', 'Role in Interface'],
            [
              ['Warm Cream Canvas', '#FAF6F0', 'Primary page canvas (60% visual field)'],
              ['Warm Ivory Surface', '#FFFDF9', 'Elevated hotel cards, booking panels, forms'],
              ['Soft Beige Surface', '#F2EAE0', 'Secondary editorial bands, table headers, subtle sections'],
              ['Sand Hairline Border', '#E4D7C5', 'Crisp 1px structural dividers'],
              ['Caramel Gold Accent', '#A66A38', 'Interactive highlights, star ratings, active tabs'],
              ['Coffee Brown', '#4A3426', 'Secondary typography and warm section headers'],
              ['Deep Espresso', '#2D1D14', 'Primary headings, high-contrast ink, primary CTAs'],
            ]
          ),

          h1('2. Typography & Responsive Layout'),
          bullet('Display Font', 'Playfair Display serif lends architectural luxury to hero headings, hotel titles, and editorial banners.'),
          bullet('Body Font', 'Plus Jakarta Sans ensures effortless legibility across forms, filters, dashboards, and mobile viewports.'),
          bullet('Data Numerals', 'IBM Plex Mono with tabular-nums vertically aligns all INR (₹) room rates, tax breakdowns, booking IDs, and KPI counters.'),
          bullet('Responsive Grid', 'Fluid CSS Grid and Flexbox breakpoints adapt seamlessly across mobile (<640px), tablet (768px), and 1440px desktop displays.'),

          h1('3. Frontend Modules & User Flows'),
          bullet('Homepage', 'Full-bleed architectural hero ("Your Perfect Stay Starts Here"), live hotel search bar, popular Indian destinations, featured hotels, 7 room categories, guest reviews, FAQs, About Us, and Contact form.'),
          bullet('Explore & Filter Catalogue', 'Live multi-criteria search by city or hotel name, category filter, star rating, price ceiling, facilities checkboxes, availability toggle, and price/rating sort.'),
          bullet('Hotel Details & Booking Engine', 'Multi-image gallery, check-in/out policies, real-time date availability check, interactive night/tax calculator, demonstration payment summary, and instant confirmation receipt.'),
          bullet('Customer Dashboard', 'Displays Lab 1 ES6 guest summary, profile editor, segmented booking tabs (All / Upcoming / Completed / Cancelled), booking cancellation, and verified stay review submission.'),
          bullet('Admin Dashboard', 'Protected workspace displaying live JSON KPI statistics and CRUD consoles for Hotels, Rooms, Bookings, Customers, Contact Inquiries, and Event Registrations.'),
          bullet('Bootstrap 5 Lab Pages (Lab 7 & Lab 8)', 'Dedicated responsive Bootstrap 5.3 pages at /lab7-register.html (Customer Registration) and /lab8-events.html (Promotional Event Registration Modal), connected directly to the live Express REST APIs.'),
        ],
      },
    ],
  });
}

function buildProjectReportDoc(): Document {
  return new Document({
    sections: [
      {
        children: [
          // COVER PAGE
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: 'KLE TECHNOLOGICAL UNIVERSITY',
                bold: true,
                size: 28,
                color: BRAND_ESPRESSO,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'School of Computer Applications — BCA III Semester',
                bold: true,
                size: 22,
                color: BRAND_COFFEE,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 100 },
            children: [
              new TextRun({
                text: 'COURSE PROJECT REPORT',
                bold: true,
                size: 24,
                color: BRAND_CARAMEL,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'STAYEASE — Hotel Booking & Management System',
                bold: true,
                size: 38,
                color: BRAND_ESPRESSO,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 280 },
            children: [
              new TextRun({
                text: '“Find Comfort. Book with Ease.”',
                italics: true,
                size: 24,
                color: BRAND_COFFEE,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [
              new TextRun({
                text: 'Submitted in partial fulfillment of the course Server-Side Web Development (BCA III Semester)',
                size: 21,
                color: '33241B',
              }),
            ],
          }),
          simpleTable(
            ['Project Field', 'Details'],
            [
              ['Student Name(s) & USN', '[Enter Your Name(s) & Roll / USN Here]'],
              ['Course & Semester', 'BCA — III Semester (Server-Side Web Development)'],
              ['Faculty Guide', '[Enter Professor / Mam Name Here]'],
              ['Technology Stack', 'Node.js, Express.js, JSON File Storage, React, Tailwind CSS, Bootstrap 5'],
              ['Academic Year', '2026 – 2027'],
            ]
          ),

          // CERTIFICATE & DECLARATION
          h1('Certificate & Student Declaration'),
          p(
            'This is to certify that the course project titled “STAYEASE — Hotel Booking and Management System” is a bonafide record of work carried out for the BCA III Semester Server-Side Web Development course. All preloaded hotel listings, room prices in Indian Rupees (₹), reviews, and demonstration payment summaries represent fictional academic demonstration data created strictly for educational evaluation.'
          ),
          p('Signature of Student(s): ______________________          Signature of Faculty Guide: ______________________'),

          h1('Acknowledgement'),
          p(
            'We express our sincere gratitude to our Server-Side Web Development faculty guide for continuous encouragement, structured laboratory guidance, and constructive feedback throughout the design and implementation of STAYEASE. We also thank the Department of Computer Applications for providing the curriculum framework connecting ES6 JavaScript, Node.js, Express.js, JSON persistence, MongoDB concepts, and Bootstrap 5 responsive interfaces.'
          ),

          // ABSTRACT
          h1('Abstract'),
          p(
            'STAYEASE (“Find Comfort. Book with Ease.”) is a full-stack hotel booking and management web application built using Node.js, Express.js, persistent local JSON file storage, bcrypt password hashing, session-based authentication, React, Tailwind CSS, and Bootstrap 5. Designed in a warm cream-and-brown hospitality theme, the system enables guests to explore curated fictional properties across eight Indian destinations (Bengaluru, Mysuru, Goa, Mumbai, Hyderabad, Chennai, Delhi, and Manali), filter stays by price, star rating, hotel category, and facilities, verify live room inventory across date ranges, compute transparent sample INR totals including 12% GST, manage reservations from a Customer Dashboard, and submit verified stay reviews. Administrators access a protected dashboard displaying real-time JSON analytics and full CRUD management over hotels, rooms, bookings, customer accounts, contact messages, and promotional event registrations. The application natively integrates all eight KLE Technological University Server-Side Web Development Lab Programs.'
          ),

          // CHAPTER 1
          h1('Chapter 1: Introduction & Objectives'),
          h2('1.1 Problem Statement'),
          p(
            'Many academic hotel booking prototypes remain static front-end mockups without real server validation, persistent storage, password security, or room inventory overlap checks. As a result, they fail to demonstrate real-world server-side challenges such as preventing overbooking, securing user credentials, maintaining data across server restarts, and enforcing customer versus administrator permissions.'
          ),
          h2('1.2 Proposed System (STAYEASE)'),
          p(
            'STAYEASE solves these gaps by providing a complete, zero-cost full-stack architecture powered by Node.js and Express.js with atomic JSON file persistence. Every booking validates check-in/check-out chronology, checks room availability against existing non-cancelled stays, calculates itemized INR totals, generates a unique booking reference (SE-YYYY-XXXX), and persists immediately to disk.'
          ),
          h2('1.3 Project Objectives'),
          bullet('Full-Stack Server-Side Engineering', 'Build modular REST APIs with Express.js wrapped inside Node.js’s built-in http.createServer() module.'),
          bullet('Zero-Cost Persistent Storage', 'Store users, hotels, rooms, bookings, reviews, messages, and event registrations in structured JSON files with async write locks so data survives server restarts.'),
          bullet('Authentication & Role Security', 'Protect customer accounts with bcryptjs hashing, rate-limited login endpoints, Bearer session tokens, and environment-protected administrator controls.'),
          bullet('Complete Syllabus Alignment', 'Integrate all eight BCA III Semester Server-Side Web Development lab programs into live working user journeys.'),

          // CHAPTER 2
          h1('Chapter 2: System Requirements Specification'),
          h2('2.1 Functional Requirements'),
          bullet('Guest Discovery & Filtering', 'Search by destination/hotel name, filter by category, star rating, price ceiling, facilities, and availability, and sort by price or guest rating.'),
          bullet('Booking & Inventory Engine', 'Support 7 room tiers (Single, Double, Deluxe, Premium, Family, Suite, Executive Suite), prevent overlapping bookings exceeding totalInventory, compute INR + 12% GST totals, and support cancellation.'),
          bullet('Customer Portal', 'Registration with duplicate-email check, login/logout, profile editing, booking history tabs, and eligible stay review submission.'),
          bullet('Admin Operations Console', 'Live KPI dashboard, Add/Edit/Delete/Pause hotels, Add/Edit/Delete room rates & inventory, confirm/complete/cancel bookings, suspend/restore customer access, and view contact/event submissions.'),
          h2('2.2 Hardware & Software Requirements'),
          simpleTable(
            ['Category', 'Specification'],
            [
              ['Runtime & Backend', 'Node.js v20+ / v22+, Express.js 4.x, built-in Node http & fs/promises modules'],
              ['Frontend Stack', 'HTML5, CSS3, ES6+ TypeScript/JavaScript, React 19, Tailwind CSS v4, Bootstrap 5.3'],
              ['Security Libraries', 'bcryptjs (password hashing), express-rate-limit (brute-force protection), Node crypto'],
              ['Data Storage', 'Local JSON files in data/ (7 collections) + documented MongoDB Lab 6 script'],
              ['Development Tools', 'Visual Studio Code, npm, Vite 8, Modern Web Browser (Chrome / Edge / Firefox)'],
              ['Minimum Hardware', 'Dual-core processor, 4 GB RAM, 500 MB free disk space'],
            ]
          ),

          // CHAPTER 3
          h1('Chapter 3: System Architecture & Data Design'),
          h2('3.1 Three-Tier Full-Stack Architecture'),
          p(
            'STAYEASE separates responsibilities cleanly across three layers: (1) Presentation Layer (React luxury cream-and-brown SPA plus standalone Bootstrap 5.3 Lab 7 & Lab 8 pages), (2) Application & API Layer (Express routers, auth/admin middleware, rate limiters, and business logic for availability and GST pricing), and (3) Persistence Layer (services/storage.ts performing path-confined, async-locked, atomic JSON writes under data/).'
          ),
          h2('3.2 JSON Storage Collections'),
          simpleTable(
            ['File Path', 'Preloaded Count', 'Primary Fields & Relationships'],
            [
              ['data/hotels.json', '12 Fictional Hotels', 'id, name, city, address, category, starCategory, facilities[], startingPrice, rating, isAvailable'],
              ['data/rooms.json', '24 Room Listings', 'id, hotelId (FK), category (7 types), pricePerNight (INR), maxGuests, totalInventory, sizeSqFt'],
              ['data/users.json', '5 Fictional Guests', 'id, fullName, email (unique), mobile, passwordHash (bcrypt), role, isActive, city'],
              ['data/bookings.json', '8 Sample Bookings', 'id, bookingRef, userId, hotelId, roomId, checkIn, checkOut, numRooms, pricing{}, status'],
              ['data/reviews.json', '5 Guest Reviews', 'id, hotelId, userId, customerName, rating (1–5), title, comment, stayDate'],
              ['data/messages.json', '1 Sample Inquiry', 'id, name, email, mobile, subject, message, createdAt'],
              ['data/eventRegistrations.json', '3 Event Signups', 'id, registrationRef, eventId, eventTitle, fullName, email, mobile, guestsCount'],
            ]
          ),
          h2('3.3 Overlap Availability & INR Pricing Model'),
          p(
            'For any requested interval [checkIn, checkOut), the server filters non-cancelled bookings for the same roomId where (startA < endB && startB < endA), sums booked numRooms, and verifies requestedRooms <= (room.totalInventory - overlappingBooked). Pricing computes baseSubtotal = pricePerNight × nights × numRooms, adds optional Artisan Breakfast (₹700/room/night) and Airport Transfer (₹1,500) using ES6 Rest parameters, applies 12% GST, and displays a clearly labelled Demonstration Payment Summary without collecting real card data.'
          ),

          // CHAPTER 4
          h1('Chapter 4: Module Descriptions & REST API Summary'),
          bullet('Authentication Module (/api/auth/*)', 'Supports registration, duplicate-email prevention, bcrypt login, logout, profile updates, and secure first-run/environment admin login.'),
          bullet('Catalogue & Rooms Module (/api/hotels, /api/rooms)', 'Handles search, multi-facet filtering, sorting, real-time date availability, and admin CRUD mutations.'),
          bullet('Booking Module (/api/bookings)', 'Enforces date validation, atomic inventory checks, unique SE-YYYY-XXXX reference generation, customer cancellations, and admin status transitions.'),
          bullet('Reviews, Contact & Events (/api/reviews, /api/contact, /api/events)', 'Verifies eligible stays before accepting reviews, recalculates hotel demonstration ratings, logs contact inquiries, and persists promotional event seat counts.'),
          bullet('Admin Analytics & Word Export (/api/admin/*, /api/docs/download/*)', 'Calculates real-time KPI statistics directly from JSON files and generates downloadable Microsoft Word (.docx) documentation on demand.'),

          // CHAPTER 5
          h1('Chapter 5: Integration of All Eight Lab Syllabus Programs'),
          simpleTable(
            ['Lab #', 'Syllabus Program Title', 'Implementation Location & Practical Role in STAYEASE'],
            [
              ['Lab 1', 'ES6 Objects, Destructuring, Arrow Functions, Array Methods, Template Literals', 'src/utils/lab1GuestSummary.ts — Formats live Customer Dashboard guest & booking summaries'],
              ['Lab 2', 'JSON Data Using Promises (resolve/reject, then/catch) & Async/Await', 'src/utils/lab2AsyncCatalog.ts — Interactive hotel/room JSON validation runner in Docs & Labs'],
              ['Lab 3', 'Spread & Rest Operators + Array Destructuring', 'src/utils/lab3BookingSpread.ts & routes/bookings.ts — Combines customer/booking objects & sums variable charges'],
              ['Lab 4', 'Read JSON File Using Node.js (fs.promises, async/await, error handling)', 'routes/labs.ts (GET /api/labs/report) — Live Hotel List, Room Prices & Customer Booking Report'],
              ['Lab 5', 'Create a Server and Display HTML Response with Date & Time', 'server.ts (http.createServer + GET /lab5-http-server) — Explicit Content-Type: text/html & live IST timestamp'],
              ['Lab 6', 'MongoDB Database & CRUD Operations (HotelDB)', 'docs/lab6-mongodb-practical.js & GET /api/labs/mongodb-guide — insertOne, insertMany, find.pretty, countDocuments, deleteOne'],
              ['Lab 7', 'Responsive Registration Page Using Bootstrap 5', 'public/lab7-register.html — Bootstrap 5 Navbar, Container, Card, Validation & Alert wired to POST /api/auth/register'],
              ['Lab 8', 'Event Registration Using Bootstrap 5 Modal & JS', 'public/lab8-events.html — Bootstrap 5 Navbar, Cards, Modal, JS Confirmation & Alert wired to POST /api/events'],
            ]
          ),

          // CHAPTER 6
          h1('Chapter 6: System Testing & Verification Matrix'),
          simpleTable(
            ['TC #', 'Test Scenario', 'Expected Result', 'Status'],
            [
              ['TC-01', 'Customer registration with valid details', 'Password hashed with bcrypt, saved to users.json, session issued', 'PASS'],
              ['TC-02', 'Duplicate email registration attempt', 'Rejected with HTTP 409 duplicate email message', 'PASS'],
              ['TC-03', 'Customer login & logout', 'Valid credentials issue Bearer session; logout invalidates session', 'PASS'],
              ['TC-04', 'Homepage destination & date search', 'Filters matching hotels and passes selected dates forward', 'PASS'],
              ['TC-05', 'Multi-filter search (city, category, stars, price, facilities)', 'Live API filters & sorts hotels accurately', 'PASS'],
              ['TC-06', 'Booking with check-out <= check-in', 'Blocked with HTTP 400 validation error & auto-date guard', 'PASS'],
              ['TC-07', 'Overlapping room booking exceeding inventory', 'Blocked with HTTP 409 remaining inventory notice', 'PASS'],
              ['TC-08', 'Valid reservation creation', 'Generates SE-YYYY-XXXX ref, calculates 12% GST, saves to bookings.json', 'PASS'],
              ['TC-09', 'Customer booking cancellation', 'Updates status to Cancelled and releases room inventory', 'PASS'],
              ['TC-10', 'Customer profile edit', 'Updates fullName, mobile, city in users.json & active session', 'PASS'],
              ['TC-11', 'Admin Add / Edit / Toggle / Delete Hotel', 'Persists changes to hotels.json and cascades room cleanup', 'PASS'],
              ['TC-12', 'Admin Add / Edit / Delete Room pricing & inventory', 'Persists updated INR rates and inventory to rooms.json', 'PASS'],
              ['TC-13', 'Admin booking status transition & customer suspend', 'Updates bookings.json and revokes suspended customer sessions', 'PASS'],
              ['TC-14', 'Eligible guest review submission', 'Saves to reviews.json and recalculates hotel average rating', 'PASS'],
              ['TC-15', 'Contact inquiry & Lab 8 Bootstrap event modal', 'Persists to messages.json and eventRegistrations.json', 'PASS'],
              ['TC-16', 'Server restart persistence check', 'All JSON modifications remain intact after server restart', 'PASS'],
            ]
          ),

          // CHAPTER 7
          h1('Chapter 7: Future Enhancements & Conclusion'),
          h2('7.1 Future Enhancements'),
          bullet('Multi-Property Seasonal Pricing', 'Support weekend and festive tariff rules per room category.'),
          bullet('PDF Invoice & Email Dispatch', 'Generate printable GST invoice PDFs and automated confirmation emails.'),
          bullet('Optional MongoDB Driver Switch', 'Allow toggling between local JSON storage and live MongoDB Atlas using the Lab 6 schema.'),
          h2('7.2 Conclusion'),
          p(
            'STAYEASE successfully achieves all academic and engineering goals of the BCA III Semester Server-Side Web Development course. By combining clean Node.js and Express.js REST architecture, race-safe JSON persistence, bcrypt authentication, a warm luxury hospitality interface, downloadable Microsoft Word documentation, and authentic implementations of all eight laboratory syllabus programs, STAYEASE stands as a complete, trustworthy, and presentation-ready full-stack web application.'
          ),

          // APPENDIX: VIVA Q&A
          h1('Appendix: 20 BCA Viva Voce Questions & Answers'),
          bullet('Q1: What is STAYEASE and what problem does it solve?', 'STAYEASE is a full-stack hotel booking and management system that handles real server-side hotel search, date-overlap inventory validation, INR tax calculation, secure customer/admin roles, and persistent JSON storage.'),
          bullet('Q2: Why was Node.js chosen for the backend?', 'Node.js uses an event-driven, non-blocking I/O model ideal for concurrent web requests and shares JavaScript/TypeScript across both frontend and backend.'),
          bullet('Q3: How does Express.js work with Node.js’s built-in http module (Lab 5)?', 'Express creates a request-handling middleware pipeline that is passed directly to http.createServer(app), which binds to port 3000 and serves explicit text/html responses on /lab5-http-server.'),
          bullet('Q4: How are JSON files safely read and written without corruption?', 'services/storage.ts validates filenames against an allowlist, verifies paths remain inside data/, serializes writes using an async promise lock, and writes to a temporary file before atomic fs.rename.'),
          bullet('Q5: Why does STAYEASE never overwrite JSON files on restart?', 'initializeDataStore() checks dataFileExists() before seeding, ensuring user registrations, new hotels, and bookings persist permanently across restarts.'),
          bullet('Q6: How are passwords secured in users.json?', 'Passwords are never saved in plaintext; bcryptjs hashes every password with a salt factor of 10 before writing to disk and verifies logins via bcrypt.compare().'),
          bullet('Q7: How are Administrator credentials protected?', 'Admin credentials are read from server-side environment variables (ADMIN_EMAIL, ADMIN_PASSWORD) using timing-safe comparison, or claimed once via a hashed setup form—never exposed in frontend code.'),
          bullet('Q8: How does STAYEASE prevent brute-force login attacks?', 'express-rate-limit restricts repeated login and registration attempts within a 15-minute sliding window.'),
          bullet('Q9: Explain the room overbooking prevention algorithm.', 'Two stays [A_start, A_end) and [B_start, B_end) overlap if A_start < B_end && B_start < A_end. STAYEASE sums rooms across all non-cancelled overlapping bookings and rejects requests exceeding totalInventory.'),
          bullet('Q10: How is the final INR price calculated?', 'Base subtotal = roomPrice × nights × numRooms; optional breakfast and airport transfer are summed via ES6 Rest parameters; 12% GST is added to compute the demonstration total.'),
          bullet('Q11: Why is there no real payment gateway?', 'Academic demonstration projects should never collect real card details; STAYEASE displays a transparent Demonstration Payment Summary instead.'),
          bullet('Q12: Where is Lab 1 (ES6 features) used in the app?', 'src/utils/lab1GuestSummary.ts uses object destructuring, arrow functions, filter/map/reduce, and template literals to render the Customer Dashboard guest summary.'),
          bullet('Q13: Explain Promises vs Async/Await in Lab 2.', 'Promises represent future asynchronous results chained with .then()/.catch(), whereas async/await pauses execution inside an async function with cleaner try/catch error handling.'),
          bullet('Q14: How are Spread and Rest operators applied in Lab 3?', 'Spread (...) merges customer objects, booking objects, and facility arrays immutably; Rest (...extraCharges) collects arbitrary add-on fees into an array for reduction.'),
          bullet('Q15: What does Lab 4 demonstrate on the backend?', 'GET /api/labs/report reads hotels.json, rooms.json, bookings.json, and users.json with fs.promises.readFile and async/await to compile a live portfolio report.'),
          bullet('Q16: How does Lab 6 MongoDB map to STAYEASE?', 'MongoDB database HotelDB and collection hotels mirror data/hotels.json; insertOne, insertMany, find().pretty(), countDocuments(), and deleteOne() map directly to admin hotel CRUD.'),
          bullet('Q17: Which Bootstrap 5 components appear in Lab 7?', 'public/lab7-register.html implements a responsive Bootstrap 5 navbar, container, card, form-control grid, client-side validation feedback, and contextual alerts linked to POST /api/auth/register.'),
          bullet('Q18: How does Lab 8 Event Registration work end to end?', 'public/lab8-events.html renders Bootstrap 5 event cards that open a Bootstrap JavaScript Modal; submitting posts JSON to POST /api/events, updates seat counts, and saves to eventRegistrations.json.'),
          bullet('Q19: How does role-based access control protect Admin APIs?', 'requireAuth verifies the Bearer session token and active status, while requireAdmin checks req.user.role === "admin" before allowing hotel, room, customer, or global booking mutations.'),
          bullet('Q20: How are the Word (.docx) documents generated?', 'services/wordDocs.ts uses the docx library to programmatically construct styled tables, headings, and paragraphs, writing .docx files to docs/ and streaming downloads via /api/docs/download/:type.'),
        ],
      },
    ],
  });
}

export async function generateWordBuffer(type: DocType): Promise<{
  filename: string;
  buffer: Buffer;
}> {
  let doc: Document;
  switch (type) {
    case 'backend':
      doc = buildBackendDoc();
      break;
    case 'database':
      doc = buildDatabaseDoc();
      break;
    case 'frontend':
      doc = buildFrontendDoc();
      break;
    case 'report':
    default:
      doc = buildProjectReportDoc();
      break;
  }
  const buffer = await Packer.toBuffer(doc);
  return { filename: DOC_FILENAMES[type], buffer };
}

/**
 * Writes all four academic Word (.docx) documents into the workspace /docs folder on startup.
 */
export async function generateAllWordDocsToDisk(): Promise<void> {
  const docsDir = path.resolve(process.cwd(), 'docs');
  await fs.mkdir(docsDir, { recursive: true });
  const types: DocType[] = ['backend', 'database', 'frontend', 'report'];
  for (const type of types) {
    const { filename, buffer } = await generateWordBuffer(type);
    await fs.writeFile(path.join(docsDir, filename), buffer);
  }
}
