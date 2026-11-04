/* =========================================================================
   users.js — manage the staff accounts allowed to operate the system
   (front-end only demo; wire up to a real accounts table/API in production)
   ========================================================================= */
(function(){

  var USERS = [
    { id:1, name:'Celeste J. Chan, DIT', email:'cjchan@uep.edu.ph', role:'Administrator', status:'Active', lastLogin:'Today, 8:14 AM' },
    { id:2, name:'Niel (Capstone Researcher)', email:'niel@uep.edu.ph', role:'Librarian', status:'Active', lastLogin:'Today, 10:02 AM' },
    { id:3, name:'Lissa Mae B. Lagrimas', email:'lissamae@uep.edu.ph', role:'Librarian', status:'Active', lastLogin:'Yesterday, 3:40 PM' },
    { id:4, name:'Renante P. Villaflor', email:'rvillaflor@uep.edu.ph', role:'Library Assistant', status:'Active', lastLogin:'Jul 28, 9:15 AM' },
    { id:5, name:'Anna Liza Marasigan', email:'amarasigan@uep.edu.ph', role:'Library Assistant', status:'Active', lastLogin:'Jul 22, 1:05 PM' },
    { id:6, name:'John Kevin Obenza', email:'jobenza@uep.edu.ph', role:'Library Assistant', status:'Inactive', lastLogin:'Jun 30, 11:20 AM' }
  ];
  var nextId = 7;

  var tbody = document.getElementById('usersTableBody');
  var form = document.getElementById('userForm');
  var addBtn = document.getElementById('addUserBtn');
  var cancelBtn = document.getElementById('cancelUserFormBtn');

  function initials(name){
    return name.split(' ').filter(Boolean).slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase();
  }
  function rolePillClass(role){
    if(role === 'Administrator') return 'admin';
    if(role === 'Librarian') return 'librarian';
    return 'assistant';
  }

  function renderStats(){
    document.getElementById('uTotal').textContent = USERS.length;
    document.getElementById('uActive').textContent = USERS.filter(function(u){ return u.status === 'Active'; }).length;
    document.getElementById('uAdmins').textContent = USERS.filter(function(u){ return u.role === 'Administrator'; }).length;
    document.getElementById('uLibrarians').textContent = USERS.filter(function(u){ return u.role !== 'Administrator'; }).length;
  }

  function renderTable(){
    tbody.innerHTML = USERS.map(function(u){
      return '<tr data-id="' + u.id + '">' +
        '<td><div style="display:flex;align-items:center;gap:10px;">' +
          '<div class="il-avatar" style="width:30px;height:30px;font-size:11px;">' + initials(u.name) + '</div>' +
          '<span class="cell-name">' + u.name + '</span>' +
        '</div></td>' +
        '<td class="cell-mono">' + u.email + '</td>' +
        '<td><span class="role-pill ' + rolePillClass(u.role) + '">' + u.role + '</span></td>' +
        '<td><span class="status-pill ' + u.status.toLowerCase() + '"><span class="dot"></span>' + u.status + '</span></td>' +
        '<td class="cell-mono">' + u.lastLogin + '</td>' +
        '<td><div class="row-actions">' +
          '<button class="edit-btn" data-action="edit" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>' +
          '<button class="toggle-btn-row" data-action="toggle" title="Activate / deactivate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><path d="M12 2v10"/></svg></button>' +
          '<button class="delete-btn" data-action="delete" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('button[data-action]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = parseInt(btn.closest('tr').getAttribute('data-id'), 10);
        var action = btn.getAttribute('data-action');
        if(action === 'edit') openForm(id);
        if(action === 'toggle') toggleStatus(id);
        if(action === 'delete') deleteUser(id);
      });
    });
  }

  function toggleStatus(id){
    var u = USERS.find(function(x){ return x.id === id; });
    if(!u) return;
    u.status = (u.status === 'Active') ? 'Inactive' : 'Active';
    renderTable();
    renderStats();
  }

  function deleteUser(id){
    if(!confirm('Remove this user\'s access to the system?')) return;
    USERS = USERS.filter(function(x){ return x.id !== id; });
    renderTable();
    renderStats();
  }

  function openForm(editId){
    form.hidden = false;
    document.getElementById('uEditId').value = editId || '';
    if(editId){
      var u = USERS.find(function(x){ return x.id === editId; });
      document.getElementById('uName').value = u.name;
      document.getElementById('uEmail').value = u.email;
      document.getElementById('uRole').value = u.role;
      document.getElementById('uStatus').value = u.status;
      document.getElementById('uPassword').value = '';
      document.getElementById('saveUserBtn').textContent = 'Save changes';
    } else {
      form.reset();
      document.getElementById('saveUserBtn').textContent = 'Save user';
    }
    form.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }
  function closeForm(){
    form.hidden = true;
    form.reset();
  }

  if(addBtn){ addBtn.addEventListener('click', function(){ openForm(null); }); }
  if(cancelBtn){ cancelBtn.addEventListener('click', closeForm); }

  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var editId = document.getElementById('uEditId').value;
      var name = document.getElementById('uName').value.trim();
      var email = document.getElementById('uEmail').value.trim();
      var role = document.getElementById('uRole').value;
      var status = document.getElementById('uStatus').value;
      if(!name || !email) return;

      if(editId){
        var u = USERS.find(function(x){ return x.id === parseInt(editId, 10); });
        if(u){ u.name = name; u.email = email; u.role = role; u.status = status; }
      } else {
        USERS.push({ id: nextId++, name:name, email:email, role:role, status:status, lastLogin:'Never' });
      }
      closeForm();
      renderTable();
      renderStats();
    });
  }

  renderTable();
  renderStats();
})();
