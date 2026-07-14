import PortalApp, { type PortalRoute } from '../../src/next/PortalApp';
import PortalHydrationGate from '../../src/next/PortalHydrationGate';
import PortalProviders from '../../src/next/PortalProviders';

const PORTAL_ROUTES: ReadonlySet<string> = new Set<PortalRoute>([
  '/',
  '/login',
  '/integrated',
  '/submit',
  '/form',
  '/dept',
  '/toeic',
  '/volunteer',
  '/stats',
  '/settings',
]);

function portalRoute(path: string): PortalRoute | null {
  return PORTAL_ROUTES.has(path) ? (path as PortalRoute) : null;
}

type PortalPageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function PortalPage({ params }: PortalPageProps) {
  const { slug } = await params;
  const route = portalRoute(slug?.length ? `/${slug.join('/')}` : '/');

  // Leave unrelated paths provider-free so workflow/API routes remain isolated.
  if (!route) return null;

  return (
    <PortalProviders>
      <PortalHydrationGate>
        <PortalApp route={route} />
      </PortalHydrationGate>
    </PortalProviders>
  );
}
