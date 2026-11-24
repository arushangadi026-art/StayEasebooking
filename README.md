# STAYEASE — Hotel Booking & Management System
**Tagline:** *Find Comfort. Book with Ease.*  
**Course:** BCA III Semester — Server-Side Web Development Project (KLE Technological University Syllabus)

---

## 1. Project Abstract
**STAYEASE** is a complete full-stack hotel booking and management web application built with Node.js, Express.js, persistent JSON file storage, bcrypt password hashing, session authentication, React, Tailwind CSS, and Bootstrap 5. Designed in a warm cream-and-brown luxury hospitality aesthetic, STAYEASE lets guests search fictional demonstration hotels across eight Indian destinations, compare seven room categories in Indian Rupees (₹), validate real-time room inventory across date ranges, create and cancel bookings, submit verified stay reviews, register for promotional hospitality events, and manage records through dedicated Customer and Administrator dashboards.

## 2. Project Objectives
1. Implement a working full-stack client-server architecture with RESTful APIs and zero-cost JSON file persistence.
2. Secure user accounts using `bcryptjs` password hashing, server-side session tokens, rate limiting, and role-based route protection.
3. Prevent hotel room double-booking through date-overlap inventory validation and transparent INR + 12% GST calculation.
4. Provide complete Customer and Administrator dashboards with live JSON-computed metrics.
5. Integrate all eight KLE Technological University Server-Side Web Development Laboratory Programs organically into the application.
6. Generate downloadable Microsoft Word (`.docx`) documentation for Backend, Database, Frontend, and the Full Project Report.

## 3. Installation & VS Code Setup
1. Open the `STAYEASE` project folder in **Visual Studio Code**.
2. Open the integrated terminal (`Ctrl + \``) and install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and set your secure administrator credentials (never commit `.env`):
   ```env
   PORT=3000
   ADMIN_EMAIL=admin@stayease.in
   ADMIN_PASSWORD=YourSecureAdminPassword
   ```
   *(If `ADMIN_PASSWORD` is left blank on first run, the Login page offers a secure one-time First-Run Admin Setup form that hashes and saves your chosen password in `data/admin.json`.)*
4. Start the full-stack server:
   ```bash
   npm run dev
   ```
5. Open in your browser: **http://localhost:3000**

### Production Build
```bash
npm run build
NODE_ENV=production npm start
```

## 4. Preloaded Academic Demonstration Data (`data/*.json`)
Initialized automatically on first startup without ever overwriting changes across restarts:
- `data/hotels.json` — 12 fictional demonstration hotels across Bengaluru, Mysuru, Goa, Mumbai, Hyderabad, Chennai, Delhi, and Manali.
- `data/rooms.json` — 24 room listings across Single Room, Double Room, Deluxe Room, Premium Room, Family Room, Suite, and Executive Suite.
- `data/users.json` — 5 fictional customers (bcrypt-hashed password for demo login: `aarav.kulkarni@example.in` / `StayEase@2026`).
- `data/bookings.json` — 8 sample bookings across Pending, Confirmed, Completed, and Cancelled statuses.
- `data/reviews.json` — 5 verified sample guest reviews.
- `data/eventRegistrations.json` — 3 promotional event registrations.
- `data/messages.json` — Contact concierge inquiries.

## 5. Downloadable Word Documents (`.docx`)
Generated automatically into `/docs` on startup and downloadable anytime from the **Docs & Labs** page inside the app:
- `docs/STAYEASE_Backend_Documentation.docx`
- `docs/STAYEASE_Database_Documentation.docx`
- `docs/STAYEASE_Frontend_Documentation.docx`
- `docs/STAYEASE_BCA_Project_Report.docx`

## 6. Mapping of All Eight Lab Syllabus Programs
| Lab # | Syllabus Concept | Implementation in STAYEASE |
| :--- | :--- | :--- |
| **Lab 1** | ES6 Objects, Destructuring, Arrow Functions, Array Methods, Template Literals | `src/utils/lab1GuestSummary.ts` — Live guest summary card in Customer Dashboard & Docs Hub |
| **Lab 2** | JSON Data Using Promises (`resolve`/`reject`, `.then`/`.catch`) & `async/await` | `src/utils/lab2AsyncCatalog.ts` — Interactive hotel/room JSON validator in Docs & Labs page |
| **Lab 3** | Spread & Rest Operators, Array Destructuring | `src/utils/lab3BookingSpread.ts` & `routes/bookings.ts` — Customer/booking merge & variable add-on summation |
| **Lab 4** | Read JSON File Using Node.js (`fs/promises`, `async/await`, error handling) | `routes/labs.ts` (`GET /api/labs/report`) — Generates live Hotel List, Room Prices & Customer Booking Report |
| **Lab 5** | Built-in Node.js `http` Server & HTML Response with Date/Time | `server.ts` (`http.createServer` + `GET /lab5-http-server`) — Explicit `Content-Type: text/html` & IST date/time |
| **Lab 6** | MongoDB Database & CRUD Operations (`HotelDB`) | `docs/lab6-mongodb-practical.js` & `GET /api/labs/mongodb-guide` — `insertOne`, `insertMany`, `find().pretty()`, `countDocuments`, `deleteOne` |
| **Lab 7** | Responsive Registration Form Using Bootstrap 5 | `public/lab7-register.html` (`/lab7-register.html`) — Bootstrap 5 Navbar, Card, Validation & Alert wired to `POST /api/auth/register` |
| **Lab 8** | Event Registration Modal Using Bootstrap 5 & JS | `public/lab8-events.html` (`/lab8-events.html`) — Bootstrap 5 Cards, Modal, Confirmation & Alert wired to `POST /api/events` |

## 7. Lab 6 — MongoDB Practical Quick Reference
MongoDB is **not required** to run STAYEASE. For Lab 6 practical evaluation in `mongosh`:
```javascript
use HotelDB
db.createCollection("hotels")
db.hotels.insertOne({ hotelId: "htl_01", name: "The Verandah on Lavelle", city: "Bengaluru", starCategory: 5, startingPriceINR: 7800 })
db.hotels.insertMany([
  { hotelId: "htl_02", name: "Deccan Sandalwood Palace", city: "Mysuru", starCategory: 5, startingPriceINR: 8900 },
  { hotelId: "htl_03", name: "Aurelia Palm Retreat", city: "Goa", starCategory: 5, startingPriceINR: 9200 }
])
db.hotels.find({ starCategory: 5 }).pretty()
db.hotels.countDocuments()
db.hotels.deleteOne({ hotelId: "htl_03" })
```

## 8. Conclusion
STAYEASE delivers a complete, responsive, and secure full-stack hotel booking platform that unifies real-world hospitality workflows with all eight BCA III Semester Server-Side Web Development laboratory programs and print-ready Microsoft Word documentation.
