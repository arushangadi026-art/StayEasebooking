// In-memory session token store (never written to localStorage or sessionStorage)
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message =
      (data && typeof data.error === 'string' && data.error) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function getDefaultDates(): { checkIn: string; checkOut: string } {
  const today = new Date();
  const ci = new Date(today.getTime() + 86400000 * 3);
  const co = new Date(today.getTime() + 86400000 * 5);
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { checkIn: toISO(ci), checkOut: toISO(co) };
}
