"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    type SpotifyTokenResponse,
    clearSpotifyTokens,
    clearStoredSpotifyCodeVerifierCookie,
    generatePKCE,
    getSpotifyConfig,
    getStoredSpotifyAccessToken,
    getStoredSpotifyCodeVerifier,
    getStoredSpotifyRefreshToken,
    storeSpotifyCodeVerifierCookie,
    storeSpotifyTokens,
} from "@/utils/spotify-auth";

interface SpotifyAuthContextType {
    accessToken: string | null;
    refreshToken: string | null;
    error: string | null;
    isLoading: boolean;
    login: () => Promise<void>;
    handleCallback: (code: string) => Promise<void>;
    logout: () => void;
}

const SpotifyAuthContext = createContext<SpotifyAuthContextType | undefined>(undefined);

export const SpotifyAuthProvider = ({ children }: { children: ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setAccessToken(getStoredSpotifyAccessToken());
        setRefreshToken(getStoredSpotifyRefreshToken());
    }, []);

    const login = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { codeVerifier, codeChallenge } = await generatePKCE();
            const config = getSpotifyConfig();
            const authUrl = new URL("https://accounts.spotify.com/authorize");

            storeSpotifyCodeVerifierCookie(codeVerifier);

            authUrl.searchParams.set("client_id", config.clientId);
            authUrl.searchParams.set("response_type", "code");
            authUrl.searchParams.set("redirect_uri", config.redirectUri);
            authUrl.searchParams.set("scope", config.scopes.join(" "));
            authUrl.searchParams.set("code_challenge_method", "S256");
            authUrl.searchParams.set("code_challenge", codeChallenge);

            window.location.assign(authUrl.toString());
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Unable to start Spotify authentication.");
            setIsLoading(false);
        }
    };

    const handleCallback = async (code: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const codeVerifier = getStoredSpotifyCodeVerifier();
            clearStoredSpotifyCodeVerifierCookie();

            if (!codeVerifier) {
                throw new Error("Missing Spotify PKCE code verifier. Start the login flow again.");
            }

            const config = getSpotifyConfig();
            const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    client_id: config.clientId,
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: config.redirectUri,
                    code_verifier: codeVerifier,
                }),
            });

            const tokens = (await tokenResponse.json()) as SpotifyTokenResponse;

            if (!tokenResponse.ok || !tokens.access_token) {
                throw new Error(tokens.error_description ?? tokens.error ?? "Failed to exchange Spotify authorization code.");
            }

            storeSpotifyTokens(tokens);
            setAccessToken(tokens.access_token);
            setRefreshToken(tokens.refresh_token ?? null);
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : "Unable to complete Spotify authentication.";
            setError(message);
            throw cause;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        clearSpotifyTokens();
        setAccessToken(null);
        setRefreshToken(null);
        setError(null);
    };

    const value = useMemo<SpotifyAuthContextType>(
        () => ({
            accessToken,
            refreshToken,
            error,
            isLoading,
            login,
            handleCallback,
            logout,
        }),
        [accessToken, refreshToken, error, isLoading],
    );

    return <SpotifyAuthContext.Provider value={value}>{children}</SpotifyAuthContext.Provider>;
};

export const useSpotifyAuth = () => {
    const context = useContext(SpotifyAuthContext);

    if (!context) {
        throw new Error("useSpotifyAuth must be used within a SpotifyAuthProvider");
    }

    return context;
};
