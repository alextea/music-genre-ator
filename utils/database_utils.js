// database_utils.js
const AppDAO = require('./dao')
const GenreRepository = require('./genre_repository')

function addGenre(genre, slug) {
  const dao = new AppDAO('./data/database.sqlite3')
  const genreRepo = new GenreRepository(dao)

  genreRepo.create(genre, slug)
}

function getGenre(slug) {
  const dao = new AppDAO('./data/database.sqlite3')
  const genreRepo = new GenreRepository(dao)

  return genreRepo.getBySlug(slug)
}

module.exports = {
  addGenre,
  getGenre
}
