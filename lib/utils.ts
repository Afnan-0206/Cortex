/**
 * lib/utils.ts
 *
 * Lightweight class-name merger for React Native usage.
 * Does NOT depend on clsx or tailwind-merge (web-only packages).
 * Keeps the same `cn()` API so any import sites still work.
 */

type ClassValue = string | undefined | null | false | 0 | ClassValue[];

function flattenClasses(inputs: ClassValue[]): string[] {
  const result: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string') {
      result.push(input);
    } else if (Array.isArray(input)) {
      result.push(...flattenClasses(input));
    }
  }
  return result;
}

export function cn(...inputs: ClassValue[]): string {
  return flattenClasses(inputs).join(' ');
}
