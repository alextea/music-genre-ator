#!/usr/bin/env node

/**
 * Command-line test script for Last.fm music integration
 *
 * Usage:
 *   node test-music.js "ambient techno"
 *   node test-music.js "jazz"
 *   node test-music.js "cosmic death polka"
 */

const { generateMusicData } = require('./utils/music');

// Get genre from command line args
const genre = process.argv[2] || 'electronic';

console.log('='.repeat(60));
console.log(`Testing Last.fm integration for genre: "${genre}"`);
console.log('='.repeat(60));
console.log();

// Test the music data generation
generateMusicData(genre)
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
