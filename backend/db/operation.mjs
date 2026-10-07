// Named domain operations use native MongoDB queries. The callback is used only
// by the legacy SQL providers, so production never parses or executes SQL.
export function operation(db, name, legacy) {
  return db.operation ? db.operation(name) : legacy();
}
