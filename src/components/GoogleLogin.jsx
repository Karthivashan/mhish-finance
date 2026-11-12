import { AlertCircle, Cloud, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import Logo from './layout/Logo';

export default function GoogleLogin() {
  const { connect, status, syncError, identityReady, identityLoading, prepareGoogleIdentity } = useGoogleDrive();
  const configured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const connecting = status === 'connecting';
  const onContinue = identityReady ? connect : prepareGoogleIdentity;

  return (
    <main className="app-glow relative flex min-h-screen items-center justify-center px-4 py-10">
      <section className="card relative z-10 w-full max-w-md p-7 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <Logo size={54} />
          <p className="eyebrow mt-6">Personal finance, in sync</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Welcome to Mhish</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Sign in with Google to securely save your finance data to your private Google Drive.
          </p>
        </div>

        <div className="mt-7 space-y-3 rounded-2xl border border-line/70 bg-bg/30 p-4">
          <p className="flex items-start gap-3 text-sm"><Cloud size={18} className="mt-0.5 shrink-0 text-accent" /><span>Your data loads when you sign in and saves to Drive as it changes.</span></p>
          <p className="flex items-start gap-3 text-sm"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" /><span>Your backup is stored in Drive’s private app-data area, not visible in My Drive.</span></p>
        </div>

        {syncError && (
          <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-expense/40 bg-expense/10 p-3 text-sm text-expense">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />{syncError}
          </p>
        )}

        <button type="button" className="btn-primary mt-6 w-full" onClick={onContinue} disabled={connecting || identityLoading || !configured}>
          {connecting || identityLoading ? <LoaderCircle size={18} className="animate-spin" /> : <GoogleMark />}
          {connecting ? 'Connecting to Google…' : identityLoading ? 'Loading Google sign-in…' : identityReady ? 'Continue with Google' : 'Retry Google sign-in setup'}
        </button>
        {!configured && (
          <p className="mt-3 text-center text-xs text-warn">
            Add <code>VITE_GOOGLE_CLIENT_ID</code> to your environment to enable sign-in.
          </p>
        )}
        <p className="mt-5 text-center text-xs leading-5 text-muted">
          Mhish requests access only to its own private Drive data and your basic Google account details.
        </p>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-[18px] w-[18px]">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 5)" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.05 11.05 0 0 1-4.8 7.24l7.73 5.99c4.51-4.17 7.11-10.31 7.11-17.7Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 5)" />
      <path fill="#34A853" d="M24 48c6.47 0 11.9-2.13 15.87-5.8l-7.73-5.99c-2.14 1.44-4.89 2.29-8.14 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -5)" />
    </svg>
  );
}
