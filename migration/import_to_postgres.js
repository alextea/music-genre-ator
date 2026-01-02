// import_to_postgres.js
// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL

async function importData() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set!')
    console.error('Make sure you have a .env file with DATABASE_URL configured')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  })

  try {
    // Read exported data
    const exportPath = path.join(__dirname, 'genres_export.json')

    if (!fs.existsSync(exportPath)) {
      console.error(`Export file not found: ${exportPath}`)
      console.error('Please run the SQLite export command first.')
      process.exit(1)
    }

    const genres = JSON.parse(fs.readFileSync(exportPath, 'utf8'))

    console.log(`Importing ${genres.length} genres...`)

    let imported = 0
    let skipped = 0

    // Import in batches of 100
    for (let i = 0; i < genres.length; i += 100) {
      const batch = genres.slice(i, i + 100)

      for (const genre of batch) {
        try {
          await pool.query(
            'INSERT INTO genres (slug, genre) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING',
            [genre.slug, genre.genre]
          )
          imported++
        } catch (err) {
          console.error(`Failed to import genre ${genre.slug}:`, err.message)
          skipped++
        }
      }

      console.log(`Progress: ${Math.min(i + 100, genres.length)}/${genres.length}`)
    }

    console.log(`\nImport complete!`)
    console.log(`Imported: ${imported}`)
    console.log(`Skipped: ${skipped}`)

    // Verify count
    const result = await pool.query('SELECT COUNT(*) FROM genres')
    console.log(`\nTotal genres in database: ${result.rows[0].count}`)

  } catch (err) {
    console.error('Import failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

importData()
