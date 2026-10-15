"use client";

import { useCallback, useState } from "react";
import type { SpotifyPlaylist } from "@/hooks/use-spotify-playlist";
import { useSpotifyAuth } from "@/providers/auth-provider";

export interface SpotifyTrack {
    id: string | null;
    name: string;
    uri: string;
    artists: { id: string | null; name: string }[];
    album: { name: string; release_date?: string };
}

interface PlaylistItemsPage {
    items: { item?: SpotifyTrack | null; track?: SpotifyTrack | null }[];
    next: string | null;
    error?: { message?: string };
}

const PAGE_SIZE = 50;

export const useHandleReleaseRadar = () => {
    const { accessToken, logout } = useSpotifyAuth();
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [tracks, setTracks] = useState<SpotifyTrack[]>([]);

    const run = useCallback(
        async (playlist: SpotifyPlaylist) => {
            setIsRunning(true);
            setError(null);
            setResult(null);
            setTracks([]);

            try {
                if (!accessToken) {
                    throw new Error("Not connected to Spotify.");
                }

                const loadedTracks: SpotifyTrack[] = [];
                let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlist.id)}/items?limit=${PAGE_SIZE}`;

                while (nextUrl) {
                    const response: Response = await fetch(nextUrl, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });

                    if (response.status === 401) {
                        logout();
                        throw new Error("Spotify session expired. Log in again.");
                    }

                    const page = (await response.json()) as PlaylistItemsPage;

                    if (!response.ok) {
                        throw new Error(page.error?.message ?? "Failed to load playlist tracks.");
                    }

                    for (const entry of page.items) {
                        const track = entry.item ?? entry.track;

                        if (track) {
                            loadedTracks.push(track);
                        }
                    }

                    nextUrl = page.next;
                }

                // Placeholder: replace with the real release radar logic.
                setTracks(loadedTracks);
                setResult(`Loaded ${loadedTracks.length} tracks from "${playlist.name}".`);
            } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Script failed.");
            } finally {
                setIsRunning(false);
            }
        },
        [accessToken, logout],
    );

    return { run, isRunning, error, result, tracks };
};
