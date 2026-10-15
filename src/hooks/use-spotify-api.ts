"use client";

import { useEffect, useState } from "react";
import { useSpotifyAuth } from "@/providers/auth-provider";

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

export const useSpotifyApi = <T>(path: string | null) => {
    const { accessToken, logout } = useSpotifyAuth();
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!accessToken || !path) {
            setData(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        const abortController = new AbortController();

        const load = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    signal: abortController.signal,
                });

                if (response.status === 401) {
                    logout();
                    return;
                }

                const body = (await response.json()) as T & { error?: { message?: string } };

                if (!response.ok) {
                    throw new Error(body.error?.message ?? `Spotify request failed: ${path}`);
                }

                setData(body);
            } catch (cause) {
                if (abortController.signal.aborted) {
                    return;
                }

                setError(cause instanceof Error ? cause.message : `Spotify request failed: ${path}`);
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        void load();

        return () => abortController.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, path]);

    return { data, error, isLoading };
};
