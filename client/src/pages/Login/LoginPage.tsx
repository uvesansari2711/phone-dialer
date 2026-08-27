import { useCallback, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ApiClientError } from '../../services/api';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setIsSubmitting(true);

      try {
        await login(email.trim(), password);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError('Unable to sign in. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, login],
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-dialer-app px-2 py-2 sm:px-3 sm:py-3">
      <div className="mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-dialer-border bg-dialer-card shadow-card">
        <div className="flex min-h-0 flex-1 flex-col justify-center px-6 pb-8 pt-4">
          <div className="-mt-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-dialer-accent/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-dialer-accent"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25-.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-dialer-text">Welcome back</h1>
            <p className="mt-2 text-sm text-dialer-textSecondary">
              Sign in to access the phone dialer
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-dialer-text"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@dialer.com"
                className="w-full rounded-2xl border border-dialer-border bg-dialer-key px-4 py-3 text-dialer-text placeholder:text-dialer-textMuted focus:border-dialer-accent focus:outline-none focus:ring-2 focus:ring-dialer-accent/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-dialer-text"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-dialer-border bg-dialer-key px-4 py-3 pr-12 text-dialer-text placeholder:text-dialer-textMuted focus:border-dialer-accent focus:outline-none focus:ring-2 focus:ring-dialer-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-dialer-textMuted transition-colors hover:text-dialer-text"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.25 3.385l-1.428-1.428a9.749 9.749 0 001.632-3.294 9.749 9.749 0 00-17.62 0 9.749 9.749 0 001.632 3.294l-1.428 1.428a11.25 11.25 0 01-2.25-3.385 11.249 11.249 0 010-1.106 11.249 11.249 0 012.25-3.385l1.428 1.428a9.749 9.749 0 00-1.632 3.294 9.749 9.749 0 0017.62 0 9.749 9.749 0 00-1.632-3.294l1.428-1.428a11.25 11.25 0 012.25 3.385 11.249 11.249 0 010 1.106z" />
                      <path d="M12 15.75a3.75 3.75 0 01-3.651-2.868l4.518 4.518A3.75 3.75 0 0112 15.75z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                      <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.674 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-dialer-danger" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-dialer-accent py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-dialer-accentDark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
