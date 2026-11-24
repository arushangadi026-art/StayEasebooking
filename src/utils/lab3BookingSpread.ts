/**
 * LAB 3: Spread and Rest Operators & Array Destructuring
 * Demonstrates:
 *  - Spread operator with customer objects
 *  - Combining booking information objects
 *  - Spread operator with arrays (merging hotel & room amenities)
 *  - Rest parameters for summing variable additional booking charges
 *  - Array destructuring
 */

export interface CustomerBase {
  fullName: string;
  email: string;
  mobile: string;
}

export interface BookingDraftBase {
  hotelName: string;
  roomCategory: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  numRooms: number;
  roomPrice: number;
}

// Rest parameter (...extraCharges) to sum arbitrary add-on services
export function sumVariableCharges(...extraCharges: number[]): number {
  return extraCharges.reduce((total, fee) => total + fee, 0);
}

// Spread operator with customer object + combining booking information
export function composeBookingEstimate(
  customer: CustomerBase,
  booking: BookingDraftBase,
  hotelFacilities: string[],
  roomAmenities: string[],
  ...extraCharges: number[]
) {
  const baseSubtotal = booking.roomPrice * booking.nights * booking.numRooms;
  const additionalCharges = sumVariableCharges(...extraCharges);
  const taxes = Math.round((baseSubtotal + additionalCharges) * 0.12);
  const estimatedTotal = baseSubtotal + additionalCharges + taxes;

  // Spread operator combining customer and booking objects
  const combinedRecord = {
    ...customer,
    ...booking,
    baseSubtotal,
    additionalCharges,
    taxes,
    estimatedTotal,
  };

  // Spread operator with arrays (deduplicated merged perks)
  const mergedAmenities = [...new Set([...hotelFacilities, ...roomAmenities])];

  // Array destructuring to highlight primary and secondary perks
  const [primaryPerk = 'Free Wi-Fi', secondaryPerk = 'Daily Housekeeping', ...remainingPerks] =
    mergedAmenities;

  return {
    combinedRecord,
    primaryPerk,
    secondaryPerk,
    remainingPerksCount: remainingPerks.length,
    mergedAmenities,
  };
}
