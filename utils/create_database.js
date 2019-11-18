// create_database.js
const AppDAO = require('./dao')
const GenreRepository = require('./genre_repository')

function createDatabase() {
  const dao = new AppDAO('./data/database.sqlite3')
  const genreRepo = new GenreRepository(dao)

  genreRepo.createTable()
    .catch((err) => {
      console.log('Error: ')
      console.log(JSON.stringify(err))
    })
}

createDatabase()
