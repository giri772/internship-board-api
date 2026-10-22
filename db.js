
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dataDirectory = path.join(__dirname, "data");
fs.mkdirSync(dataDirectory, { recursive: true });

const db = new Database(
  path.join(dataDirectory, "internships.db")
);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS internships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL
      CHECK (type IN ('Remote', 'Hybrid', 'On-site')),
    stipend INTEGER NOT NULL DEFAULT 0
      CHECK (stipend >= 0),
    description TEXT NOT NULL,
    applyUrl TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT
      (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updatedAt TEXT NOT NULL DEFAULT
      (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
`);

const count = db
  .prepare("SELECT COUNT(*) AS total FROM internships")
  .get().total;

if (count === 0) {
  const seedPath = path.join(__dirname, "seed.json");
  const records = JSON.parse(
    fs.readFileSync(seedPath, "utf8")
  );

  const insert = db.prepare(`
    INSERT INTO internships (
      title, company, location, type,
      stipend, description, applyUrl
    ) VALUES (
      @title, @company, @location, @type,
      @stipend, @description, @applyUrl
    )
  `);

  const seedTransaction = db.transaction((items) => {
    for (const item of items) {
      insert.run(item);
    }
  });

  seedTransaction(records);
  console.log(`Seeded ${records.length} internship records.`);
}

module.exports = db;
