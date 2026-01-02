// dao.js
const { Pool } = require('pg')

class AppDAO {
  constructor(connectionString) {
    // Use singleton pattern for pool - prevents creating multiple pools
    if (!AppDAO.pool) {
      AppDAO.pool = new Pool({
        connectionString: connectionString,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false  // Railway requires this for self-signed certs
        } : false
      })

      AppDAO.pool.on('error', (err) => {
        console.error('Unexpected pool error', err)
      })

      console.log('Connected to database')
    }
    this.pool = AppDAO.pool
  }

  async get(sql, params = []) {
    const client = await this.pool.connect()
    try {
      const result = await client.query(sql, params)
      return result.rows[0]  // Return first row or undefined
    } catch (err) {
      console.log('Error running sql: ' + sql)
      console.log(err)
      throw err
    } finally {
      client.release()  // CRITICAL: Release client back to pool
    }
  }

  async run(sql, params = []) {
    const client = await this.pool.connect()
    try {
      const result = await client.query(sql, params)
      return { id: result.rows[0]?.id }  // PostgreSQL returns RETURNING id
    } catch (err) {
      console.log('Error running sql ' + sql)
      console.log(err)
      throw err
    } finally {
      client.release()
    }
  }
}

// Singleton pool instance
AppDAO.pool = null

module.exports = AppDAO
