/* =========================================================================
   reports.js — daily / weekly / monthly / yearly reporting view
   ========================================================================= */
(function(){

  var COLLEGES = ['College of Science','College of Education','College of Engineering','College of Business Administration','College of Arts and Communication','College of Agriculture and Forestry'];

  // Base per-college distribution (daily). Weekly/Monthly/Yearly scale this up.
  var BASE_ROWS = [
    { students:64, faculty:6, outsiders:3, female:41, male:32 },
    { students:52, faculty:7, outsiders:2, female:37, male:24 },
    { students:38, faculty:5, outsiders:4, female:24, male:23 },
    { students:24, faculty:6, outsiders:3, female:19, male:14 },
    { students:14, faculty:4, outsiders:3, female:12, male:9 },
    { students:6,  faculty:3, outsiders:3, female:5,  male:7 }
  ];

  var PERIODS = {
    daily:   { label:'Today · July 30, 2026',        multiplier:1,   trendLabels:['8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM'], trendData:[18,34,41,52,29,22,38,47,33,20], title:'Footfall — today', subtitle:'Today, July 30, 2026' },
    weekly:  { label:'Week of Jul 24 – Jul 30, 2026', multiplier:7,   trendLabels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], trendData:[221,248,265,289,257,204,200], title:'Footfall — this week', subtitle:'July 24 – July 30, 2026' },
    monthly: { label:'July 2026',                     multiplier:30,  trendLabels:['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5'], trendData:[1520,1610,1684,1489,980], title:'Footfall — this month', subtitle:'July 2026' },
    yearly:  { label:'A.Y. 2025 – 2026',               multiplier:300, trendLabels:['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'], trendData:[5210,6120,6480,5890,4310,5720,6205,6540,6980,4120], title:'Footfall — school year', subtitle:'Academic Year 2025 – 2026' }
  };

  // Individual visit records — this is the level of detail an export needs
  // (name, college/department, course & year), not just aggregate counts.
  var VISITOR_LOG = [
    { timeIn:'8:14 AM',  timeOut:'9:40 AM',  name:'Marielle D. Santos',   id:'2023-04471', college:'College of Science',                 course:'BSIT — 3rd Year',        type:'Student', gender:'Female', purpose:'Research / Study' },
    { timeIn:'8:22 AM',  timeOut:'—',         name:'Renante P. Villaflor', id:'FAC-0087',   college:'College of Education',               course:'—',                      type:'Faculty',  gender:'Male',   purpose:'Borrow materials' },
    { timeIn:'8:45 AM',  timeOut:'10:10 AM', name:'Anna Liza Marasigan',  id:'2022-01123', college:'College of Engineering',             course:'BS Civil Engr. — 2nd Year', type:'Student', gender:'Female', purpose:'Reading area' },
    { timeIn:'9:03 AM',  timeOut:'9:55 AM',  name:'John Kevin Obenza',    id:'2021-00982', college:'College of Business Administration', course:'BS Accountancy — 4th Year', type:'Student', gender:'Male',   purpose:'Use of computer / internet' },
    { timeIn:'9:18 AM',  timeOut:'—',         name:'Precious Jane Ubay',   id:'2024-05521', college:'College of Arts and Communication',  course:'AB Communication — 1st Year', type:'Student', gender:'Female', purpose:'Research / Study' },
    { timeIn:'9:30 AM',  timeOut:'11:02 AM', name:'Walk-in Visitor',      id:'GUEST-014',  college:'—',                                   course:'—',                      type:'Outsider', gender:'Male',   purpose:'Others' },
    { timeIn:'9:47 AM',  timeOut:'10:35 AM', name:'Mark Anthony Rosales', id:'2023-03390', college:'College of Agriculture and Forestry', course:'BS Agriculture — 2nd Year', type:'Student', gender:'Male',   purpose:'Return materials' },
    { timeIn:'10:02 AM', timeOut:'—',         name:'Jennalyn P. Torres',   id:'2022-02876', college:'College of Science',                 course:'BSIT — 2nd Year',        type:'Student', gender:'Female', purpose:'Reading area' },
    { timeIn:'10:15 AM', timeOut:'10:58 AM', name:'Ferdinand C. Bautista', id:'FAC-0102',   college:'College of Engineering',             course:'—',                      type:'Faculty',  gender:'Male',   purpose:'Borrow materials' },
    { timeIn:'10:31 AM', timeOut:'—',         name:'Rhea Mae Villanueva',  id:'2024-05877', college:'College of Education',               course:'BEEd — 1st Year',        type:'Student', gender:'Female', purpose:'Research / Study' },
    { timeIn:'10:42 AM', timeOut:'—',         name:'Marielle D. Santos',   id:'2023-04471', college:'College of Science',                 course:'BSIT — 3rd Year',        type:'Student', gender:'Female', purpose:'Return materials' },
    { timeIn:'10:55 AM', timeOut:'—',         name:'Christian Dave Reyes', id:'2021-01455', college:'College of Business Administration', course:'BSBA — 4th Year',        type:'Student', gender:'Male',   purpose:'Use of computer / internet' }
  ];

  function renderVisitorLog(){
    var tbody = document.getElementById('visitorLogTableBody');
    if(!tbody) return;
    tbody.innerHTML = VISITOR_LOG.map(function(v){
      var badgeCls = v.type === 'Faculty' ? 'faculty' : (v.type === 'Outsider' ? 'outsider' : 'student');
      return '<tr>' +
        '<td class="cell-mono">' + v.timeIn + '</td>' +
        '<td class="cell-mono">' + v.timeOut + '</td>' +
        '<td class="cell-name">' + v.name + '</td>' +
        '<td class="cell-mono">' + v.id + '</td>' +
        '<td>' + v.college + '</td>' +
        '<td>' + v.course + '</td>' +
        '<td><span class="badge ' + badgeCls + '">' + v.type + '</span></td>' +
        '<td>' + v.gender + '</td>' +
        '<td>' + v.purpose + '</td>' +
      '</tr>';
    }).join('');
  }

  var tabs = document.querySelectorAll('.period-tab');
  var chart = null;

  function sum(rows, key){ return rows.reduce(function(s,r){ return s + r[key]; }, 0); }

  function buildRows(mult){
    return BASE_ROWS.map(function(r){
      return {
        students: Math.round(r.students * mult),
        faculty: Math.round(r.faculty * mult),
        outsiders: Math.round(r.outsiders * mult),
        female: Math.round(r.female * mult),
        male: Math.round(r.male * mult)
      };
    });
  }

  function render(period){
    var cfg = PERIODS[period];
    var rows = buildRows(cfg.multiplier);
    var totalStudents = sum(rows,'students');
    var totalFaculty = sum(rows,'faculty');
    var totalOutsiders = sum(rows,'outsiders');
    var totalFemale = sum(rows,'female');
    var totalMale = sum(rows,'male');
    var total = totalStudents + totalFaculty + totalOutsiders;

    document.getElementById('reportRangeLabel').textContent = cfg.label;
    document.getElementById('trendTitle').textContent = cfg.title;
    document.getElementById('tableSubtitle').textContent = cfg.subtitle;

    document.getElementById('sumTotal').textContent = total.toLocaleString();
    document.getElementById('sumStudents').textContent = totalStudents.toLocaleString();
    document.getElementById('sumFaculty').textContent = totalFaculty.toLocaleString();
    document.getElementById('sumOutsiders').textContent = totalOutsiders.toLocaleString();

    document.getElementById('bdFemale').textContent = totalFemale.toLocaleString();
    document.getElementById('bdMale').textContent = totalMale.toLocaleString();
    document.getElementById('bdStudents').textContent = totalStudents.toLocaleString();
    document.getElementById('bdFaculty').textContent = totalFaculty.toLocaleString();
    document.getElementById('bdOutsiders').textContent = totalOutsiders.toLocaleString();

    var tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = rows.map(function(r, i){
      var rowTotal = r.students + r.faculty + r.outsiders;
      return '<tr>' +
        '<td class="cell-name">' + COLLEGES[i] + '</td>' +
        '<td>' + r.students.toLocaleString() + '</td>' +
        '<td>' + r.faculty.toLocaleString() + '</td>' +
        '<td>' + r.outsiders.toLocaleString() + '</td>' +
        '<td>' + r.female.toLocaleString() + '</td>' +
        '<td>' + r.male.toLocaleString() + '</td>' +
        '<td class="cell-mono">' + rowTotal.toLocaleString() + '</td>' +
      '</tr>';
    }).join('');

    var el = document.getElementById('periodChart');
    if(chart) chart.destroy();
    if(el && typeof Chart !== 'undefined'){
      chart = new Chart(el, {
        type:'bar',
        data:{
          labels:cfg.trendLabels,
          datasets:[{
            data:cfg.trendData,
            backgroundColor:'#1D5FC4',
            borderRadius:6,
            maxBarThickness:44
          }]
        },
        options:{
          maintainAspectRatio:false,
          plugins:{ legend:{ display:false } },
          scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:'#EAF0FA' }, beginAtZero:true } }
        }
      });
    }
  }

  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      tabs.forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      render(tab.getAttribute('data-period'));
      renderVisitorLog();
    });
  });

  var printBtn = document.getElementById('printReportBtn');
  if(printBtn){ printBtn.addEventListener('click', function(){ window.print(); }); }

  function csvEscape(value){
    if(/[",\n]/.test(value)) return '"' + value.replace(/"/g, '""') + '"';
    return value;
  }

  var exportBtn = document.getElementById('exportCsvBtn');
  if(exportBtn){
    exportBtn.addEventListener('click', function(){
      // Export individual visitor records — name, college/department, course
      // & year, time in/out — not just the aggregate totals.
      var rows = [['Time In','Time Out','Name','ID No.','College / Department','Course & Year','Type','Gender','Purpose']];
      VISITOR_LOG.forEach(function(v){
        rows.push([v.timeIn, v.timeOut, v.name, v.id, v.college, v.course, v.type, v.gender, v.purpose]);
      });
      var csv = rows.map(function(r){ return r.map(csvEscape).join(','); }).join('\n');
      var blob = new Blob([csv], { type:'text/csv' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      var activePeriod = document.querySelector('.period-tab.active');
      var periodName = activePeriod ? activePeriod.getAttribute('data-period') : 'daily';
      link.download = 'uep-library-visitor-log-' + periodName + '.csv';
      link.click();
    });
  }

  render('daily');
  renderVisitorLog();
})();
