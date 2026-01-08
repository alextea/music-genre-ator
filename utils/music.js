// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const lastfmApiKey = process.env.LASTFM_API_KEY;

/**
 * Fetch top tracks for a given genre from Last.fm
 * @param {string} genre - Genre name to search for
 * @returns {Promise<Array>} Array of track objects
 */
async function getTracksForGenre(genre) {
  if (!lastfmApiKey) {
    console.warn('LASTFM_API_KEY not configured');
    return [];
  }

  const tag = encodeURIComponent(genre.toLowerCase());
  const url = `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${tag}&limit=10&api_key=${lastfmApiKey}&format=json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data = await response.json();

    // Last.fm returns tracks in data.tracks.track
    const tracks = data.tracks?.track || [];

    // Handle case where Last.fm returns no results or error
    if (data.error) {
      console.warn(`Last.fm API error for genre "${genre}": ${data.message}`);
      return [];
    }

    return tracks;
  } catch (error) {
    console.error('Error fetching tracks from Last.fm:', error.message);
    return [];
  }
}

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
