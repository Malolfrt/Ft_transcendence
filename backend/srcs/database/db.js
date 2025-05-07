const Database = require("better-sqlite3");
require("dotenv").config();

try {
  const db = new Database("./database/ft_transcendence.db", { verbose: console.log });

  db.exec(`
      CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          anonymize INTEGER NOT NULL CHECK(anonymize IN (0, 1)) DEFAULT 0,
          avatar TEXT DEFAULT 'default.jpg',
          status TEXT CHECK( status IN ('online', 'offline', 'in-game') ) DEFAULT 'offline',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player1_id INTEGER NOT NULL,
          player2_id INTEGER NOT NULL,
          winner_id INTEGER NOT NULL,
          played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (player1_id) REFERENCES users(id),
          FOREIGN KEY (player2_id) REFERENCES users(id),
          FOREIGN KEY (winner_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS tournaments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          players TEXT NOT NULL,
          ranking TEXT
      );

      CREATE TABLE IF NOT EXISTS friends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          friend_id INTEGER NOT NULL,
          status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (friend_id) REFERENCES users(id),
          UNIQUE(user_id, friend_id)
      );
  `);

  const columnExists = db
  .prepare("PRAGMA table_info(users);")
  .all()
  .some(column => column.name === "anonymize");

  if (!columnExists)
    db.exec(`ALTER TABLE users ADD COLUMN anonymize INTEGER NOT NULL CHECK(anonymize IN (0, 1)) DEFAULT 0;`);

  const is2FAEnabledExists = db
  .prepare("PRAGMA table_info(users);")
  .all()
  .some(column => column.name === "is2FAEnabled");

  if (!is2FAEnabledExists)
    db.exec(`ALTER TABLE users ADD COLUMN is2FAEnabled INTEGER NOT NULL CHECK(is2FAEnabled IN (0, 1)) DEFAULT 0;`);

  const qrCodeUrl = db
  .prepare("PRAGMA table_info(users);")
  .all()
  .some(column => column.name === "qrCodeUrl");
  
  if (!qrCodeUrl)
    db.exec(`ALTER TABLE users ADD COLUMN qrCodeUrl TEXT;`);

  const twoFASecretExists = db
  .prepare("PRAGMA table_info(users);")
  .all()
  .some(column => column.name === "twoFASecret");

  if (!twoFASecretExists)
    db.exec(`ALTER TABLE users ADD COLUMN twoFASecret TEXT;`);

  const language = db
  .prepare("PRAGMA table_info(users);")
  .all()
  .some(column => column.name === "language");
  
  if (!language)
    db.exec(`ALTER TABLE users ADD COLUMN language TEXT;`);

  module.exports = db;
} catch (error) {
    process.exit(1);
}
