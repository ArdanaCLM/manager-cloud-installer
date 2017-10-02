export function alphabetically(a,b) {
  const x = a.toUpperCase();
  const y = b.toUpperCase();
  return ((x < y) ? -1 : (x > y) ? 1 : 0);
}
