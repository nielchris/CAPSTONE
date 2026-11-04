/* statistics.js — renders all Chart.js visuals on the statistics page */
(function(){
  if(typeof Chart === 'undefined') return;

  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = '#6B7A93';

  // ---- Visitors by college / department ----
  var collegeEl = document.getElementById('collegeBar');
  if(collegeEl){
    new Chart(collegeEl, {
      type:'bar',
      data:{
        labels:['Science','Education','Engineering','Business Admin','Arts & Comm.','Agri & Forestry'],
        datasets:[{
          data:[412,356,298,264,201,153],
          backgroundColor:'#1D5FC4',
          borderRadius:6,
          maxBarThickness:38
        }]
      },
      options:{
        maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{
          x:{ grid:{ display:false } },
          y:{ grid:{ color:'#EAF0FA' }, beginAtZero:true }
        }
      }
    });
  }

  // ---- Visitor type donut ----
  var typeEl = document.getElementById('typeDonut');
  if(typeEl){
    new Chart(typeEl, {
      type:'doughnut',
      data:{
        labels:['Students','Faculty','Outsiders'],
        datasets:[{ data:[1349,211,124], backgroundColor:['#1D5FC4','#7A3FC9','#EFA93E'], borderWidth:0 }]
      },
      options:{ cutout:'70%', maintainAspectRatio:false, plugins:{ legend:{ display:false } } }
    });
  }

  // ---- Gender donut ----
  var genderEl = document.getElementById('genderDonut2');
  if(genderEl){
    new Chart(genderEl, {
      type:'doughnut',
      data:{
        labels:['Female','Male'],
        datasets:[{ data:[942,742], backgroundColor:['#1D5FC4','#EFA93E'], borderWidth:0 }]
      },
      options:{ cutout:'70%', maintainAspectRatio:false, plugins:{ legend:{ display:false } } }
    });
  }

  // ---- 7-day trend ----
  var trendEl = document.getElementById('trendLine');
  if(trendEl){
    new Chart(trendEl, {
      type:'line',
      data:{
        labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets:[{
          data:[221,248,265,289,257,204,200],
          borderColor:'#1D5FC4',
          backgroundColor:'rgba(29,95,196,.10)',
          fill:true,
          tension:.4,
          pointRadius:3,
          pointBackgroundColor:'#1D5FC4'
        }]
      },
      options:{
        maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:'#EAF0FA' }, beginAtZero:true } }
      }
    });
  }
})();
