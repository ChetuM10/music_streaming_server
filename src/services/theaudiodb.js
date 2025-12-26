import axios from "axios";

/**
 * TheAudioDB API Service
 *
 * Free music metadata + artwork
 * API Key: 2 (test key for demo)
 * Docs: https://www.theaudiodb.com/api_guide.php
 */

const AUDIODB_API = "https://www.theaudiodb.com/api/v1/json/2";

/**
 * Search for artist by name
 */
export const searchArtist = async (artistName) => {
  try {
    const response = await axios.get(`${AUDIODB_API}/search.php`, {
      params: { s: artistName },
    });

    const artists = response.data.artists || [];
    return artists.map((artist) => ({
      id: artist.idArtist,
      name: artist.strArtist,
      genre: artist.strGenre,
      style: artist.strStyle,
      country: artist.strCountry,
      bio: artist.strBiographyEN?.substring(0, 300),
      thumbnail: artist.strArtistThumb,
      banner: artist.strArtistBanner,
      logo: artist.strArtistLogo,
      fanart: artist.strArtistFanart,
      website: artist.strWebsite,
      facebook: artist.strFacebook,
      twitter: artist.strTwitter,
    }));
  } catch (error) {
    console.error("TheAudioDB artist search error:", error.message);
    return [];
  }
};

/**
 * Get artist discography (albums)
 */
export const getArtistAlbums = async (artistId) => {
  try {
    const response = await axios.get(`${AUDIODB_API}/album.php`, {
      params: { i: artistId },
    });

    const albums = response.data.album || [];
    return albums.map((album) => ({
      id: album.idAlbum,
      title: album.strAlbum,
      artist: album.strArtist,
      year: album.intYearReleased,
      genre: album.strGenre,
      style: album.strStyle,
      description: album.strDescriptionEN?.substring(0, 200),
      cover: album.strAlbumThumb,
      coverBack: album.strAlbumThumbBack,
      cdArt: album.strAlbumCDart,
    }));
  } catch (error) {
    console.error("TheAudioDB albums error:", error.message);
    return [];
  }
};

/**
 * Get album tracks
 */
export const getAlbumTracks = async (albumId) => {
  try {
    const response = await axios.get(`${AUDIODB_API}/track.php`, {
      params: { m: albumId },
    });

    const tracks = response.data.track || [];
    return tracks.map((track) => ({
      id: track.idTrack,
      title: track.strTrack,
      artist: track.strArtist,
      album: track.strAlbum,
      duration: track.intDuration
        ? Math.floor(parseInt(track.intDuration) / 1000)
        : 0,
      trackNumber: track.intTrackNumber,
      genre: track.strGenre,
      mood: track.strMood,
      musicVideo: track.strMusicVid,
    }));
  } catch (error) {
    console.error("TheAudioDB tracks error:", error.message);
    return [];
  }
};

/**
 * Search track directly
 */
export const searchTrack = async (artistName, trackName) => {
  try {
    const response = await axios.get(`${AUDIODB_API}/searchtrack.php`, {
      params: { s: artistName, t: trackName },
    });

    const tracks = response.data.track || [];
    return tracks.map((track) => ({
      id: track.idTrack,
      title: track.strTrack,
      artist: track.strArtist,
      album: track.strAlbum,
      albumId: track.idAlbum,
      duration: track.intDuration
        ? Math.floor(parseInt(track.intDuration) / 1000)
        : 0,
      genre: track.strGenre,
      mood: track.strMood,
      description: track.strDescriptionEN?.substring(0, 200),
      musicVideo: track.strMusicVid,
    }));
  } catch (error) {
    console.error("TheAudioDB track search error:", error.message);
    return [];
  }
};

/**
 * Get trending/popular music (top chart)
 */
export const getTrending = async () => {
  try {
    const response = await axios.get(`${AUDIODB_API}/trending.php`, {
      params: { country: "us", type: "itunes", format: "singles" },
    });

    const trending = response.data.trending || [];
    return trending.map((item) => ({
      id: item.idTrack,
      title: item.strTrack,
      artist: item.strArtist,
      album: item.strAlbum,
      cover: item.strTrackThumb,
      chartPlace: item.intChartPlace,
    }));
  } catch (error) {
    console.error("TheAudioDB trending error:", error.message);
    return [];
  }
};

export default {
  searchArtist,
  getArtistAlbums,
  getAlbumTracks,
  searchTrack,
  getTrending,
};
