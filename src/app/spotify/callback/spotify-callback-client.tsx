"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { useSpotifyAuth } from "@/providers/auth-provider";

export const SpotifyCallbackClient = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { handleCallback } = useSpotifyAuth();
    const [error, setError] = useState<string | null>(null);
    const hasHandledCallback = useRef(false);

    useEffect(() => {
        const code = searchParams.get("code");
        const spotifyError = searchParams.get("error");

        if (hasHandledCallback.current) {
            return;
        }

        if (spotifyError) {
            hasHandledCallback.current = true;
            setError(spotifyError);
            return;
        }

        if (!code) {
            hasHandledCallback.current = true;
            setError("Missing Spotify authorization code.");
            return;
        }

        hasHandledCallback.current = true;

        void handleCallback(code)
            .then(() => {
                router.replace("/spotify");
            })
            .catch((cause) => {
                setError(cause instanceof Error ? cause.message : "Unable to complete Spotify authentication.");
            });
    }, [handleCallback, router, searchParams]);

    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-16 md:px-8">
            <div className="rounded-2xl border border-secondary bg-primary p-8 shadow-xs">
                <div className="space-y-4 text-center">
                    <p className="text-sm font-semibold text-brand-secondary">Spotify</p>
                    <h1 className="text-display-xs font-semibold text-primary">Finishing sign-in</h1>
                    <p className="text-md text-tertiary">
                        We are exchanging the authorization code for an access token and will send you back to your Spotify page.
                    </p>

                    {error ? (
                        <div className="space-y-4 rounded-xl border border-error_subtle bg-error-secondary px-5 py-4">
                            <p className="text-sm text-error-primary">{error}</p>
                            <div className="flex justify-center gap-3">
                                <Button color="primary" href="/spotify">
                                    Back to Spotify
                                </Button>
                                <Button color="link-gray" href="/">
                                    Home
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-secondary bg-secondary px-5 py-4 text-sm text-secondary">Redirecting…</div>
                    )}
                </div>
            </div>
        </main>
    );
};
