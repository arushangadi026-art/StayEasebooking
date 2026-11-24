import { useState, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink, X } from 'lucide-react';
import { apiRequest, formatINR } from '../lib/api';
import { SafeImage } from '../components/SafeImage';
import type { PromotionalEvent, EventRegistration, PublicUser } from '../../shared/types';

interface EventWithSeats extends PromotionalEvent {
  registeredGuests: number;
  seatsRemaining: number;
}

interface EventsPageProps {
  user: PublicUser | null;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function EventsPage({ user, onNotify }: EventsPageProps) {
  const [events, setEvents] = useState<EventWithSeats[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithSeats | null>(null);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [guestsCount, setGuestsCount] = useState(2);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    apiRequest<{ events: EventWithSeats[]; registrations: EventRegistration[] }>('/api/events')
      .then((res) => {
        setEvents(res.events);
        setRegistrations(res.registrations);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setMobile(user.mobile);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          eventId: selectedEvent.id,
          fullName,
          email,
          mobile,
          guestsCount,
          notes,
        }),
      });
      onNotify('success', res.message);
      setSelectedEvent(null);
      setNotes('');
      loadData();
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to register.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4D7C5]">
        <div>
          <p className="text-xs font-semibold text-[#A66A38] mb-1">
            Lab 8 Integration · Persisted in data/eventRegistrations.json
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14]">
            Promotional Events & Special Stays
          </h1>
        </div>
        <a
          href="/lab8-events.html"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-[#D9C7B2] bg-[#FFFDF9] hover:bg-[#F2EAE0] text-[#2D1D14] rounded-xl self-start md:self-auto"
        >
          Open Lab 8 Bootstrap 5 Modal Page
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((ev) => (
          <article
            key={ev.id}
            className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="aspect-[16/9] bg-[#F2EAE0] overflow-hidden">
              <SafeImage src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="text-xs text-[#8C7561] flex flex-wrap items-center gap-3 mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#A66A38]" />
                  {ev.hotelName}, {ev.city}
                </span>
                <span className="inline-flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-[#A66A38]" />
                  {ev.date}
                </span>
              </div>
              <h2 className="font-display text-xl font-semibold text-[#2D1D14] mb-2">{ev.title}</h2>
              <p className="text-sm text-[#5A4334] mb-4 flex-1">{ev.description}</p>
              <div className="pt-4 border-t border-[#EFE5D8] flex items-center justify-between">
                <div>
                  <div className="font-mono text-base font-semibold text-[#2D1D14] tabular-nums">
                    {formatINR(ev.pricePerGuest)}
                    <span className="text-xs font-sans font-normal text-[#8C7561]"> / guest</span>
                  </div>
                  <div className="text-xs text-[#3A5A40] font-medium">
                    {ev.seatsRemaining} seats remaining
                  </div>
                </div>
                <button
                  type="button"
                  disabled={ev.seatsRemaining <= 0}
                  onClick={() => setSelectedEvent(ev)}
                  className="px-4 py-2 text-xs font-semibold bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {ev.seatsRemaining <= 0 ? 'Event Full' : 'Register Seat'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Persisted Event Registrations */}
      <section className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-6">
        <h2 className="font-display text-2xl font-semibold text-[#2D1D14] mb-4">
          Recent Persisted Registrations ({registrations.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-xs text-[#8C7561] border-b border-[#E4D7C5]">
                <th className="py-2.5 pr-4 font-semibold">Ref</th>
                <th className="py-2.5 pr-4 font-semibold">Event</th>
                <th className="py-2.5 pr-4 font-semibold">Guest</th>
                <th className="py-2.5 text-right font-semibold">Seats</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE5D8]">
              {registrations.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-[#2D1D14]">
                    {r.registrationRef}
                  </td>
                  <td className="py-2.5 pr-4 text-[#2D1D14]">{r.eventTitle}</td>
                  <td className="py-2.5 pr-4 text-[#5A4334]">{r.fullName}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{r.guestsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Registration Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-[#1E120B]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#A66A38]">Event Registration Modal</p>
                <h3 className="font-display text-2xl font-semibold text-[#2D1D14]">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close modal"
                className="p-1.5 text-[#6A5344] hover:bg-[#F2EAE0] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#6A5344] mb-1">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Mobile *</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Guests *</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6A5344] mb-1">Preferences</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional note"
                    className="w-full px-3 py-2 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Confirming...' : 'Confirm Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
