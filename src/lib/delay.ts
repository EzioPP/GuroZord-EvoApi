export function generateDelay(minSec: number, maxSec: number): number {
  if (minSec > maxSec) {
    throw new Error('minSec must be less than or equal to maxSec');
  }
  const ms = Math.floor((Math.random() * (maxSec - minSec + 1) + minSec) * 1000);
  return ms;
}
