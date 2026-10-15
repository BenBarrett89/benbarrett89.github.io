"use client";

import { useSpotifyApi } from "@/hooks/use-spotify-api";

export interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string | null;
    public: boolean | null;
    images: { url: string }[] | null;
    owner: { id: string; display_name: string | null };
    followers: { total: number };
    external_urls: { spotify: string };
}

export const useSpotifyPlaylist = (playlistId: string | null) => {
    return useSpotifyApi<SpotifyPlaylist>(playlistId ? `/playlists/${encodeURIComponent(playlistId)}` : null);
};
