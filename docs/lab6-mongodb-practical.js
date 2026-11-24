/**
 * STAYEASE — BCA III Semester Server-Side Web Development
 * LAB 6: MongoDB Database and CRUD Operations Practical Script
 *
 * NOTE: The main STAYEASE application runs completely on local JSON file storage
 * (data/*.json) and does NOT require MongoDB to start or operate.
 * Execute these commands in mongosh (MongoDB Shell) for Lab 6 practical evaluation.
 */

// 1. Create / switch to database: HotelDB
use HotelDB;

// 2. Create collection: hotels
db.createCollection("hotels");

// 3. insertOne() — Add a single fictional STAYEASE hotel listing
db.hotels.insertOne({
  hotelId: "htl_01",
  name: "The Verandah on Lavelle",
  city: "Bengaluru",
  category: "Luxury",
  starCategory: 5,
  facilities: ["Free Wi-Fi", "Fine Dining", "Spa & Wellness", "Valet Parking"],
  startingPriceINR: 7800,
  isAvailable: true,
  isDemoListing: true
});

// 4. insertMany() — Bulk insert multiple regional STAYEASE hotels
db.hotels.insertMany([
  {
    hotelId: "htl_02",
    name: "Deccan Sandalwood Palace",
    city: "Mysuru",
    category: "Luxury",
    starCategory: 5,
    startingPriceINR: 8900,
    isAvailable: true,
    isDemoListing: true
  },
  {
    hotelId: "htl_03",
    name: "Aurelia Palm Retreat",
    city: "Goa",
    category: "Resort",
    starCategory: 5,
    startingPriceINR: 9200,
    isAvailable: true,
    isDemoListing: true
  },
  {
    hotelId: "htl_04",
    name: "Deodar Hearth Lodge",
    city: "Manali",
    category: "Boutique",
    starCategory: 4,
    startingPriceINR: 6400,
    isAvailable: true,
    isDemoListing: true
  },
  {
    hotelId: "htl_10",
    name: "Chamundi Foothill Stay",
    city: "Mysuru",
    category: "Budget",
    starCategory: 3,
    startingPriceINR: 2100,
    isAvailable: true,
    isDemoListing: true
  }
]);

// 5. find() & pretty() — Query all hotels and filter 5-star stays in formatted output
db.hotels.find().pretty();
db.hotels.find({ starCategory: 5 }).pretty();

// 6. countDocuments() — Count total hotels and city-wise properties
db.hotels.countDocuments();
db.hotels.countDocuments({ city: "Mysuru" });

// 7. deleteOne() — Remove a single hotel record by hotelId
db.hotels.deleteOne({ hotelId: "htl_10" });

// Verify updated collection count
db.hotels.countDocuments();
