# COURSE PROJECT REPORT
## STAYEASE — Hotel Booking & Management System
### *"Find Comfort. Book with Ease."*

**Institution:** KLE Technological University  
**Program:** BCA — III Semester  
**Course:** Server-Side Web Development  
**Academic Year:** 2026 – 2027  
**Student Name(s) / USN:** _[Enter Student Name(s) & USN]_  
**Faculty Guide:** _[Enter Professor / Mam Name]_  

> **Downloadable Word Version:** Open **Docs & Labs** inside the running STAYEASE web app and click **Download Word Document** under **Complete BCA Project Report (.docx)** (also saved at `docs/STAYEASE_BCA_Project_Report.docx`).

---

## Abstract
**STAYEASE** is a complete full-stack hotel booking and management web application built with **Node.js, Express.js, local JSON file storage, bcrypt password hashing, session authentication, React, Tailwind CSS, and Bootstrap 5**. Featuring a warm cream-and-brown luxury hospitality design, STAYEASE enables guests to search and filter fictional academic demonstration hotels across eight Indian cities, inspect live date-based room inventory across seven room categories in Indian Rupees (₹), calculate automatic nights and 12% GST totals, reserve or cancel bookings, submit verified stay reviews, and register for promotional events. Administrators manage hotels, rooms, inventory, bookings, customers, and inquiries through a protected operations dashboard. All eight KLE Technological University Server-Side Web Development laboratory programs are natively integrated.

---

## Chapter 1: Introduction & Objectives
### 1.1 Problem Statement
Static front-end hotel booking prototypes lack server-side validation, persistent storage, password hashing, role-based access control, and overlapping date inventory checks. STAYEASE addresses these limitations using a zero-cost, self-contained Node.js full-stack architecture.

### 1.2 Objectives
1. Build a responsive full-stack web platform using Node.js, Express.js, and REST APIs.
2. Persist all records across restarts in validated local JSON files (`data/*.json`) with atomic write locks.
3. Implement secure authentication using `bcryptjs`, rate limiting, session tokens, and protected Admin/Customer roles.
4. Prevent double-booking via interval overlap verification (`startA < endB && startB < endA`) against room inventory.
5. Integrate all 8 KLE Technological University Server-Side Web Development Lab Programs organically into the application.

---

## Chapter 2: System Architecture & Data Storage
### 2.1 Three-Tier Architecture
- **Presentation Layer**: React + Tailwind CSS SPA (cream, ivory, caramel, coffee brown, espresso theme) + standalone Bootstrap 5.3 Lab 7 (`/lab7-register.html`) and Lab 8 (`/lab8-events.html`) pages.
- **Application / REST API Layer**: Express routers (`/api/auth`, `/api/hotels`, `/api/rooms`, `/api/bookings`, `/api/reviews`, `/api/contact`, `/api/events`, `/api/admin`, `/api/labs`, `/api/docs/download`) wrapped inside Node.js's built-in `http.createServer()`.
- **Storage Layer**: `services/storage.ts` managing seven JSON files inside `data/` with path confinement, async write locks, and atomic temp-file renames:
  - `data/hotels.json` (12 fictional hotels)
  - `data/rooms.json` (24 room listings across 7 categories)
  - `data/users.json` (5 preloaded fictional customers with bcrypt hashes)
  - `data/bookings.json` (8 sample bookings across Pending, Confirmed, Completed, Cancelled)
  - `data/reviews.json` (5 verified sample reviews)
  - `data/messages.json` (contact inquiries)
  - `data/eventRegistrations.json` (3 promotional event registrations)

### 2.2 Pricing & Tax Formula (INR ₹)
- **Base Subtotal** = `pricePerNight × nights × numRooms`
- **Additional Charges** = `Artisan Breakfast (₹700 × nights × numRooms) + Airport Transfer (₹1,500)` summed via ES6 Rest parameters (Lab 3)
- **Taxes (12% GST)** = `Math.round((baseSubtotal + additionalCharges) × 0.12)`
- **Final Estimated Total** = `baseSubtotal + additionalCharges + taxes` *(Demonstration Payment Summary — no real cards collected)*

---

## Chapter 3: All Eight KLE Tech Lab Programs Mapping
| Lab # | Syllabus Topic | STAYEASE Implementation |
| :--- | :--- | :--- |
| **Lab 1** | ES6 Objects, Destructuring, Arrow Functions, Array Methods, Template Literals | `src/utils/lab1GuestSummary.ts` (Customer Dashboard guest summary) |
| **Lab 2** | JSON Data Using Promises (`resolve`/`reject`, `.then`/`.catch`) & `async/await` | `src/utils/lab2AsyncCatalog.ts` (Interactive validator in Docs & Labs) |
| **Lab 3** | Spread & Rest Operators + Array Destructuring | `src/utils/lab3BookingSpread.ts` & `routes/bookings.ts` |
| **Lab 4** | Read JSON File Using Node.js (`fs.promises`, `async/await`, error handling) | `routes/labs.ts` (`GET /api/labs/report`) |
| **Lab 5** | Node.js Built-in `http` Server & HTML Response with Date/Time | `server.ts` (`http.createServer` + `GET /lab5-http-server`) |
| **Lab 6** | MongoDB Database & CRUD (`HotelDB.hotels`) | `docs/lab6-mongodb-practical.js` & `GET /api/labs/mongodb-guide` |
| **Lab 7** | Responsive Registration Form Using Bootstrap 5 | `public/lab7-register.html` wired to `POST /api/auth/register` |
| **Lab 8** | Event Registration Modal Using Bootstrap 5 & JS | `public/lab8-events.html` wired to `POST /api/events` |

---

## Chapter 4: Testing Matrix (Verified)
All functional flows—Registration, Duplicate Email Check, Login/Logout, Multi-Filter Hotel Search, Room Selection, Date Validation, Overlap Inventory Prevention, Booking Creation & Cancellation, Customer Dashboard, Admin Add/Edit/Delete Hotels & Rooms, Booking Status Transitions, Customer Access Suspension, Verified Reviews, Contact Form, Bootstrap 5 Event Modal, Server Restart Persistence, and all 4 Word (`.docx`) Downloads—tested and verified **PASS**.

---

## Chapter 5: Conclusion
STAYEASE demonstrates complete full-stack server-side engineering with clean UX, strong security fundamentals, persistent JSON storage, and seamless coverage of all eight BCA III Semester laboratory syllabus programs.
