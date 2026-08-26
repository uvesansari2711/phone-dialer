export function getParam(value: string | string[] | undefined, name: string): string {
  if (typeof value === 'string') return value;
  throw new Error(`Missing route parameter: ${name}`);
}
