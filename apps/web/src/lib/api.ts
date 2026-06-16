import type { ApiResponse, HealthStatus } from '@signbridge/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Fetches API health. Runs server-side in the App Router by default. */
export async function getApiHealth(): Promise<ApiResponse<HealthStatus> | null> {
  try {
    const res = await fetch(`${API_URL}/api/health`, { cache: 'no-store' });
    return (await res.json()) as ApiResponse<HealthStatus>;
  } catch {
    // API unreachable (e.g. not started yet). The page renders a clear state.
    return null;
  }
}
