import { getDB } from "../db/database";

const API_URL = "http://192.168.1.3:3012/api/todos/sync";
// ⚠️ keep using your laptop IP for Expo Go

export async function syncTodos() {
  let db;

  try {
    db = getDB();
  } catch {
    // DB not ready yet (app just launched)
    return;
  }

  try {
    // 1️⃣ Read pending sync operations
    const queue = await db.getAllAsync(
      `SELECT * FROM sync_queue ORDER BY createdAt ASC`
    );

    if (queue.length === 0) return;

    // 2️⃣ Prepare payload for backend
    const todos = queue.map((q) => ({
      clientId: q.clientId,
      ...JSON.parse(q.payload),
      updatedAt: q.createdAt,
    }));

    // 3️⃣ Send bulk sync request
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todos }),
    });

    if (!res.ok) throw new Error("Sync failed");

    // 4️⃣ On success → clear queue & mark todos as synced
    await db.runAsync(`DELETE FROM sync_queue`);
    await db.runAsync(`UPDATE todos SET syncStatus = 'synced'`);

    console.log("✅ Sync successful");
  } catch (err) {
    // ⏳ Network down / server error → retry later
    console.log("⏳ Sync failed, will retry automatically");
  }
}
