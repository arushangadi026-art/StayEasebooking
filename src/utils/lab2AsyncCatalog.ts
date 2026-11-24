/**
 * LAB 2: JSON Data Using Promises (resolve/reject, then/catch) and Async/Await
 * Demonstrates practical loading and validation of STAYEASE hotel & room JSON data.
 */

import type { Hotel, Room } from '../../shared/types';

export interface Lab2CatalogResult {
  mode: 'Promise (.then/.catch)' | 'Async/Await';
  hotelCount: number;
  roomCount: number;
  lowestRateINR: number;
  highestRateINR: number;
  sampleHotelName: string;
  verifiedAt: string;
}

/**
 * Wraps hotel & room JSON inspection in an explicit Promise with resolve & reject.
 */
export function validateHotelCatalogPromise(
  hotels: Hotel[],
  rooms: Room[]
): Promise<Lab2CatalogResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!Array.isArray(hotels) || hotels.length === 0) {
        reject(new Error('Hotel JSON dataset is empty or unavailable.'));
        return;
      }
      if (!Array.isArray(rooms) || rooms.length === 0) {
        reject(new Error('Room JSON dataset is empty or unavailable.'));
        return;
      }

      const rates = rooms.map((r) => r.pricePerNight);
      resolve({
        mode: 'Promise (.then/.catch)',
        hotelCount: hotels.length,
        roomCount: rooms.length,
        lowestRateINR: Math.min(...rates),
        highestRateINR: Math.max(...rates),
        sampleHotelName: hotels[0].name,
        verifiedAt: new Date().toLocaleTimeString('en-IN'),
      });
    }, 180);
  });
}

/**
 * Demonstrates async/await fetching live JSON endpoints and awaiting the validation promise.
 */
export async function runLab2AsyncAwaitDemo(): Promise<{
  promiseFlow: Lab2CatalogResult;
  asyncFlow: Lab2CatalogResult;
}> {
  const [hotelsRes, roomsRes] = await Promise.all([
    fetch('/api/hotels'),
    fetch('/api/rooms'),
  ]);

  if (!hotelsRes.ok || !roomsRes.ok) {
    throw new Error('Failed to retrieve STAYEASE JSON API data.');
  }

  const hotelsJson = (await hotelsRes.json()) as { hotels: Hotel[] };
  const roomsJson = (await roomsRes.json()) as { rooms: Room[] };

  // Pattern A: Explicit .then() / .catch()
  const promiseFlow = await validateHotelCatalogPromise(
    hotelsJson.hotels,
    roomsJson.rooms
  )
    .then((result) => result)
    .catch((err) => {
      throw err;
    });

  // Pattern B: Async / Await
  const awaited = await validateHotelCatalogPromise(
    hotelsJson.hotels,
    roomsJson.rooms
  );
  const asyncFlow: Lab2CatalogResult = {
    ...awaited,
    mode: 'Async/Await',
  };

  return { promiseFlow, asyncFlow };
}
