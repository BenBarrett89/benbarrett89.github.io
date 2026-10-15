const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9]+$/;

// Accepts a playlist URL, a spotify:playlist: URI or a bare ID; returns null if none can be found.
export const parseSpotifyPlaylistId = (input: string): string | null => {
    const value = input.trim();

    if (!value) {
        return null;
    }

    const uriMatch = value.match(/^spotify:playlist:([A-Za-z0-9]+)$/);

    if (uriMatch) {
        return uriMatch[1];
    }

    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);

            if (url.hostname !== "open.spotify.com") {
                return null;
            }

            const segments = url.pathname.split("/").filter(Boolean);
            const index = segments.indexOf("playlist");
            const id = index >= 0 ? segments[index + 1] : undefined;

            return id && PLAYLIST_ID_PATTERN.test(id) ? id : null;
        } catch {
            return null;
        }
    }

    return PLAYLIST_ID_PATTERN.test(value) ? value : null;
};
