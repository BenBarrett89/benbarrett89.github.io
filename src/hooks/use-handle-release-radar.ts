"use client";

import { useCallback, useState } from "react";
import type { SpotifyPlaylist } from "@/hooks/use-spotify-playlist";
import { useSpotifyAuth } from "@/providers/auth-provider";

export interface SpotifyTrack {
    id: string | null;
    name: string;
    uri: string;
    artists: { id: string | null; name: string }[];
    album: { id: string | null; name: string; release_date?: string; album_type?: string; total_tracks?: number };
    genres?: string[];
}

interface SpotifyArtist {
    genres?: string[];
}

export interface ExpandedTrack {
    uri: string;
    name: string;
    artists: string[];
    trackNumber: number | null;
    albumId: string | null;
    albumName: string;
    albumType?: string;
    totalTracks?: number;
    genres: string[];
    isInPlaylist: boolean;
}

interface AlbumTracksPage {
    items: { uri: string; name: string; track_number: number; artists: { name: string }[] }[];
    next: string | null;
}

const ALBUM_TYPE_ORDER: Record<string, number> = { single: 0, album: 1, compilation: 2 };
const ARTIST_FETCH_CONCURRENCY = 5;

interface PlaylistItemsPage {
    items: { item?: SpotifyTrack | null; track?: SpotifyTrack | null }[];
    next: string | null;
    error?: { message?: string };
}

const PAGE_SIZE = 50;
const ADD_ITEMS_MAX_URIS = 100;

const fetchArtistGenres = async (artistIds: string[], accessToken: string): Promise<Map<string, string[]>> => {
    const genres = new Map<string, string[]>();

    for (let start = 0; start < artistIds.length; start += ARTIST_FETCH_CONCURRENCY) {
        await Promise.all(
            artistIds.slice(start, start + ARTIST_FETCH_CONCURRENCY).map(async (artistId) => {
                try {
                    const response = await fetch(`https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });

                    if (response.ok) {
                        genres.set(artistId, ((await response.json()) as SpotifyArtist).genres ?? []);
                    }
                } catch {
                    // Genres only refine the ordering, so a failed lookup is not fatal.
                }
            }),
        );
    }

    return genres;
};

const fetchAlbumTracks = async (albumId: string, accessToken: string): Promise<AlbumTracksPage["items"] | null> => {
    const items: AlbumTracksPage["items"] = [];
    let nextUrl: string | null = `https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}/tracks?limit=${PAGE_SIZE}`;

    try {
        while (nextUrl) {
            const response: Response = await fetch(nextUrl, { headers: { Authorization: `Bearer ${accessToken}` } });

            if (!response.ok) {
                return null;
            }

            const page = (await response.json()) as AlbumTracksPage;

            items.push(...page.items);
            nextUrl = page.next;
        }
    } catch {
        return null;
    }

    return items;
};

// Each album is expanded once, at the position of its first track in the sorted list.
const expandToFullAlbums = async (sortedTracks: SpotifyTrack[], accessToken: string): Promise<ExpandedTrack[]> => {
    const playlistUris = new Set(sortedTracks.map((track) => track.uri));
    const seenAlbums = new Set<string>();
    const sources = sortedTracks.filter((track) => {
        const albumKey = track.album.id ?? track.uri;

        if (seenAlbums.has(albumKey)) {
            return false;
        }

        seenAlbums.add(albumKey);

        return true;
    });

    const albumTracks: (AlbumTracksPage["items"] | null)[] = [];

    for (let start = 0; start < sources.length; start += ARTIST_FETCH_CONCURRENCY) {
        albumTracks.push(
            ...(await Promise.all(
                sources
                    .slice(start, start + ARTIST_FETCH_CONCURRENCY)
                    .map((source) => (source.album.id ? fetchAlbumTracks(source.album.id, accessToken) : null)),
            )),
        );
    }

    return sources.flatMap((source, index): ExpandedTrack[] => {
        const common = {
            albumId: source.album.id,
            albumName: source.album.name,
            albumType: source.album.album_type,
            totalTracks: source.album.total_tracks,
            genres: source.genres ?? [],
        };
        const fetched = albumTracks[index];

        if (!fetched) {
            return [
                { ...common, uri: source.uri, name: source.name, artists: source.artists.map((artist) => artist.name), trackNumber: null, isInPlaylist: true },
            ];
        }

        return fetched.map((track) => ({
            ...common,
            uri: track.uri,
            name: track.name,
            artists: track.artists.map((artist) => artist.name),
            trackNumber: track.track_number,
            isInPlaylist: playlistUris.has(track.uri),
        }));
    });
};

// Singles first (fewest tracks first), then albums, then compilations; similar genres sit together within each group.
const sortTracks = (tracks: SpotifyTrack[], artistGenres: Map<string, string[]>): SpotifyTrack[] => {
    const genreKey = (track: SpotifyTrack) => {
        const artistId = track.artists[0]?.id;

        return (artistId && artistGenres.get(artistId)?.[0]) || "\uffff";
    };

    return [...tracks].sort((a, b) => {
        const typeA = a.album.album_type ?? "";
        const typeB = b.album.album_type ?? "";
        const byType = (ALBUM_TYPE_ORDER[typeA] ?? 3) - (ALBUM_TYPE_ORDER[typeB] ?? 3);

        if (byType !== 0) {
            return byType;
        }

        if (typeA === "single") {
            const byLength = (a.album.total_tracks ?? 0) - (b.album.total_tracks ?? 0);

            if (byLength !== 0) {
                return byLength;
            }
        }

        return genreKey(a).localeCompare(genreKey(b)) || (a.album.id ?? a.album.name).localeCompare(b.album.id ?? b.album.name);
    });
};

export const useHandleReleaseRadar = () => {
    const { accessToken, logout } = useSpotifyAuth();
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
    const [expandedTracks, setExpandedTracks] = useState<ExpandedTrack[]>([]);
    const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
    const [createPlaylistError, setCreatePlaylistError] = useState<string | null>(null);
    const [createdPlaylist, setCreatedPlaylist] = useState<{ name: string; url: string } | null>(null);

    const run = useCallback(
        async (playlist: SpotifyPlaylist) => {
            setIsRunning(true);
            setError(null);
            setResult(null);
            setTracks([]);
            setExpandedTracks([]);
            setCreatePlaylistError(null);
            setCreatedPlaylist(null);

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

                const artistIds = [...new Set(loadedTracks.map((track) => track.artists[0]?.id).filter((id): id is string => Boolean(id)))];
                const artistGenres = await fetchArtistGenres(artistIds, accessToken);
                const sortedTracks = sortTracks(
                    loadedTracks.map((track) => ({ ...track, genres: artistGenres.get(track.artists[0]?.id ?? "") ?? [] })),
                    artistGenres,
                );

                const nextExpandedTracks = await expandToFullAlbums(sortedTracks, accessToken);

                // Placeholder: replace with the real release radar logic.
                setTracks(sortedTracks);
                setExpandedTracks(nextExpandedTracks);
                setResult(`Loaded ${loadedTracks.length} tracks from "${playlist.name}".`);
            } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Script failed.");
            } finally {
                setIsRunning(false);
            }
        },
        [accessToken, logout],
    );

    const createPlaylist = useCallback(
        async (sourcePlaylist: SpotifyPlaylist) => {
            setIsCreatingPlaylist(true);
            setCreatePlaylistError(null);
            setCreatedPlaylist(null);

            try {
                if (!accessToken) {
                    throw new Error("Not connected to Spotify.");
                }

                const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
                const name = `${sourcePlaylist.name} (expanded)`;
                const createResponse = await fetch("https://api.spotify.com/v1/me/playlists", {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ name, description: `Full albums for the tracks in "${sourcePlaylist.name}".`, public: false }),
                });

                if (createResponse.status === 401) {
                    logout();
                    throw new Error("Spotify session expired. Log in again.");
                }

                const created = (await createResponse.json()) as { id: string; external_urls: { spotify: string }; error?: { message?: string } };

                if (!createResponse.ok) {
                    throw new Error(created.error?.message ?? "Failed to create playlist.");
                }

                const uris = expandedTracks.map((track) => track.uri);

                for (let start = 0; start < uris.length; start += ADD_ITEMS_MAX_URIS) {
                    const addResponse = await fetch(`https://api.spotify.com/v1/playlists/${encodeURIComponent(created.id)}/items`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({ uris: uris.slice(start, start + ADD_ITEMS_MAX_URIS) }),
                    });

                    if (!addResponse.ok) {
                        const body = (await addResponse.json()) as { error?: { message?: string } };

                        throw new Error(body.error?.message ?? "Failed to add tracks to the new playlist.");
                    }
                }

                setCreatedPlaylist({ name, url: created.external_urls.spotify });
            } catch (cause) {
                setCreatePlaylistError(cause instanceof Error ? cause.message : "Failed to create playlist.");
            } finally {
                setIsCreatingPlaylist(false);
            }
        },
        [accessToken, expandedTracks, logout],
    );

    return { run, isRunning, error, result, tracks, expandedTracks, createPlaylist, isCreatingPlaylist, createPlaylistError, createdPlaylist };
};
