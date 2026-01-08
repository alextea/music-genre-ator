#!/usr/bin/env node

/**
 * Command-line test script for Last.fm music integration
 *
 * Usage:
 *   node test-music.js
 *   node test-music.js http://localhost:3000
 */

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { generateMusicData } = require('./utils/music');

// Get webapp URL from command line args or environment
const port = process.env.PORT || 3000;
const webappUrl = process.argv[2] || `http://localhost:${port}`;

console.log('='.repeat(60));
console.log('Testing Last.fm music integration');
console.log('='.repeat(60));
console.log();
console.log(`Fetching genre from: ${webappUrl}`);
console.log();

// Fetch a genre from the webapp
fetch(webappUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to fetch from webapp: ${response.status}`);
    }
    return response.text();
  })
  .then(html => {
    // Extract genre from the HTML using a simple regex
    // The genre appears in: <div class="genre">genre name</div>
    const genreMatch = html.match(/<div[^>]*class="genre"[^>]*>([^<]+)<\/div>/);

    if (!genreMatch) {
      throw new Error('Could not extract genre from webapp HTML');
    }

    const genre = genreMatch[1].trim();

    console.log(`📝 Generated genre: "${genre}"`);
    console.log();
    // Test the music data generation
    return generateMusicData(genre);
  })
  .then(musicData => {
    console.log('RESULTS:');
    console.log('-'.repeat(60));
    console.log();

    if (musicData.hasResults) {
      console.log('✅ Found tracks on Last.fm!');
      console.log();
      console.log(`📊 Total tracks found: ${musicData.tracks.length}`);
      console.log();

      console.log('🎵 TOP TRACKS:');
      console.log();
      musicData.tracks.forEach((track, index) => {
        console.log(`  ${index + 1}. ${track.artist} - ${track.name}`);
        console.log(`     👥 ${track.listeners.toLocaleString()} listeners | 🔢 ${track.playcount.toLocaleString()} plays`);
        console.log(`     🔗 ${track.url}`);
        console.log();
      });

      console.log('🔗 MUSIC PLATFORM LINKS:');
      console.log();
      console.log('  Spotify (first track):');
      console.log(`  ${musicData.spotifyUrl}`);
      console.log();
      console.log('  Apple Music (first track):');
      console.log(`  ${musicData.appleMusicUrl}`);
      console.log();
      console.log('  Spotify (genre search):');
      console.log(`  ${musicData.spotifyGenreUrl}`);
      console.log();
      console.log('  Apple Music (genre search):');
      console.log(`  ${musicData.appleMusicGenreUrl}`);
      console.log();
    } else {
      console.log('⚠️  No tracks found on Last.fm for this genre');
      console.log();
      console.log('📝 Falling back to generic search links:');
      console.log();
      console.log('  Spotify search:');
      console.log(`  ${musicData.spotifyUrl}`);
      console.log();
      console.log('  Apple Music search:');
      console.log(`  ${musicData.appleMusicUrl}`);
      console.log();
    }

    console.log('='.repeat(60));
    console.log('✨ Test complete!');
    console.log('='.repeat(60));
  })
  .catch(error => {
    console.error();
    console.error('❌ ERROR:');
    console.error(error);
    console.error();
    process.exit(1);
  });
