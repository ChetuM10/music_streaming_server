import express from "express";
import musicbrainz from "../services/musicbrainz.js";
import theaudiodb from "../services/theaudiodb.js";
import podcastindex from "../services/podcastindex.js";

const router = express.Router();

/**
 * External API Routes
 *
 * Provides access to external music and podcast databases
 * for searching real-world content
 */

/**
 * @route   GET /api/external/search
 * @desc    Search all external sources (music + podcasts)
 * @access  Public
 */
router.get("/search", async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    // Search all sources in parallel
    const [mbTracks, audiodbArtist, podcasts] = await Promise.all([
      musicbrainz.searchTracks(q, parseInt(limit)),
      theaudiodb.searchArtist(q),
      podcastindex.searchPodcasts(q, parseInt(limit)),
    ]);

    res.json({
      success: true,
      data: {
        tracks: mbTracks,
        artists: audiodbArtist,
        podcasts: podcasts,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/external/music/search
 * @desc    Search music only (tracks, artists, albums)
 * @access  Public
 */
router.get("/music/search", async (req, res, next) => {
  try {
    const { q, type = "all", limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    let results = {};

    if (type === "all" || type === "tracks") {
      results.tracks = await musicbrainz.searchTracks(q, parseInt(limit));
    }

    if (type === "all" || type === "artists") {
      results.artists = await theaudiodb.searchArtist(q);
    }

    if (type === "all" || type === "albums") {
      results.albums = await musicbrainz.searchAlbums(q, parseInt(limit));
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/external/music/trending
 * @desc    Get trending music from TheAudioDB
 * @access  Public
 */
router.get("/music/trending", async (req, res, next) => {
  try {
    const trending = await theaudiodb.getTrending();

    res.json({
      success: true,
      data: trending,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/external/artist/:name
 * @desc    Get artist details with albums
 * @access  Public
 */
router.get("/artist/:name", async (req, res, next) => {
  try {
    const { name } = req.params;

    const artists = await theaudiodb.searchArtist(name);

    if (artists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const artist = artists[0];
    const albums = await theaudiodb.getArtistAlbums(artist.id);

    res.json({
      success: true,
      data: {
        ...artist,
        albums,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/external/album/:albumId/tracks
 * @desc    Get album tracks from TheAudioDB
 * @access  Public
 */
router.get("/album/:albumId/tracks", async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const tracks = await theaudiodb.getAlbumTracks(albumId);

    res.json({
      success: true,
      data: tracks,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/external/podcasts/search
 * @desc    Search podcasts
 * @access  Public
 */
router.get("/podcasts/search", async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const podcasts = await podcastindex.searchPodcasts(q, parseInt(limit));

    res.json({
      success: true,
      data: podcasts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/external/podcasts/trending
 * @desc    Get trending podcasts
 * @access  Public
 */
router.get("/podcasts/trending", async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const trending = await podcastindex.getTrendingPodcasts(parseInt(limit));

    res.json({
      success: true,
      data: trending,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/external/podcasts/:podcastId/episodes
 * @desc    Get podcast episodes
 * @access  Public
 */
router.get("/podcasts/:podcastId/episodes", async (req, res, next) => {
  try {
    const { podcastId } = req.params;
    const { limit = 20 } = req.query;

    const episodes = await podcastindex.getPodcastEpisodes(
      podcastId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: episodes,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
