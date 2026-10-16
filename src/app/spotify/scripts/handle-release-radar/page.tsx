"use client";

import { useState } from "react";
import { Table } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useHandleReleaseRadar } from "@/hooks/use-handle-release-radar";
import { useSpotifyPlaylist } from "@/hooks/use-spotify-playlist";
import { useSpotifyAuth } from "@/providers/auth-provider";
import { parseSpotifyPlaylistId } from "@/utils/spotify-playlist";

export default function HandleReleaseRadarPage() {
    const { accessToken, error, isLoading, login } = useSpotifyAuth();
    const [playlistInput, setPlaylistInput] = useState("");
    const [submittedPlaylistId, setSubmittedPlaylistId] = useState<string | null>(null);
    const { data: playlist, error: playlistError, isLoading: isPlaylistLoading } = useSpotifyPlaylist(submittedPlaylistId);
    const {
        run: runScript,
        isRunning,
        error: scriptError,
        result: scriptResult,
        tracks,
        expandedTracks,
        createPlaylist,
        isCreatingPlaylist,
        createPlaylistError,
        createdPlaylist,
    } = useHandleReleaseRadar();
    const playlistId = parseSpotifyPlaylistId(playlistInput);
    const isPlaylistInvalid = playlistInput.trim() !== "" && !playlistId;
    const playlistImageUrl = playlist?.images?.[0]?.url;

    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-4 py-16 md:px-8">
            <div className="rounded-2xl border border-secondary bg-primary p-8 shadow-xs">
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-brand-secondary">Spotify</p>
                        <h1 className="text-display-xs font-semibold text-primary">Handle release radar</h1>
                        <p className="text-md text-tertiary">Placeholder for the release radar script.</p>
                    </div>

                    {accessToken ? (
                        <>
                            <div className="rounded-xl border border-secondary bg-secondary px-6 py-5">
                                <p className="text-sm font-medium text-success-primary">Connected to Spotify</p>
                            </div>
                            <form
                                className="flex flex-col gap-4"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    setSubmittedPlaylistId(playlistId);
                                }}
                            >
                                <Input
                                    label="Playlist link or ID"
                                    placeholder="https://open.spotify.com/playlist/..."
                                    value={playlistInput}
                                    onChange={setPlaylistInput}
                                    isInvalid={isPlaylistInvalid}
                                    hint={
                                        isPlaylistInvalid ? "Enter a valid Spotify playlist link or ID." : playlistId ? `Playlist ID: ${playlistId}` : undefined
                                    }
                                />
                                <div>
                                    <Button type="submit" color="primary" isDisabled={!playlistId || isPlaylistLoading} isLoading={isPlaylistLoading}>
                                        Fetch playlist
                                    </Button>
                                </div>
                            </form>

                            {playlistError && (
                                <div className="rounded-xl border border-error_subtle bg-error-secondary px-4 py-3 text-sm text-error-primary">
                                    {playlistError}
                                </div>
                            )}

                            {playlist && (
                                <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-secondary px-6 py-6 sm:flex-row">
                                    {playlistImageUrl && (
                                        <img
                                            alt={playlist.name}
                                            className="size-24 rounded-lg border border-secondary object-cover"
                                            height={96}
                                            src={playlistImageUrl}
                                            width={96}
                                        />
                                    )}
                                    <div className="space-y-1">
                                        <h2 className="text-display-xs font-semibold text-primary">{playlist.name}</h2>
                                        <p className="text-sm text-tertiary">By {playlist.owner.display_name ?? playlist.owner.id}</p>
                                        {playlist.description && <p className="text-sm text-tertiary">{playlist.description}</p>}
                                        <p className="text-sm text-tertiary">
                                            {playlist.public ? "Public" : "Private"} · {playlist.followers.total} followers
                                        </p>
                                        <a
                                            className="text-sm font-medium text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                                            href={playlist.external_urls.spotify}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            Open in Spotify
                                        </a>
                                    </div>
                                </div>
                            )}

                            {playlist && (
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <Button color="secondary" isDisabled={isRunning} isLoading={isRunning} onClick={() => void runScript(playlist)}>
                                            Run script
                                        </Button>
                                    </div>
                                    {scriptResult && <p className="text-sm text-success-primary">{scriptResult}</p>}
                                    {scriptError && <p className="text-sm text-error-primary">{scriptError}</p>}
                                    {tracks.length > 0 && (
                                        <ul className="max-h-96 divide-y divide-secondary overflow-y-auto rounded-xl border border-secondary bg-primary">
                                            {tracks.map((track, index) => (
                                                <li key={`${track.uri}-${index}`} className="px-4 py-3">
                                                    <p className="text-sm font-medium text-primary">{track.name}</p>
                                                    <p className="text-sm text-tertiary">
                                                        {track.artists.map((artist) => artist.name).join(", ")} · {track.album.name}
                                                        {track.album.total_tracks !== undefined &&
                                                            ` · ${track.album.album_type ?? "release"} (${track.album.total_tracks} ${track.album.total_tracks === 1 ? "track" : "tracks"})`}
                                                    </p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {expandedTracks.length > 0 && (
                                        <div className="max-h-96 overflow-y-auto rounded-xl border border-secondary bg-primary">
                                            <Table aria-label="Full albums for the playlist tracks" size="sm">
                                                <Table.Header>
                                                    <Table.Head id="track" isRowHeader label="Track" />
                                                    <Table.Head id="artists" label="Artists" />
                                                    <Table.Head id="album" label="Album" />
                                                    <Table.Head id="type" label="Type" />
                                                    <Table.Head id="inPlaylist" label="In playlist" />
                                                </Table.Header>
                                                <Table.Body items={expandedTracks.map((track, index) => ({ ...track, rowId: `${index}-${track.uri}` }))}>
                                                    {(track) => (
                                                        <Table.Row id={track.rowId}>
                                                            <Table.Cell>
                                                                {track.trackNumber ? `${track.trackNumber}. ` : ""}
                                                                {track.name}
                                                            </Table.Cell>
                                                            <Table.Cell>{track.artists.join(", ")}</Table.Cell>
                                                            <Table.Cell>{track.albumName}</Table.Cell>
                                                            <Table.Cell>
                                                                {track.albumType ?? "-"}
                                                                {track.totalTracks !== undefined && ` (${track.totalTracks})`}
                                                            </Table.Cell>
                                                            <Table.Cell>{track.isInPlaylist ? "Yes" : "No"}</Table.Cell>
                                                        </Table.Row>
                                                    )}
                                                </Table.Body>
                                            </Table>
                                        </div>
                                    )}
                                    {expandedTracks.length > 0 && (
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <Button
                                                    color="primary"
                                                    isDisabled={isCreatingPlaylist}
                                                    isLoading={isCreatingPlaylist}
                                                    onClick={() => void createPlaylist(playlist)}
                                                >
                                                    Create playlist
                                                </Button>
                                            </div>
                                            {createdPlaylist && (
                                                <p className="text-sm text-success-primary">
                                                    Created "{createdPlaylist.name}".{" "}
                                                    <a className="font-medium underline" href={createdPlaylist.url} rel="noreferrer" target="_blank">
                                                        Open in Spotify
                                                    </a>
                                                </p>
                                            )}
                                            {createPlaylistError && <p className="text-sm text-error-primary">{createPlaylistError}</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 rounded-xl border border-secondary bg-secondary px-6 py-5">
                            <p className="text-sm text-secondary">You are not connected to Spotify yet.</p>
                            <div>
                                <Button color="primary" isDisabled={isLoading} isLoading={isLoading} onClick={() => void login()}>
                                    Log in with Spotify
                                </Button>
                            </div>
                            {error && <p className="text-sm text-error-primary">{error}</p>}
                        </div>
                    )}

                    <div>
                        <Button color="link-gray" href="/spotify">
                            Back to Spotify
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}
