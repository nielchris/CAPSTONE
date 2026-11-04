/* =========================================================================
   sidebar.js — shared behaviour for every page
   - collapse / expand the sidebar (desktop) and persist the choice
   - open / close the sidebar as a drawer on mobile
   - live clock in the topbar
   ========================================================================= */
(function(){
  var shell = document.querySelector('.app-shell');
  var toggleBtn = document.querySelector('[data-action="toggle-sidebar"]');
  var mobileBtn = document.querySelector('[data-action="open-mobile-nav"]');

  if(!shell) return;

  // Safe storage helpers — some browsers (notably Chrome) block localStorage
  // on file:// pages and throw, which would otherwise stop this whole script
  // (and silently break the toggle button below).
  function safeGet(key){
    try { return localStorage.getItem(key); } catch(e){ return null; }
  }
  function safeSet(key, value){
    try { localStorage.setItem(key, value); } catch(e){ /* ignore */ }
  }
  function safeRemove(key){
    try { localStorage.removeItem(key); } catch(e){ /* ignore */ }
  }

  // restore collapsed state
  if(safeGet('uep-sidebar-collapsed') === '1'){
    shell.classList.add('collapsed');
  }

  if(toggleBtn){
    toggleBtn.addEventListener('click', function(){
      shell.classList.toggle('collapsed');
      safeSet('uep-sidebar-collapsed', shell.classList.contains('collapsed') ? '1' : '0');
    });
  }

  var logoutLink = document.getElementById('logoutLink');
  if(logoutLink){
    logoutLink.addEventListener('click', function(e){
      if(!confirm('Sign out of the Visitor Management System?')){
        e.preventDefault();
        return;
      }
      safeRemove('uepStaffSession');
    });
  }

  if(mobileBtn){
    mobileBtn.addEventListener('click', function(){
      shell.classList.toggle('mobile-open');
    });
  }

  // close mobile drawer when a nav link is tapped
  document.querySelectorAll('.nav-item').forEach(function(el){
    el.addEventListener('click', function(){
      shell.classList.remove('mobile-open');
    });
  });

  // live clock
  var clockEl = document.querySelector('[data-role="live-clock"]');
  function tick(){
    if(!clockEl) return;
    var now = new Date();
    var opts = { weekday:'short', month:'short', day:'numeric' };
    var dateStr = now.toLocaleDateString('en-US', opts);
    var timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    clockEl.textContent = dateStr + '  \u2022  ' + timeStr;
  }
  tick();
  setInterval(tick, 1000);
})();
