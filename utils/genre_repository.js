// genre_repository.js
class GenreRepository {
  constructor(dao) {
    this.dao = dao
  }

  createTable() {
    const sql = `
    CREATE TABLE IF NOT EXISTS genres (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE,
      genre TEXT)`
    return this.dao.run(sql)
  }

  create(genre,slug) {
    return this.dao.run(
      'INSERT INTO genres (genre, slug) VALUES ($1, $2) RETURNING id',
      [genre, slug])
  }

  getById(id) {
    return this.dao.get(
      `SELECT * FROM genres WHERE id = $1`,
      [id])
  }

  getBySlug(slug) {
    return this.dao.get(
      `SELECT * FROM genres WHERE slug = $1`,
      [slug])
  }
}

module.exports = GenreRepository;
