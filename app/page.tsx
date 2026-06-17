import { redirect } from 'next/navigation';

/**
 * Starship Protocol is the public site now. The root path sends every visitor
 * to the /siteMARS landing. The legacy MetaMap terminal that used to live here
 * is hidden — see redirects() in next.config.mjs.
 */
export default function RootPage() {
  redirect('/siteMARS');
}
