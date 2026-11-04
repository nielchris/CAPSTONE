/* dashboard.js — renders the gender-split donut on the dashboard */
(function(){
  var el = document.getElementById('genderDonut');
  if(!el || typeof Chart === 'undefined') return;

  new Chart(el, {
    type:'doughnut',
    data:{
      labels:['Female','Male'],
      datasets:[{
        data:[138,109],
        backgroundColor:['#1D5FC4','#EFA93E'],
        borderWidth:0,
        hoverOffset:4
      }]
    },
    options:{
      cutout:'72%',
      plugins:{ legend:{ display:false }, tooltip:{ enabled:true } },
      maintainAspectRatio:false
    }
  });
})();
