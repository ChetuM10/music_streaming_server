import axios from "axios";

/**
 * MusicBrainz API Service
 *
 * Free music metadata API - no API key required
 * Rate limit: 1 request per second
 * Docs: https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2
 */

const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";
const USER_AGENT = "MelodifyApp/1.0.0 (melodify@example.com)";

// Simple rate limiting
let lastRequest = 0;
const RATE_LIMIT_MS = 1100; // 1.1 seconds between requests

const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequest;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest)
    );
  }
  lastRequest = Date.now();
};

/**
 * Search for artists
 */
export const searchArtists = async (query, limit = 10) => {
  await waitForRateLimit();

  try {
    const response = await axios.get(`${MUSICBRAINZ_API}/artist`, {
      params: {
        query: `artist:${query}`,
        fmt: "json",
        limit,
      },
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    return (
      response.data.artists?.map((artist) => ({
        id: artist.id,
        name: artist.name,
        type: artist.type || "Artist",
        country: artist.country,
        disambiguation: artist.disambiguation,
        tags: artist.tags?.map((t) => t.name) || [],
      })) || []
    );
  } catch (error) {
    console.error("MusicBrainz artist search error:", error.message);
    return [];
  }
};

/**
 * Search for recordings (tracks)
 */
export const searchTracks = async (query, limit = 20) => {
  await waitForRateLimit();

  try {
    const response = await axios.get(`${MUSICBRAINZ_API}/recording`, {
      params: {
        query: `recording:${query}`,
        fmt: "json",
        limit,
      },
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    return (
      response.data.recordings?.map((recording) => ({
        id: recording.id,
        title: recording.title,
        artist: recording["artist-credit"]?.[0]?.name || "Unknown Artist",
        artistId: recording["artist-credit"]?.[0]?.artist?.id,
        album: recording.releases?.[0]?.title || "Single",
        albumId: recording.releases?.[0]?.id,
        duration: recording.length ? Math.floor(recording.length / 1000) : 0,
        year: recording["first-release-date"]?.substring(0, 4),
        tags: recording.tags?.map((t) => t.name) || [],
      })) || []
    );
  } catch (error) {
    console.error("MusicBrainz track search error:", error.message);
    return [];
  }
};

/**
 * Search for releases (albums)
 */
export const searchAlbums = async (query, limit = 10) => {
  await waitForRateLimit();

  try {
    const response = await axios.get(`${MUSICBRAINZ_API}/release`, {
      params: {
        query: `release:${query}`,
        fmt: "json",
        limit,
      },
      headers: {
        "User-Agent": USER_AGENT,
      },
    });

    return (
      response.data.releases?.map((release) => ({
        id: release.id,
        title: release.title,
        artist: release["artist-credit"]?.[0]?.name || "Unknown Artist",
        date: release.date,
        country: release.country,
        trackCount: release["track-count"],
        // Cover art URL from Cover Art Archive
        coverUrl: `https://coverartarchive.org/release/${release.id}/front-250`,
      })) || []
    );
  } catch (error) {
    console.error("MusicBrainz album search error:", error.message);
    return [];
  }
};

/**
 * Get album cover art URL
 */
export const getAlbumCover = (releaseId) => {
  return `https://coverartarchive.org/release/${releaseId}/front-250`;
};

export default {
  searchArtists,
  searchTracks,
  searchAlbums,
  getAlbumCover,
};
