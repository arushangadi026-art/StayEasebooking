export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  city?: string;
  createdAt: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export type HotelCategory =
  | 'Budget'
  | 'Standard'
  | 'Premium'
  | 'Luxury'
  | 'Resort'
  | 'Boutique';

export interface Hotel {
  id: string;
  name: string;
  city: string;
  address: string;
  category: HotelCategory;
  starCategory: 3 | 4 | 5;
  description: string;
  images: string[];
  facilities: string[];
  startingPrice: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  checkInTime: string;
  checkOutTime: string;
  isDemoListing: boolean;
  featured: boolean;
}

export type RoomCategoryName =
  | 'Single Room'
  | 'Double Room'
  | 'Deluxe Room'
  | 'Premium Room'
  | 'Family Room'
  | 'Suite'
  | 'Executive Suite';

export interface Room {
  id: string;
  hotelId: string;
  category: RoomCategoryName;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  totalInventory: number;
  sizeSqFt: number;
  bedType: string;
  amenities: string[];
  image: string;
  isSamplePrice: boolean;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export interface BookingPricing {
  nights: number;
  roomPrice: number;
  numRooms: number;
  baseSubtotal: number;
  additionalCharges: number;
  taxes: number;
  estimatedTotal: number;
}

export interface Booking {
  id: string;
  bookingRef: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  hotelId: string;
  hotelName: string;
  hotelCity: string;
  roomId: string;
  roomCategory: RoomCategoryName;
  checkIn: string;
  checkOut: string;
  guests: number;
  numRooms: number;
  specialRequests: string;
  addBreakfast: boolean;
  addAirportTransfer: boolean;
  pricing: BookingPricing;
  status: BookingStatus;
  paymentSummaryNote: string;
  createdAt: string;
}

export interface Review {
  id: string;
  hotelId: string;
  hotelName: string;
  userId: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  stayDate: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface PromotionalEvent {
  id: string;
  title: string;
  hotelName: string;
  city: string;
  date: string;
  time: string;
  category: string;
  pricePerGuest: number;
  description: string;
  image: string;
  seatsAvailable: number;
}

export interface EventRegistration {
  id: string;
  registrationRef: string;
  eventId: string;
  eventTitle: string;
  fullName: string;
  email: string;
  mobile: string;
  guestsCount: number;
  notes: string;
  createdAt: string;
}

export interface AdminStats {
  totalHotels: number;
  totalRooms: number;
  totalInventoryUnits: number;
  totalCustomers: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  estimatedRevenue: number;
  totalReviews: number;
  totalMessages: number;
  totalEventRegistrations: number;
}
