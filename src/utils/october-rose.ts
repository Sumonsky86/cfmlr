import { OCTOBER_ROSE } from '../data/october-rose.ts';
const start = Date.parse(OCTOBER_ROSE.startsAt);
const end = Date.parse(OCTOBER_ROSE.endsAt);

export function isOctoberRoseActive(date: Date = new Date()): boolean {
  const now = date.getTime();
  return now >= start && now < end;
}

export function nextOctoberRoseBoundary(date: Date): number | null {
  const now = date.getTime();
  if (now < start) return start;
  if (now < end) return end;
  return null;
}
