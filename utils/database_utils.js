// database_utils.js
// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const AppDAO = require('./dao')
const GenreRepository = require('./genre_repository')

// Get connection string from environment
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://localhost:5432/music_genre_ator_dev'

function addGenre(genre, slug) {
  const dao = new AppDAO(DATABASE_URL)
  const genreRepo = new GenreRepository(dao)

  return genreRepo.create(genre, slug)
}

function getGenre(slug) {
  const dao = new AppDAO(DATABASE_URL)
  const genreRepo = new GenreRepository(dao)

  return genreRepo.getBySlug(slug)
}

module.exports = {
  addGenre,
  getGenre
}
