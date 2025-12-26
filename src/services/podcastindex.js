import axios from "axios";

/**
 * PodcastIndex API Service
 *
 * Uses iTunes Search API as a simpler alternative (no API key needed)
 * Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 */

const ITUNES_API = "https://itunes.apple.com";

/**
 * Search podcasts using iTunes Search API
 */
export const searchPodcasts = async (query, limit = 20) => {
  try {
    const response = await axios.get(`${ITUNES_API}/search`, {
      params: {
        term: query,
        media: "podcast",
        limit: limit,
      },
    });

    const results = response.data.results || [];
    return results.map((item) => ({
      id: item.collectionId,
      title: item.collectionName,
      host: item.artistName,
      description: item.description || "",
      coverUrl: item.artworkUrl600 || item.artworkUrl100,
      feedUrl: item.feedUrl,
      genre: item.primaryGenreName,
      episodeCount: item.trackCount,
      website: item.collectionViewUrl,
    }));
  } catch (error) {
    console.error("iTunes podcast search error:", error.message);
    return [];
  }
};

/**
 * Get trending podcasts (top podcasts from iTunes)
 */
export const getTrendingPodcasts = async (limit = 20) => {
  try {
    // Use the top podcasts RSS feed
    const response = await axios.get(
      `https://rss.applemarketingtools.com/api/v2/us/podcasts/top/${limit}/podcasts.json`
    );

    const feeds = response.data.feed?.results || [];
    return feeds.map((feed) => ({
      id: feed.id,
      title: feed.name,
      host: feed.artistName,
      coverUrl: feed.artworkUrl100,
      genre: feed.genres?.[0]?.name || "Podcast",
      url: feed.url,
    }));
  } catch (error) {
    console.error("iTunes trending error:", error.message);
    // Fallback to empty
    return [];
  }
};

/**
 * Get podcast episodes by looking up the feed
 */
export const getPodcastEpisodes = async (podcastId, limit = 20) => {
  try {
    const response = await axios.get(`${ITUNES_API}/lookup`, {
      params: {
        id: podcastId,
        entity: "podcastEpisode",
        limit: limit,
      },
    });

    // First result is the podcast itself, rest are episodes
    const results = response.data.results || [];
    const episodes = results.slice(1);

    return episodes.map((ep) => ({
      id: ep.trackId,
      title: ep.trackName,
      description: ep.description?.substring(0, 300) || "",
      audioUrl: ep.episodeUrl,
      duration: ep.trackTimeMillis ? Math.floor(ep.trackTimeMillis / 1000) : 0,
      datePublished: ep.releaseDate,
      image: ep.artworkUrl600 || ep.artworkUrl160,
    }));
  } catch (error) {
    console.error("iTunes episodes error:", error.message);
    return [];
  }
};

/**
 * Get podcasts by category/genre
 */
export const getPodcastsByCategory = async (category, limit = 20) => {
  return searchPodcasts(category, limit);
};

export default {
  searchPodcasts,
  getTrendingPodcasts,
  getPodcastEpisodes,
  getPodcastsByCategory,
};
