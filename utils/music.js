// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { getTracksForGenre } = require('music-genre-lastfm-utils');

/**
 * Create music platform links from Last.fm tracks
 * @param {string} genre - Original genre name
 * @param {Array} tracks - Array of track objects from Last.fm
 * @returns {Object} Object with platform URLs and track list
 */
function createMusicLinks(genre, tracks) {
  const hasResults = tracks && tracks.length > 0;

  if (!hasResults) {
    // Fallback: create generic search links
    return {
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(genre)}`,
      appleMusicUrl: `https://music.apple.com/search?term=${encodeURIComponent(genre)}`,
      tracks: [],
      hasResults: false
    };
  }

  // Get first track for primary search
  const firstTrack = tracks[0];
  const searchQuery = `${firstTrack.artist.name} ${firstTrack.name}`;

  // Create track list for UI
  const trackList = tracks.slice(0, 10).map(track => ({
    name: track.name,
    artist: track.artist.name,
    url: track.url, // Last.fm track page
    listeners: parseInt(track.listeners || 0),
    playcount: parseInt(track.playcount || 0)
  }));

  return {
    // Primary links (open first track or genre search)
    spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`,
    appleMusicUrl: `https://music.apple.com/search?term=${encodeURIComponent(searchQuery)}`,

    // Alternative: genre-based search
    spotifyGenreUrl: `https://open.spotify.com/search/${encodeURIComponent(genre)}`,
    appleMusicGenreUrl: `https://music.apple.com/search?term=${encodeURIComponent(genre)}`,

    // Track information
    tracks: trackList,
    hasResults: true
  };
}

/**
 * Generate music data for a genre
 * @param {string} genre - Genre name
 * @returns {Promise<Object>} Music links and track data
 */
async function generateMusicData(genre) {
  const tracks = await getTracksForGenre(genre);
  return createMusicLinks(genre, tracks);
}

module.exports = {
  getTracksForGenre,
  createMusicLinks,
  generateMusicData
};
