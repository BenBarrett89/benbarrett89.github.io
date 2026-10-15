"use client";

import { Button } from "@/components/base/buttons/button";
import { useSpotifyApi } from "@/hooks/use-spotify-api";
import { useSpotifyAuth } from "@/providers/auth-provider";

interface SpotifyImage {
    url: string;
    height: number | null;
    width: number | null;
}

interface SpotifyFollowers {
    total: number;
}

interface SpotifyUserProfile {
    country: string;
    display_name: string;
    email: string;
    external_urls: {
        spotify: string;
    };
    followers: SpotifyFollowers;
    href: string;
    id: string;
    images: SpotifyImage[];
    product: string;
    type: string;
    uri: string;
}

export default function SpotifyPage() {
    const { accessToken, error, isLoading, login, logout } = useSpotifyAuth();
    const { data: profile, error: profileError, isLoading: isProfileLoading } = useSpotifyApi<SpotifyUserProfile>("/me");

    const avatarUrl = profile?.images[0]?.url;

    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-4 py-16 md:px-8">
            <div className="rounded-2xl border border-secondary bg-primary p-8 shadow-xs">
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-brand-secondary">Spotify</p>
                        <h1 className="text-display-xs font-semibold text-primary">Spotify profile</h1>
                        <p className="text-md text-tertiary">
                            Sign in with Spotify using Authorization Code with PKCE, then load the current user profile from the Web API.
                        </p>
                    </div>

                    {!accessToken ? (
                        <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-secondary px-6 py-5">
                            <p className="text-sm text-secondary">You are not connected to Spotify yet.</p>
                            <div className="flex flex-wrap gap-3">
                                <Button color="primary" isDisabled={isLoading} isLoading={isLoading} onClick={() => void login()}>
                                    Log in with Spotify
                                </Button>
                                <Button color="link-gray" href="/">
                                    Back home
                                </Button>
                            </div>
                            {error && <p className="text-sm text-error-primary">{error}</p>}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary bg-secondary px-6 py-5">
                                <div>
                                    <p className="text-sm font-medium text-success-primary">Connected to Spotify</p>
                                    <p className="text-sm text-tertiary">Your access token is stored locally in the browser for this demo.</p>
                                </div>
                                <Button color="secondary-destructive" onClick={logout}>
                                    Log out
                                </Button>
                            </div>

                            {(error || profileError) && (
                                <div className="rounded-xl border border-error_subtle bg-error-secondary px-4 py-3 text-sm text-error-primary">
                                    {error ?? profileError}
                                </div>
                            )}

                            {isProfileLoading ? (
                                <div className="rounded-xl border border-secondary bg-secondary px-6 py-10 text-center text-sm text-tertiary">
                                    Loading Spotify profile…
                                </div>
                            ) : profile ? (
                                <div className="space-y-6 rounded-xl border border-secondary bg-secondary px-6 py-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        {avatarUrl ? (
                                            <img
                                                alt={profile.display_name}
                                                className="size-24 rounded-full border border-secondary object-cover"
                                                height={96}
                                                src={avatarUrl}
                                                width={96}
                                            />
                                        ) : (
                                            <div className="flex size-24 items-center justify-center rounded-full border border-secondary bg-primary text-lg font-semibold text-primary">
                                                {(profile.display_name ?? profile.id).slice(0, 1)}
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <h2 className="text-display-xs font-semibold text-primary">{profile.display_name}</h2>
                                            <p className="text-sm text-tertiary">{profile.email}</p>
                                            <a
                                                className="text-sm font-medium text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                                                href={profile.external_urls.spotify}
                                                rel="noreferrer"
                                                target="_blank"
                                            >
                                                Open in Spotify
                                            </a>
                                        </div>
                                    </div>

                                    <dl className="grid gap-4 sm:grid-cols-2">
                                        <ProfileField label="User ID" value={profile.id} />
                                        <ProfileField label="Country" value={profile.country} />
                                        <ProfileField label="Subscription" value={profile.product} />
                                        <ProfileField label="Followers" value={String(profile.followers.total)} />
                                        <ProfileField label="API href" value={profile.href} />
                                        <ProfileField label="Spotify URI" value={profile.uri} />
                                    </dl>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

const ProfileField = ({ label, value }: { label: string; value: string }) => {
    return (
        <div className="rounded-xl border border-secondary bg-primary px-4 py-3">
            <dt className="text-sm font-medium text-secondary">{label}</dt>
            <dd className="mt-1 text-sm break-all text-tertiary">{value}</dd>
        </div>
    );
};
