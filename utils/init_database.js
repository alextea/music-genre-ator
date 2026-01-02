// init_database.js
// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const AppDAO = require('./dao')
const GenreRepository = require('./genre_repository')

async function initDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set!')
    console.error('Make sure you have a .env file with DATABASE_URL configured')
    process.exit(1)
  }

  console.log('Initializing database schema...')

  const dao = new AppDAO(DATABASE_URL)
  const genreRepo = new GenreRepository(dao)

  try {
    await genreRepo.createTable()
    console.log('Database schema created successfully!')
    process.exit(0)
  } catch (err) {
    console.error('Failed to create schema:', err)
    process.exit(1)
  }
}

initDatabase()
