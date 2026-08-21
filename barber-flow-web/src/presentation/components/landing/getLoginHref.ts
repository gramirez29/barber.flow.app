// The landing lives on the same SPA/build as the app (see PRODUCTION_IMPLEMENTATION.md), but in
// production it's served from a different subdomain (www) than the app itself (app). A client-side
// route change to "/login" would keep the user on www — which the API's CORS policy doesn't need
// to (and, until this was found live, didn't) allow — so production sends the login CTA through a
// real cross-domain navigation to app.haircutsflowcr.com instead. Staging/local only ever have one
// domain for everything, so they keep the normal in-app route.
const PRODUCTION_LANDING_HOSTNAME = 'www.haircutsflowcr.com';
const PRODUCTION_APP_HOSTNAME = 'app.haircutsflowcr.com';

export function getLoginHref(): string {
  if (window.location.hostname === PRODUCTION_LANDING_HOSTNAME) {
    return `https://${PRODUCTION_APP_HOSTNAME}/login`;
  }
  return '/login';
}
