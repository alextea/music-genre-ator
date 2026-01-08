// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const lastfmApiKey = process.env.LASTFM_API_KEY;

/**
 * Fetch top tracks for a single tag from Last.fm
 * @param {string} tag - Tag to search for
 * @returns {Promise<Array>} Array of track objects
 */
async function fetchTracksByTag(tag) {
  if (!lastfmApiKey) {
    return [];
  }

  const encodedTag = encodeURIComponent(tag.toLowerCase());
  const url = `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${encodedTag}&limit=10&api_key=${lastfmApiKey}&format=json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle case where Last.fm returns error
    if (data.error) {
      console.warn(`Last.fm API error for tag "${tag}": ${data.message}`);
      return [];
    }

    // Last.fm returns tracks in data.tracks.track
    const tracks = data.tracks?.track || [];
    return Array.isArray(tracks) ? tracks : (tracks ? [tracks] : []);
  } catch (error) {
    console.error(`Error fetching tracks for tag "${tag}":`, error.message);
    return [];
  }
}

/**
 * Fetch top tracks for a given genre from Last.fm
 * Uses fallback strategy: tries full genre first, then combines results from individual words
 * @param {string} genre - Genre name to search for
 * @returns {Promise<Array>} Array of track objects
 */
async function getTracksForGenre(genre) {
  if (!lastfmApiKey) {
    console.warn('LASTFM_API_KEY not configured');
    return [];
  }

  // Try full genre name first
  console.log(`Searching Last.fm for full genre: "${genre}"`);
  let tracks = await fetchTracksByTag(genre);

  // If no results, try breaking down into individual words and combine results
  if (!tracks || tracks.length === 0) {
    console.log(`No results for full genre, trying individual words...`);

    // Split genre into words and remove common stop words
    const words = genre
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out very short words

    if (words.length > 1) {
      const allTracks = [];
      const trackMap = new Map(); // Use Map to track unique tracks

      // Fetch tracks for each word
      for (const word of words) {
        console.log(`Fetching tracks for tag: "${word}"`);
        const wordTracks = await fetchTracksByTag(word);

        if (wordTracks && wordTracks.length > 0) {
          console.log(`Found ${wordTracks.length} tracks for tag: "${word}"`);

          // Add tracks to map, using artist+name as unique key
          wordTracks.forEach(track => {
            const key = `${track.artist.name}|${track.name}`.toLowerCase();
            if (!trackMap.has(key)) {
              trackMap.set(key, track);
              allTracks.push(track);
            }
          });
        }
      }

      tracks = allTracks;
      console.log(`Combined total: ${tracks.length} unique tracks from all tags`);

      // Shuffle the combined tracks to mix different genres
      tracks = shuffleArray(tracks);

      // Limit to 10 tracks
      if (tracks.length > 10) {
        tracks = tracks.slice(0, 10);
        console.log(`Shuffled and limited to 10 tracks`);
      }
    }
  } else {
    console.log(`Found ${tracks.length} tracks for full genre`);
  }

  return tracks || [];
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
