import { Suspense } from "react";
import { SpotifyCallbackClient } from "./spotify-callback-client";

export default function SpotifyCallbackPage() {
    return (
        <Suspense fallback={<SpotifyCallbackFallback />}>
            <SpotifyCallbackClient />
        </Suspense>
    );
}

const SpotifyCallbackFallback = () => {
    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-16 md:px-8">
            <div className="rounded-2xl border border-secondary bg-primary p-8 shadow-xs">
                <div className="space-y-4 text-center">
                    <p className="text-sm font-semibold text-brand-secondary">Spotify</p>
                    <h1 className="text-display-xs font-semibold text-primary">Finishing sign-in</h1>
                    <p className="rounded-xl border border-secondary bg-secondary px-5 py-4 text-sm text-secondary">Redirecting…</p>
                </div>
            </div>
        </main>
    );
};
