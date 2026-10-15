export interface SpotifyAuthConfig {
    clientId: string;
    redirectUri: string;
    scopes: string[];
}

export interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
    error?: string;
    error_description?: string;
}

export const SPOTIFY_ACCESS_TOKEN_STORAGE_KEY = "spotify_access_token";
export const SPOTIFY_REFRESH_TOKEN_STORAGE_KEY = "spotify_refresh_token";
export const SPOTIFY_CODE_VERIFIER_STORAGE_KEY = "spotify_code_verifier";

const SPOTIFY_CLIENT_ID_FALLBACK = "2549ab2541694fdd9f3c2b3992d067bd";

export const getSpotifyConfig = (): SpotifyAuthConfig => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? SPOTIFY_CLIENT_ID_FALLBACK;

    return {
        clientId,
        redirectUri: getSpotifyRedirectUri(),
        scopes: ["user-read-email", "user-read-private"],
    };
};

export const getSpotifyRedirectUri = (): string => {
    if (typeof window === "undefined") {
        return "/spotify/callback";
    }

    return new URL("/spotify/callback", window.location.origin).toString();
};

export const getStoredSpotifyAccessToken = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(SPOTIFY_ACCESS_TOKEN_STORAGE_KEY);
};

export const getStoredSpotifyRefreshToken = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(SPOTIFY_REFRESH_TOKEN_STORAGE_KEY);
};

export const getStoredSpotifyCodeVerifier = (): string | null => {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage.getItem(SPOTIFY_CODE_VERIFIER_STORAGE_KEY);
};

export const storeSpotifyCodeVerifier = (codeVerifier: string): void => {
    window.localStorage.setItem(SPOTIFY_CODE_VERIFIER_STORAGE_KEY, codeVerifier);
};

export const clearStoredSpotifyCodeVerifier = (): void => {
    window.localStorage.removeItem(SPOTIFY_CODE_VERIFIER_STORAGE_KEY);
};

export const storeSpotifyTokens = (tokens: SpotifyTokenResponse): void => {
    window.localStorage.setItem(SPOTIFY_ACCESS_TOKEN_STORAGE_KEY, tokens.access_token);

    if (tokens.refresh_token) {
        window.localStorage.setItem(SPOTIFY_REFRESH_TOKEN_STORAGE_KEY, tokens.refresh_token);
    }
};

export const clearSpotifyTokens = (): void => {
    window.localStorage.removeItem(SPOTIFY_ACCESS_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(SPOTIFY_REFRESH_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(SPOTIFY_CODE_VERIFIER_STORAGE_KEY);
};

const base64UrlEncode = (input: Uint8Array): string => {
    return btoa(String.fromCharCode(...input))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
};

const generateCodeVerifier = (): string => {
    return base64UrlEncode(crypto.getRandomValues(new Uint8Array(64)));
};

const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);

    return base64UrlEncode(new Uint8Array(digest));
};

export const generatePKCE = async (): Promise<{ codeVerifier: string; codeChallenge: string }> => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    return { codeVerifier, codeChallenge };
};
