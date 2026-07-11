const DEFAULT_PORT = '8080';

export function resolveApiBaseUrl(): string {
  const host = process.env.EXPO_PUBLIC_API_HOST;
  const port = process.env.EXPO_PUBLIC_API_PORT ?? DEFAULT_PORT;

  if (!host) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_HOST. Copy .env.example to .env and set it for your platform ' +
        '(see TECH-PLAN.md §3.6).',
    );
  }

  return `http://${host}:${port}`;
}
