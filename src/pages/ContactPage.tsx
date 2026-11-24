import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { apiRequest } from '../lib/api';

interface ContactPageProps {
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function ContactPage({ onNotify }: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, mobile, subject, message }),
      });
      onNotify('success', res.message);
      setName('');
      setEmail('');
      setMobile('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-semibold text-[#A66A38] mb-1">About STAYEASE & Concierge</p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14]">
              Warm Hospitality, Thoughtfully Engineered
            </h1>
            <p className="mt-3 text-sm text-[#5A4334] leading-relaxed">
              STAYEASE (“Find Comfort. Book with Ease.”) is a full-stack BCA III Semester Server-Side
              Web Development project demonstrating luxury hospitality UX backed by Node.js, Express,
              bcrypt security, and persistent JSON file storage.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#E4D7C5] text-sm text-[#4A3426]">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#A66A38] mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-[#2D1D14]">Academic Demonstration Office</div>
                <div className="text-xs text-[#6A5344]">
                  Vidyanagar Hospitality Lab, Hubballi & Bengaluru, Karnataka, India
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#A66A38] mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-[#2D1D14]">Concierge Desk</div>
                <div className="text-xs text-[#6A5344]">concierge@stayease.in (Fictional)</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#A66A38] mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-[#2D1D14]">Guest Assistance</div>
                <div className="text-xs text-[#6A5344]">+91 80 4100 2026 (Demo Helpline)</div>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm"
        >
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#2D1D14]">Send an Inquiry</h2>
            <p className="text-xs text-[#8C7561] mt-0.5">
              All contact inquiries are validated and persisted directly to{' '}
              <code className="font-mono">data/messages.json</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.in"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                placeholder="+91 98450 00000"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Group booking, stay query..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6A5344] mb-1">Message *</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={10}
              placeholder="Tell us how STAYEASE can help plan your stay..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Sending Inquiry...' : 'Submit Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
