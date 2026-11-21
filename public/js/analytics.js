// Google Analytics 4. Counts visits and a few actions (photo picked, GIF made,
// shared, saved). It never receives the visitor's photo or the GIF.
//
// Put the property's measurement ID here to turn it on. Empty = off.
const GA_ID = 'G-RYGPFQZELS';

// Only count the real site, not local development or previews.
const enabled = !!GA_ID && /(^|\.)woofmaker\.org$/.test(location.hostname);

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }   // gtag needs the real `arguments` object

if (enabled) {
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
  document.head.appendChild(s);
  gtag('js', new Date());
  // Plain usage stats only: no ad personalisation or cross-site ad signals.
  gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
}

// track('gif_created', { size_kb: 1100 })
export function track(name, params = {}) {
  if (enabled) gtag('event', name, params);
}
