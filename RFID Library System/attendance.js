/* =========================================================================
   attendance.js — standalone RFID attendance (no external ILS/Koha lookup)
   ==========================================================================
   HOW A REAL READER PLUGS IN
   ---------------------------------------------------------------------
   Most classroom-budget RFID/ID readers (e.g. RC522 + USB-HID bridge, or a
   ready-made USB RFID pad) act like a keyboard: tapping a card "types" the
   card's number into whatever text field currently has focus, then sends
   Enter. That is exactly what #rfidHiddenInput below is for — it stays
   focused at all times, silently collects those keystrokes, and on Enter
   hands the finished card number to handleCardScan(). No mouse click or
   on-screen button is needed: plug in the reader, keep this page open,
   and every tap fires handleCardScan() on its own.

   LOCAL CARD DATABASE (this is what makes it "standalone")
   ---------------------------------------------------------------------
   This system keeps its own visitor database — there is no Koha or other
   external ILS lookup involved. CARD_DB below stands in for that local
   database. The first time an unknown card number is tapped, the reader
   asks staff/the visitor to fill in name, type, college/department, etc.
   ONCE. That record is saved into CARD_DB (in production: a real local
   database/table, e.g. SQLite/MySQL keyed by card number) so every later
   tap for that same card is instantly recognized — no re-encoding.
   ========================================================================= */
(function(){

  // ---- "Local database" of already-registered cards. Replace/extend this
  // with your real registered cards (or load it from local storage/a real
  // database once persistence is wired up). ----
  var CARD_DB = {
    '2023-04471': { name:'Marielle D. Santos', type:'Student', college:'College of Science', course:'BS Information Technology', year:'3rd Year', gender:'Female' },
    'FAC-0087':   { name:'Renante P. Villaflor', type:'Faculty', college:'College of Education', course:'—', year:'—', gender:'Male' },
    '2022-01123': { name:'Anna Liza Marasigan', type:'Student', college:'College of Engineering', course:'BS Civil Engineering', year:'2nd Year', gender:'Female' },
    '2021-00982': { name:'John Kevin Obenza', type:'Student', college:'College of Business Administration', course:'BS Accountancy', year:'4th Year', gender:'Male' }
  };

  // ---- Running state: who is inside right now, and today's full log ----
  // visit = { id, name, type, college, course, year, gender, purpose, timeIn, timeOut, timeInDisplay, timeOutDisplay }
  var insideNow = {};      // keyed by card id -> visit object (timeOut still null)
  var visitLog = [];       // newest first, every completed + ongoing visit today
  var pendingCardId = null;
  var pendingStageTimer = null;

  // ---- DOM refs ----
  var hiddenInput = document.getElementById('rfidHiddenInput');
  var stage = document.getElementById('scanStage');
  var rings = document.getElementById('scanRings');
  var resultPanel = document.getElementById('scanResult');
  var newVisitorPanel = document.getElementById('newVisitorResult');
  var cancelBtn = document.getElementById('cancelTapBtn');
  var confirmBtn = document.getElementById('confirmTapBtn');
  var cancelNewBtn = document.getElementById('cancelNewVisitorBtn');
  var newVisitorForm = document.getElementById('newVisitorForm');
  var tableBody = document.getElementById('logTableBody');
  var insideList = document.getElementById('insideList');
  var insideCount = document.getElementById('insideCount');
  var insideEmptyNote = document.getElementById('insideEmptyNote');
  var manualFormEl = document.getElementById('manualForm');
  var feedbackStep = document.getElementById('feedbackStep');
  var feedbackThanks = document.getElementById('feedbackThanks');
  var feedbackSkipBtn = document.getElementById('feedbackSkipBtn');
  var rateOpts = document.querySelectorAll('#feedbackStep .rate-opt');

  // ---- Safe storage helpers — some browsers block localStorage (e.g. a
  // page opened straight from a file:// path), so every call is guarded. ----
  var FEEDBACK_KEY = 'uepLibraryFeedbackLog';
  function loadFeedbackLog(){
    try {
      var raw = localStorage.getItem(FEEDBACK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
  }
  function saveFeedbackEntry(entry){
    try {
      var log = loadFeedbackLog();
      log.unshift(entry);
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(log));
    } catch(e){ /* storage unavailable — feedback simply won't persist */ }
  }

  function initials(name){
    return name.split(' ').filter(Boolean).slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase();
  }
  function badgeClass(type){
    if(type === 'Faculty' || type === 'Staff') return 'faculty';
    if(type === 'Outsider') return 'outsider';
    return 'student';
  }
  function nowDisplay(){
    return new Date().toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });
  }

  // =========================================================================
  // 1. REAL READER INPUT CAPTURE (keyboard-wedge)
  // =========================================================================
  function keepReaderFocused(){
    var active = document.activeElement;
    var insideManualForm = manualFormEl && manualFormEl.contains(active);
    var insideNewVisitorForm = newVisitorForm && newVisitorForm.contains(active);
    if(active !== hiddenInput && !insideManualForm && !insideNewVisitorForm){
      hiddenInput.focus();
    }
  }
  if(hiddenInput){
    hiddenInput.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){
        var scanned = hiddenInput.value.trim();
        hiddenInput.value = '';
        if(scanned) handleCardScan(scanned);
      }
    });
    // Re-focus the hidden field whenever the page is clicked elsewhere,
    // so a real reader can "type" into it at any moment.
    document.addEventListener('click', keepReaderFocused);
    keepReaderFocused();
  }

  // =========================================================================
  // 2. CORE SCAN HANDLER — looks up the card in the local database
  // =========================================================================
  function handleCardScan(cardId){
    if(pendingStageTimer){ clearTimeout(pendingStageTimer); pendingStageTimer = null; }
    pendingCardId = cardId;
    var record = CARD_DB[cardId];

    if(record){
      showRecognized(cardId, record);
    } else {
      showNewVisitorForm(cardId);
    }
  }

  function showRecognized(cardId, record){
    stage.style.display = 'none';
    newVisitorPanel.hidden = true;
    feedbackStep.hidden = true;
    feedbackThanks.hidden = true;
    resultPanel.hidden = false;

    document.getElementById('resultAvatar').textContent = initials(record.name);
    document.getElementById('resultName').textContent = record.name;
    document.getElementById('resultId').textContent = cardId;
    document.getElementById('resultCollege').textContent = record.college;
    document.getElementById('resultCourse').textContent = record.course;
    document.getElementById('resultYear').textContent = record.year;
    document.getElementById('resultGender').textContent = record.gender;
    var typeBadge = document.getElementById('resultType');
    typeBadge.textContent = record.type;
    typeBadge.className = 'badge ' + badgeClass(record.type);

    var isInside = !!insideNow[cardId];
    document.getElementById('resultCurrentStatus').textContent = isInside ? 'Inside the library' : 'Outside the library';
    document.getElementById('purposeField').style.display = isInside ? 'none' : 'block';
    confirmBtn.textContent = isInside ? 'Confirm Time Out' : 'Confirm Time In';
    confirmBtn.className = isInside ? 'btn btn-outline btn-block' : 'btn btn-primary btn-block';
  }

  function showNewVisitorForm(cardId){
    stage.style.display = 'none';
    resultPanel.hidden = true;
    feedbackStep.hidden = true;
    feedbackThanks.hidden = true;
    newVisitorPanel.hidden = false;
    document.getElementById('newVisitorIdInline').textContent = cardId;
    newVisitorForm.reset();
    toggleCollegeRow();
  }

  function resetStage(){
    pendingStageTimer = null;
    stage.style.display = 'flex';
    resultPanel.hidden = true;
    newVisitorPanel.hidden = true;
    feedbackStep.hidden = true;
    feedbackThanks.hidden = true;
    rings.classList.remove('success');
    pendingCardId = null;
    keepReaderFocused();
  }

  // =========================================================================
  // 3. CONFIRM TIME IN / TIME OUT for a recognized card
  // =========================================================================
  if(confirmBtn){
    confirmBtn.addEventListener('click', function(){
      if(!pendingCardId) return;
      var record = CARD_DB[pendingCardId];
      var isInside = !!insideNow[pendingCardId];
      var cardId = pendingCardId;

      if(isInside){
        timeOutVisitor(cardId);
        rings.classList.add('success');
        // The same tap that timed the student out also opens the quick
        // 3-option feedback prompt — no separate reader/station needed.
        pendingStageTimer = setTimeout(function(){ showFeedbackStep(cardId, record); }, 500);
      } else {
        var purpose = document.getElementById('purposeSelect').value;
        timeInVisitor(cardId, record, purpose);
        rings.classList.add('success');
        pendingStageTimer = setTimeout(resetStage, 500);
      }
    });
  }
  if(cancelBtn){ cancelBtn.addEventListener('click', resetStage); }
  if(cancelNewBtn){ cancelNewBtn.addEventListener('click', resetStage); }

  // =========================================================================
  // 3b. POST-TIME-OUT FEEDBACK (Very Bad / Bad / Not So Bad)
  // =========================================================================
  function showFeedbackStep(cardId, record){
    resultPanel.hidden = true;
    newVisitorPanel.hidden = true;
    feedbackThanks.hidden = true;
    rings.classList.remove('success');
    stage.style.display = 'none';

    document.getElementById('fbAvatar').textContent = initials(record.name);
    document.getElementById('fbName').textContent = record.name;
    document.getElementById('fbId').textContent = cardId;
    rateOpts.forEach(function(o){ o.classList.remove('selected'); });
    feedbackStep.hidden = false;
  }

  function submitFeedback(cardId, record, rate, label){
    saveFeedbackEntry({
      id: cardId,
      name: record.name,
      type: record.type,
      rate: rate,
      label: label,
      time: Date.now(),
      timeDisplay: nowDisplay()
    });
    feedbackStep.hidden = true;
    feedbackThanks.hidden = false;
    pendingStageTimer = setTimeout(resetStage, 1600);
  }

  rateOpts.forEach(function(opt){
    opt.addEventListener('click', function(){
      if(!pendingCardId) return;
      var record = CARD_DB[pendingCardId];
      rateOpts.forEach(function(o){ o.classList.remove('selected'); });
      opt.classList.add('selected');
      var rate = parseInt(opt.getAttribute('data-rate'), 10);
      var label = opt.getAttribute('data-label');
      submitFeedback(pendingCardId, record, rate, label);
    });
  });

  if(feedbackSkipBtn){
    feedbackSkipBtn.addEventListener('click', resetStage);
  }

  // =========================================================================
  // 4. FIRST-TAP AUTO-REGISTRATION for an unknown card
  // =========================================================================
  var nvType = document.getElementById('nvType');
  function toggleCollegeRow(){
    var isOutsider = nvType.value === 'Outsider';
    document.getElementById('nvCollegeRow').style.display = isOutsider ? 'none' : 'grid';
  }
  if(nvType){ nvType.addEventListener('change', toggleCollegeRow); }

  if(newVisitorForm){
    newVisitorForm.addEventListener('submit', function(e){
      e.preventDefault();
      if(!pendingCardId) return;
      var isOutsider = nvType.value === 'Outsider';
      var record = {
        name: document.getElementById('nvName').value.trim() || 'Unnamed Visitor',
        type: nvType.value,
        college: isOutsider ? '—' : document.getElementById('nvCollege').value,
        course: isOutsider ? '—' : (document.getElementById('nvCourse').value.trim() || '—'),
        year: isOutsider ? '—' : '—',
        gender: document.getElementById('nvGender').value
      };
      // Save into the local card database — this card is now "registered"
      // and will be instantly recognized on every future tap.
      CARD_DB[pendingCardId] = record;

      var purpose = document.getElementById('nvPurpose').value;
      timeInVisitor(pendingCardId, record, purpose);
      rings.classList.add('success');
      pendingStageTimer = setTimeout(resetStage, 500);
    });
  }

  // =========================================================================
  // 5. TIME IN / TIME OUT + rendering
  // =========================================================================
  function timeInVisitor(cardId, record, purpose){
    var visit = {
      id: cardId,
      name: record.name,
      type: record.type,
      college: record.college,
      course: record.course,
      year: record.year,
      gender: record.gender,
      purpose: purpose,
      timeIn: Date.now(),
      timeOut: null,
      timeInDisplay: nowDisplay(),
      timeOutDisplay: null
    };
    insideNow[cardId] = visit;
    visitLog.unshift(visit);
    renderAll();
  }

  function timeOutVisitor(cardId){
    var visit = insideNow[cardId];
    if(!visit) return;
    visit.timeOut = Date.now();
    visit.timeOutDisplay = nowDisplay();
    delete insideNow[cardId];
    renderAll();
  }

  // Manual "time out" override button inside the Currently Inside list
  function manualTimeOut(cardId){
    timeOutVisitor(cardId);
  }

  function formatDuration(ms){
    var mins = Math.max(0, Math.round(ms / 60000));
    if(mins < 60) return mins + ' min';
    var h = Math.floor(mins / 60), m = mins % 60;
    return h + 'h ' + m + 'm';
  }

  function renderInsideList(){
    var ids = Object.keys(insideNow);
    insideCount.textContent = ids.length + ' inside';
    insideEmptyNote.style.display = ids.length ? 'none' : 'block';
    insideList.innerHTML = ids.map(function(id){
      var v = insideNow[id];
      return '<li>' +
        '<div class="il-avatar">' + initials(v.name) + '</div>' +
        '<div class="il-info">' +
          '<div class="il-name">' + v.name + '</div>' +
          '<div class="il-meta cell-mono">' + id + ' &middot; ' + v.college + '</div>' +
        '</div>' +
        '<div class="il-time">' +
          '<div class="il-timein cell-mono">In ' + v.timeInDisplay + '</div>' +
          '<div class="il-duration">' + formatDuration(Date.now() - v.timeIn) + '</div>' +
        '</div>' +
        '<button class="il-out-btn" type="button" data-id="' + id + '" title="Manually time out">Time out</button>' +
      '</li>';
    }).join('');

    insideList.querySelectorAll('.il-out-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        manualTimeOut(btn.getAttribute('data-id'));
      });
    });
  }

  function renderLogTable(){
    tableBody.innerHTML = visitLog.map(function(v){
      var status = v.timeOut ? '<span class="badge success">Left</span>' : '<span class="badge inside-now">Inside</span>';
      return '<tr data-type="' + v.type + '">' +
        '<td class="cell-mono">' + v.timeInDisplay + '</td>' +
        '<td class="cell-mono">' + (v.timeOutDisplay || '—') + '</td>' +
        '<td class="cell-name">' + v.name + '</td>' +
        '<td class="cell-mono">' + v.id + '</td>' +
        '<td>' + v.college + '</td>' +
        '<td><span class="badge ' + badgeClass(v.type) + '">' + v.type + '</span></td>' +
        '<td>' + status + '</td>' +
      '</tr>';
    }).join('');
    applyActiveFilter();
  }

  function renderAll(){
    renderInsideList();
    renderLogTable();
  }

  // live-update the "inside" durations every 30s without a full re-render burst
  setInterval(function(){
    if(Object.keys(insideNow).length) renderInsideList();
  }, 30000);

  // ---- Manual entry (librarian override, no card needed) ----
  var manualToggle = document.getElementById('manualToggle');
  if(manualToggle){
    manualToggle.addEventListener('click', function(){
      var open = manualFormEl.hidden;
      manualFormEl.hidden = !open;
      manualToggle.classList.toggle('open', open);
    });
  }
  if(manualFormEl){
    manualFormEl.addEventListener('submit', function(e){
      e.preventDefault();
      var name = document.getElementById('mName').value.trim();
      var id = document.getElementById('mId').value.trim();
      if(!name || !id) return;
      var record = {
        name: name,
        type: document.getElementById('mType').value,
        college: document.getElementById('mCollege').value,
        course: document.getElementById('mCourse').value.trim() || '—',
        year: '—',
        gender: document.getElementById('mGender').value
      };
      CARD_DB[id] = record; // remember it too, in case they also carry a card later
      timeInVisitor(id, record, document.getElementById('mPurpose').value);
      manualFormEl.reset();
    });
  }

  // ---- Table filters ----
  var filterBtns = document.querySelectorAll('.chip-filter');
  var activeFilter = 'all';
  function applyActiveFilter(){
    var rows = tableBody.querySelectorAll('tr');
    rows.forEach(function(row){
      var show = activeFilter === 'all' || row.getAttribute('data-type') === activeFilter;
      row.style.display = show ? '' : 'none';
    });
  }
  filterBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      filterBtns.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      applyActiveFilter();
    });
  });

  // ---- Nothing to seed: the log starts empty and fills up from real taps
  // (or manual entries) as they happen. ----
  renderAll();

})();
