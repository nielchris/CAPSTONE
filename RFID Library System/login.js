/* =========================================================================
   login.js — sign-in form behaviour (front-end demo; wire to a real auth
   endpoint in production and never check credentials client-side)
   ========================================================================= */
(function(){
  var form = document.getElementById('loginForm');
  var pwInput = document.getElementById('loginPass');
  var pwToggle = document.getElementById('pwToggle');
  var errorMsg = document.getElementById('loginError');

  if(pwToggle){
    pwToggle.addEventListener('click', function(){
      var showing = pwInput.type === 'text';
      pwInput.type = showing ? 'password' : 'text';
      pwToggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  }

  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var user = document.getElementById('loginUser').value.trim();
      var pass = pwInput.value.trim();
      if(!user || !pass){
        errorMsg.hidden = false;
        return;
      }
      errorMsg.hidden = true;
      // In production: POST to a real auth endpoint and only create the
      // session / redirect after a successful server response — never
      // trust a client-side check alone (see auth-guard.js for why).
      try {
        localStorage.setItem('uepStaffSession', JSON.stringify({ user: user, since: Date.now() }));
      } catch (e) { /* storage unavailable — session simply won't persist */ }
      window.location.href = 'dashboard.html';
    });
  }
})();
