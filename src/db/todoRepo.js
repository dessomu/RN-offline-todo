import { getDB } from "./database";
import { generateUUID } from "../utils/uuid";

//  READ

export async function getTodos(callback) {
  try {
    const db = getDB();

    const rows = await db.getAllAsync(
      `SELECT * FROM todos 
       WHERE deleted = 0 
       ORDER BY updatedAt DESC`
    );

    callback(rows);
  } catch (err) {
    console.error("❌ getTodos error:", err);
  }
}

//  CREATE

export async function addTodo(task) {
  const db = getDB();
  const clientId = generateUUID();
  const now = Date.now();

  try {
    await db.runAsync(
      `INSERT INTO todos 
        (clientId, task, completed, deleted, updatedAt, syncStatus)
       VALUES (?, ?, 0, 0, ?, 'pending')`,
      [clientId, task, now]
    );

    await db.runAsync(
      `INSERT INTO sync_queue 
        (clientId, operation, payload, createdAt)
       VALUES (?, 'create', ?, ?)`,
      [
        clientId,
        JSON.stringify({
          task,
          completed: false,
          deleted: false,
        }),
        now,
      ]
    );
  } catch (err) {
    console.error("❌ addTodo error:", err);
  }
}

// UPDATE

export async function toggleTodo(clientId) {
  const db = getDB();
  const now = Date.now();

  try {
    await db.runAsync(
      `UPDATE todos 
       SET completed = CASE completed WHEN 1 THEN 0 ELSE 1 END,
           updatedAt = ?,
           syncStatus = 'pending'
       WHERE clientId = ?`,
      [now, clientId]
    );

    const [todo] = await db.getAllAsync(
      `SELECT completed FROM todos WHERE clientId = ?`,
      [clientId]
    );

    await db.runAsync(
      `INSERT INTO sync_queue 
        (clientId, operation, payload, createdAt)
       VALUES (?, 'update', ?, ?)`,
      [clientId, JSON.stringify({ completed: todo.completed === 1 }), now]
    );
  } catch (err) {
    console.error("❌ toggleTodo error:", err);
  }
}

//  DELETE (hard delete)

export async function deleteTodo(clientId) {
  const db = getDB();
  const now = Date.now();

  try {
    // 1️⃣ Remove any pending ops for this todo (create/update)
    await db.runAsync(`DELETE FROM sync_queue WHERE clientId = ?`, [clientId]);

    // 2️⃣ Remove locally (hard delete from SQLite)
    await db.runAsync(`DELETE FROM todos WHERE clientId = ?`, [clientId]);

    // 3️⃣ Queue FINAL delete operation for backend
    await db.runAsync(
      `INSERT INTO sync_queue 
        (clientId, operation, payload, createdAt)
       VALUES (?, 'delete', ?, ?)`,
      [clientId, JSON.stringify({ deleted: true }), now]
    );
  } catch (err) {
    console.error("❌ deleteTodo error:", err);
  }
}
