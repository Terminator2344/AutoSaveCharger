export const db = {
  users: [] as any[],
  events: [] as any[],
  notifications: [] as any[],
  clicks: [] as any[],
};

export function insert(table: keyof typeof db, record: any) {
  db[table].push(record);
  return record;
}

export function findMany(table: keyof typeof db, filter: (item: any) => boolean) {
  return db[table].filter(filter);
}

export function findOne(table: keyof typeof db, filter: (item: any) => boolean) {
  return db[table].find(filter);
}

export function update(table: keyof typeof db, filter: (item: any) => boolean, updateFn: (item: any) => void) {
  const item = db[table].find(filter);
  if (item) updateFn(item);
  return item;
}

