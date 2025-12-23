export function mapTodo(dbTodo) {
  return {
    id: dbTodo.clientId, // UI expects `id`
    task: dbTodo.task, // UI expects `task`
    completed: dbTodo.completed === 1, // SQLite stores booleans as 0/1
    synced: dbTodo.syncStatus === "synced",
  };
}
