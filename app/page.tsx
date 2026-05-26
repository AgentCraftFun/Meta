import { redirect } from 'next/navigation';

/**
 * Root path is now the Terminal landing. The classic Earth+Moon
 * "Map" surface lives at /map; the in-canvas Earth ◯ Moon toggle
 * still navigates Earth↔Moon with the cinematic transition.
 */
export default function RootPage() {
  redirect('/terminal');
}
