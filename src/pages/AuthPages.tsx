import { useState, useEffect } from 'react';
import { Shield, ExternalLink, KeyRound } from 'lucide-react';
import { apiRequest, setAuthToken } from '../lib/api';
import type { PublicUser } from '../../shared/types';
import type { PageRoute } from '../components/Navbar';

interface AuthProps {
  onAuthSuccess: (user: PublicUser) => void;
  onNavigate: (page: PageRoute) => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export function LoginPage({ onAuthSuccess, onNavigate, onNotify }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // First-run admin setup claim status
  const [adminStatus, setAdminStatus] = useState<{
    configuredViaEnv: boolean;
    isConfigured: boolean;
    adminEmailHint: string | null;
  } | null>(null);
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [setupName, setSetupName] = useState('STAYEASE Administrator');
  const [setupEmail, setSetupEmail] = useState('admin@stayease.in');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    apiRequest<{
      configuredViaEnv: boolean;
      isConfigured: boolean;
      adminEmailHint: string | null;
    }>('/api/auth/admin-status')
      .then(setAdminStatus)
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiRequest<{ message: string; token: string; user: PublicUser }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );
      setAuthToken(res.token);
      onAuthSuccess(res.user);
      onNotify('success', res.message);
      onNavigate(res.user.role === 'admin' ? 'admin' : 'dashboard');
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPassword !== setupConfirm) {
      onNotify('error', 'Administrator passwords do not match.');
      return;
    }
    setSetupLoading(true);
    try {
      const res = await apiRequest<{ message: string; token: string; user: PublicUser }>(
        '/api/auth/admin-setup',
        {
          method: 'POST',
          body: JSON.stringify({
            fullName: setupName,
            email: setupEmail,
            password: setupPassword,
            confirmPassword: setupConfirm,
          }),
        }
      );
      setAuthToken(res.token);
      onAuthSuccess(res.user);
      onNotify('success', res.message);
      onNavigate('admin');
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to initialize admin.');
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-14 pb-24 space-y-6">
      <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-7 sm:p-9 shadow-sm">
        <p className="text-xs font-semibold text-[#A66A38] mb-1">
          Customer & Administrator Portal
        </p>
        <h1 className="font-display text-3xl font-semibold text-[#2D1D14] mb-2">
          Sign In to STAYEASE
        </h1>
        <p className="text-sm text-[#6A5344] mb-6">
          Access your upcoming bookings, guest reviews, or administrator dashboard.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6A5344] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.in"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-[#2D1D14] focus:outline-none focus:border-[#A66A38]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6A5344] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-[#2D1D14] focus:outline-none focus:border-[#A66A38]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Verifying Credentials...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-[#EFE5D8] flex items-center justify-between text-xs text-[#6A5344]">
          <span>New to STAYEASE?</span>
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="font-semibold text-[#A66A38] hover:text-[#2D1D14] cursor-pointer"
          >
            Create Customer Account →
          </button>
        </div>

        {/* Academic Demo Customer Convenience Note */}
        <div className="mt-5 p-3.5 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-xs text-[#5A4334] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="font-semibold text-[#2D1D14]">
              Preloaded Academic Demo Customer
            </div>
            <div>
              <code className="font-mono">aarav.kulkarni@example.in</code> ·{' '}
              <code className="font-mono">StayEase@2026</code>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('aarav.kulkarni@example.in');
              setPassword('StayEase@2026');
            }}
            className="px-3 py-1.5 text-xs font-semibold border border-[#D9C7B2] bg-[#FFFDF9] hover:bg-[#F2EAE0] text-[#2D1D14] rounded-lg cursor-pointer shrink-0"
          >
            Fill Demo Login
          </button>
        </div>
      </div>

      {/* First-Run Admin Setup (shown only when ADMIN_PASSWORD env var & admin.json are not configured yet) */}
      {adminStatus && !adminStatus.isConfigured && (
        <div className="bg-[#F2EAE0] border border-[#D9C7B2] rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A66A38] mb-1">
                <Shield className="w-3.5 h-3.5" />
                First-Run Administrator Setup
              </div>
              <h2 className="font-display text-xl font-semibold text-[#2D1D14]">
                Initialize Admin Account
              </h2>
              <p className="text-xs text-[#5A4334] mt-1">
                No <code className="font-mono">ADMIN_PASSWORD</code> environment variable is set yet.
                Claim a one-time hashed administrator password below to access the Admin Dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminSetup((prev) => !prev)}
              className="px-3 py-1.5 text-xs font-semibold bg-[#2D1D14] text-[#FAF6F0] rounded-lg shrink-0 cursor-pointer"
            >
              {showAdminSetup ? 'Hide Form' : 'Set Up Admin'}
            </button>
          </div>

          {showAdminSetup && (
            <form onSubmit={handleClaimAdmin} className="space-y-3 pt-2 border-t border-[#D9C7B2]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4334] mb-1">
                    Admin Name
                  </label>
                  <input
                    type="text"
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF9] border border-[#D9C7B2] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4334] mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF9] border border-[#D9C7B2] rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4334] mb-1">
                    Admin Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF9] border border-[#D9C7B2] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4334] mb-1">
                    Confirm Admin Password
                  </label>
                  <input
                    type="password"
                    value={setupConfirm}
                    onChange={(e) => setSetupConfirm(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF9] border border-[#D9C7B2] rounded-xl"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={setupLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#A66A38] hover:bg-[#8A5428] text-[#FFFDF9] text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-60"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {setupLoading ? 'Saving Hashed Admin...' : 'Initialize & Enter Admin Dashboard'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function RegisterPage({ onAuthSuccess, onNavigate, onNotify }: AuthProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      onNotify('error', 'Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<{ message: string; token: string; user: PublicUser }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            fullName,
            email,
            mobile,
            city,
            password,
            confirmPassword,
          }),
        }
      );
      setAuthToken(res.token);
      onAuthSuccess(res.user);
      onNotify('success', res.message);
      onNavigate('dashboard');
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 pb-24">
      <div className="bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl p-7 sm:p-9 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-xs font-semibold text-[#A66A38]">New Guest Registration</p>
          <a
            href="/lab7-register.html"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#4A3426] hover:text-[#A66A38] underline underline-offset-2"
          >
            Open Lab 7 Bootstrap 5 Version
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <h1 className="font-display text-3xl font-semibold text-[#2D1D14] mb-2">
          Create Your Account
        </h1>
        <p className="text-sm text-[#6A5344] mb-6">
          Your password is encrypted on the server using bcrypt before saving to{' '}
          <code className="font-mono text-xs">data/users.json</code>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6A5344] mb-1">Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Priya Kulkarni"
              required
              minLength={2}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.in"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98450 12345"
                required
                minLength={10}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6A5344] mb-1">Home City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bengaluru / Hubballi / Mysuru"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">
                Password * (min 6 chars)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6A5344] mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Create STAYEASE Account'}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-[#EFE5D8] flex items-center justify-between text-xs text-[#6A5344]">
          <span>Already registered?</span>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="font-semibold text-[#A66A38] hover:text-[#2D1D14] cursor-pointer"
          >
            Sign In Instead →
          </button>
        </div>
      </div>
    </div>
  );
}
