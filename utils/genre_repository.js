// genre_repository.js
class GenreRepository {
  constructor(dao) {
    this.dao = dao
  }

  createTable() {
    const sql = `
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      genre TEXT)`
    return this.dao.run(sql)
  }

  create(genre,slug) {
    return this.dao.run(
      'INSERT INTO genres (genre, slug) VALUES (?, ?)',
      [genre, slug])
  }

  getById(id) {
    return this.dao.get(
      `SELECT * FROM genres WHERE id = ?`,
      [id])
  }

  getBySlug(slug) {
    return this.dao.get(
      `SELECT * FROM genres WHERE slug = ?`,
      [slug])
  }
}

module.exports = GenreRepository;
