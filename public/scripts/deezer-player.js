(function() {
  'use strict';

  // Constants
  const DEEZER_PROXY = '/api/deezer/search';
  const CACHE_PREFIX = 'deezer:';
  const CACHE_EXPIRY_DAYS = 7;

  // State
  let currentAudio = null;
  let currentTrackElement = null;

  /**
   * Search Deezer API for a track by artist and track name
   * @param {string} artist - Artist name
   * @param {string} trackName - Track name
   * @returns {Promise<Object|null>} Track data or null if not found
   */
  async function searchDeezerTrack(artist, trackName) {
    const cacheKey = `${CACHE_PREFIX}${artist.toLowerCase()}:${trackName.toLowerCase()}`;

    // Check cache first
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() < data.expiresAt) {
          console.log('Deezer: Using cached track data');
          return data;
        }
        // Cache expired, remove it
        localStorage.removeItem(cacheKey);
      }
    } catch (error) {
      console.error('Deezer: Cache read error:', error);
    }

    // Search Deezer API via proxy
    const query = encodeURIComponent(`artist:"${artist}" track:"${trackName}"`);
    const url = `${DEEZER_PROXY}?q=${query}`;

    try {
      console.log('Deezer: Searching for track:', artist, '-', trackName);
      const response = await fetch(url);

      if (!response.ok) {
        console.error('Deezer: API request failed:', response.status);
        return null;
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const track = data.data[0];

        // Build result object
        const result = {
          trackId: track.id,
          preview: track.preview,
          title: track.title,
          artist: track.artist.name,
          album: track.album.title,
          cover: track.album.cover_medium,
          expiresAt: Date.now() + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        };

        // Cache result
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
          console.log('Deezer: Track found and cached');
        } catch (error) {
          console.error('Deezer: Cache write error:', error);
        }

        return result;
      }

      console.log('Deezer: No results found');
      return null;
    } catch (error) {
      console.error('Deezer: Search failed:', error);
      return null;
    }
  }

  /**
   * Play a track
   * @param {Object} trackData - Track data from Deezer API
   * @param {HTMLElement} buttonElement - The play button element
   */
  function playTrack(trackData, buttonElement) {
    // Stop any currently playing track
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      if (currentTrackElement) {
        currentTrackElement.classList.remove('is-playing');
        const prevButton = currentTrackElement.querySelector('.play-button');
        if (prevButton) {
          setPlayButtonState(prevButton, false);
        }
      }
    }

    // Create or reuse audio element
    if (!currentAudio) {
      currentAudio = new Audio();
      currentAudio.addEventListener('ended', handleTrackEnded);
      currentAudio.addEventListener('error', handleTrackError);
    }

    // Set source and play
    currentAudio.src = trackData.preview;
    currentAudio.play()
      .then(() => {
        currentTrackElement = buttonElement.closest('.track-item');
        currentTrackElement.classList.add('is-playing');
        setPlayButtonState(buttonElement, true);
        console.log('Deezer: Playback started');
      })
      .catch(error => {
        console.error('Deezer: Playback failed:', error);
        alert('Playback failed. Please try again.');
        setPlayButtonState(buttonElement, false);
      });
  }

  /**
   * Stop the currently playing track
   */
  function stopTrack() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    if (currentTrackElement) {
      currentTrackElement.classList.remove('is-playing');
      const button = currentTrackElement.querySelector('.play-button');
      if (button) {
        setPlayButtonState(button, false);
      }
      currentTrackElement = null;
    }

    console.log('Deezer: Playback stopped');
  }

  /**
   * Set loading state on play button
   * @param {HTMLElement} button - The play button element
   * @param {boolean} isLoading - Loading state
   */
  function setPlayButtonLoading(button, isLoading) {
    const playIcon = button.querySelector('.play-icon');

    if (isLoading) {
      playIcon.classList.add('play-icon--loading');
      playIcon.classList.remove('play-icon--play', 'play-icon--pause');
    } else {
      button.classList.remove('play-icon--loading');
      playIcon.classList.add('play-icon--pause');
    }
  }

  /**
   * Set play/pause state on button
   * @param {HTMLElement} button - The play button element
   * @param {boolean} isPlaying - Playing state
   */
  function setPlayButtonState(button, isPlaying) {
    const playIcon = button.querySelector('.play-icon');

    if (isPlaying) {
      playIcon.classList.add('play-icon--pause');
      playIcon.classList.remove('play-icon--play', 'play-icon--loading');
    } else {
      playIcon.classList.add('play-icon--play');
      playIcon.classList.remove('play-icon--pause', 'play-icon--loading');
    }
  }

  /**
   * Hide play button if track not found
   * @param {HTMLElement} button - The play button element
   */
  function hidePlayButton(button) {
    button.classList.add('is-hidden');
    console.log('Deezer: Play button hidden (track not found)');
  }

  /**
   * Handle play button click
   * @param {Event} event - Click event
   */
  async function handlePlayButtonClick(event) {
    const button = event.currentTarget;
    const artist = button.dataset.artist;
    const track = button.dataset.track;

    if (!artist || !track) {
      console.error('Deezer: Missing artist or track data');
      return;
    }

    // Check if currently playing this track - if so, pause
    const trackItem = button.closest('.track-item');
    if (trackItem && trackItem.classList.contains('is-playing')) {
      stopTrack();
      return;
    }

    // Show loading state
    setPlayButtonLoading(button, true);

    try {
      // Search for track on Deezer
      const trackData = await searchDeezerTrack(artist, track);

      // Hide loading state
      setPlayButtonLoading(button, false);

      if (trackData && trackData.preview) {
        // Play track
        playTrack(trackData, button);
      } else {
        // Track not found, hide button
        hidePlayButton(button);
      }
    } catch (error) {
      console.error('Deezer: Error handling play button click:', error);
      setPlayButtonLoading(button, false);
      alert('Unable to load track preview. Please try again.');
    }
  }

  /**
   * Handle track ended event
   */
  function handleTrackEnded() {
    console.log('Deezer: Track ended');
    if (currentTrackElement) {
      currentTrackElement.classList.remove('is-playing');
      const button = currentTrackElement.querySelector('.play-button');
      if (button) {
        setPlayButtonState(button, false);
      }
      currentTrackElement = null;
    }
  }

  /**
   * Handle track error event
   * @param {Event} event - Error event
   */
  function handleTrackError(event) {
    console.error('Deezer: Audio error:', event);
    if (currentTrackElement) {
      const button = currentTrackElement.querySelector('.play-button');
      if (button) {
        setPlayButtonState(button, false);
      }
    }
    alert('Track playback error. The preview may no longer be available.');
  }

  /**
   * Initialize Deezer player
   */
  function init() {
    const playButtons = document.querySelectorAll('.play-button');
    console.log(`Deezer: Initializing player with ${playButtons.length} buttons`);

    playButtons.forEach(button => {
      button.addEventListener('click', handlePlayButtonClick);
    });
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for testing/debugging
  if (typeof window !== 'undefined') {
    window.DeezerPlayer = {
      init: init,
      searchTrack: searchDeezerTrack,
      stop: stopTrack
    };
  }
})();
