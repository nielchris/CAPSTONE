/* =========================================================================
   auth-guard.js — session gate for staff-only pages
   ---------------------------------------------------------------------
   Include this in the <head> (before any other script) of every page
   that should be off-limits without a staff sign-in — dashboard,
   statistics, reports, users, feedback. Do NOT include it on:
     - login.html   (the sign-in page itself)
     - attendance.html (the public RFID kiosk — students should never
       need a staff login just to tap in/out)

   If no session is found, this redirects to login.html immediately,
   before the rest of the page has a chance to render.

   IMPORTANT — READ BEFORE RELYING ON THIS IN PRODUCTION:
   This is a front-end-only convenience gate. It stops someone from
   casually typing a staff URL and landing on real content, but it is
   NOT real security — there is no server here to enforce anything.
   Anyone who disables JavaScript, edits localStorage in devtools, or
   calls the page's data functions directly can bypass this check.
   A production deployment MUST also enforce auth server-side (a real
   login endpoint issuing a session cookie/token, checked on every
   request/API call) — client-side checks can only ever gate the UI,
   never protect the underlying data.
   ========================================================================= */
(function () {
  var SESSION_KEY = 'uepStaffSession';
  var hasSession = false;

  try {
    hasSession = !!localStorage.getItem(SESSION_KEY);
  } catch (e) {
    // Storage blocked (e.g. file:// in some browsers) — treat as logged out
    hasSession = false;
  }

  if (!hasSession) {
    window.location.replace('login.html');
  }
})();
