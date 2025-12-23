import * as SQLite from "expo-sqlite";

let db;

export async function initDB() {
  db = await SQLite.openDatabaseAsync("todos.db");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS todos (
      clientId TEXT PRIMARY KEY NOT NULL,
      task TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      updatedAt INTEGER NOT NULL,
      syncStatus TEXT DEFAULT 'pending'
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  console.log("✅ SQLite DB initialized");
}

export function getDB() {
  if (!db) {
    throw new Error("DB not initialized. Call initDB() first.");
  }
  return db;
}
