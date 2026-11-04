/* =========================================================================
   feedback.js — Visitor Feedback dashboard
   ==========================================================================
   Feedback is no longer captured on this page. It's captured on the RFID
   Attendance kiosk: the same tap a student uses to time OUT also opens a
   quick 3-option rating (Very Bad / Bad / Not So Bad) right there — see
   attendance.js, section "3b. POST-TIME-OUT FEEDBACK". That keeps things to
   one physical reader and one tap, instead of a second feedback station.

   This page just reads what's come in and displays it: today's totals, the
   rating-distribution chart, and the recent-feedback list.

   SHARED STORAGE (this is what makes it "connected" without a backend)
   ---------------------------------------------------------------------
   attendance.js writes each submitted rating into localStorage under the
   key below. In production this should instead be a real database table
   written by the same backend that handles attendance, so feedback survives
   a browser reset and can be viewed from more than one device.
   ========================================================================= */
(function(){

  var FEEDBACK_KEY = 'uepLibraryFeedbackLog';

  // ---- Safe storage helpers — some browsers block localStorage (e.g. a
  // page opened straight from a file:// path). ----
  function loadFeedbackLog(){
    try {
      var raw = localStorage.getItem(FEEDBACK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
  }

  var list = document.getElementById('feedbackList');
  var emptyNote = document.getElementById('feedbackEmptyNote');
  var glanceTotal = document.getElementById('glanceTotal');
  var glanceVeryBad = document.getElementById('glanceVeryBad');
  var glanceBad = document.getElementById('glanceBad');
  var glanceNotSoBad = document.getElementById('glanceNotSoBad');

  var chart = null;

  function isToday(ms){
    var d = new Date(ms), now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  function emojiFor(rate){
    return { 1:'😞', 2:'🙁', 3:'😕' }[rate] || '💬';
  }

  function render(){
    var log = loadFeedbackLog().filter(function(e){ return isToday(e.time); });

    // ---- Tallies + glance stats ----
    var tallies = [0, 0, 0]; // [Very Bad, Bad, Not So Bad]
    log.forEach(function(e){
      if(e.rate >= 1 && e.rate <= 3) tallies[e.rate - 1] += 1;
    });
    glanceTotal.textContent = log.length;
    glanceVeryBad.textContent = tallies[0];
    glanceBad.textContent = tallies[1];
    glanceNotSoBad.textContent = tallies[2];

    // ---- Recent feedback list ----
    list.innerHTML = '';
    if(log.length === 0){
      emptyNote.style.display = 'block';
    } else {
      emptyNote.style.display = 'none';
      log.forEach(function(e){
        var li = document.createElement('li');
        li.innerHTML =
          '<div class="fl-top">' +
            '<span class="fl-name">' + e.name + '</span>' +
            '<span class="fl-rate rate-' + e.rate + '">' + emojiFor(e.rate) + ' ' + e.label + '</span>' +
          '</div>' +
          '<span class="fl-time cell-mono">' + (e.timeDisplay || '') + '</span>';
        list.appendChild(li);
      });
    }

    // ---- Chart ----
    if(chart){
      chart.data.datasets[0].data = tallies;
      chart.update();
    }
  }

  // =========================================================================
  // RATING DISTRIBUTION CHART
  // =========================================================================
  var el = document.getElementById('ratingChart');
  if(el && typeof Chart !== 'undefined'){
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#6B7A93';
    chart = new Chart(el, {
      type:'bar',
      data:{
        labels:['Very Bad','Bad','Not So Bad'],
        datasets:[{
          data:[0,0,0],
          backgroundColor:['#E0524B','#E0524B','#C98A1E'],
          borderRadius:6,
          maxBarThickness:34
        }]
      },
      options:{
        indexAxis:'y',
        maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{ x:{ grid:{ color:'#EAF0FA' }, beginAtZero:true, ticks:{ precision:0 } }, y:{ grid:{ display:false } } }
      }
    });
  }

  render();

  // Live-update if a tap comes in on the attendance kiosk in another tab.
  window.addEventListener('storage', function(e){
    if(e.key === FEEDBACK_KEY) render();
  });

})();
