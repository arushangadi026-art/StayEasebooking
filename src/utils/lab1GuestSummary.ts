/**
 * LAB 1: JavaScript ES6 Customer & Booking Summary Module
 * Demonstrates:
 *  - Objects
 *  - Object Destructuring
 *  - Arrow Functions
 *  - Array Methods (filter, map, reduce)
 *  - Template Literals
 */

import type { PublicUser, Booking } from '../../shared/types';

export interface GuestEs6Summary {
  headline: string;
  contactLine: string;
  statsLine: string;
  activeDestinations: string[];
  totalEstimatedSpend: number;
  recentNotes: string[];
}

export const buildCustomerBookingSummary = (
  customer: PublicUser,
  bookings: Booking[]
): GuestEs6Summary => {
  // Object destructuring
  const { fullName, email, mobile, city = 'India' } = customer;

  // Arrow functions + Array methods: filter, reduce, map
  const nonCancelled = bookings.filter(({ status }) => status !== 'Cancelled');
  const totalEstimatedSpend = nonCancelled.reduce(
    (sum, { pricing: { estimatedTotal } }) => sum + estimatedTotal,
    0
  );
  const totalNights = nonCancelled.reduce(
    (sum, { pricing: { nights } }) => sum + nights,
    0
  );

  const activeDestinations = [
    ...new Set(nonCancelled.map(({ hotelCity }) => hotelCity)),
  ];

  const recentNotes = bookings.slice(0, 3).map(
    ({ bookingRef, hotelName, roomCategory, status, pricing: { estimatedTotal } }) =>
      `${bookingRef} — ${hotelName} (${roomCategory}) · ${status} · ₹${estimatedTotal.toLocaleString('en-IN')}`
  );

  // Template literals
  const headline = `Guest Profile: ${fullName} (${city})`;
  const contactLine = `Email: ${email} · Mobile: ${mobile}`;
  const statsLine = `${bookings.length} total booking(s) · ${totalNights} night(s) planned · ₹${totalEstimatedSpend.toLocaleString('en-IN')} estimated demonstration value`;

  return {
    headline,
    contactLine,
    statsLine,
    activeDestinations,
    totalEstimatedSpend,
    recentNotes,
  };
};
