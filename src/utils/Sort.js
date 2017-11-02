// (c) Copyright 2017 SUSE LLC
export function alphabetically(a,b) {
  const x = a.toUpperCase();
  const y = b.toUpperCase();
  return ((x < y) ? -1 : (x > y) ? 1 : 0);
}

export function byServerNameOrId(a,b) {
  return alphabetically(a['name'] || a['id'], b['name'] || b['id']);
}

