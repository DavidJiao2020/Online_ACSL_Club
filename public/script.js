// Check session on page load
window.onload = async () => {
    const res = await fetch('/api/session');
    const data = await res.json();
    if (data.loggedIn) {
      currentUser = data.user;
      if (currentUser.role === "admin") renderAdmin();
      else renderStudent();
    } else {
      renderLogin();
    }
  };
  

const app = document.getElementById('app');
let currentUser = null;

// Render views
function renderLogin() {
  app.innerHTML = `
    <h1>Login</h1>
    <form id="loginForm">
      <input type="email" id="loginEmail" placeholder="Email address" required>
      <input type="password" id="loginPass" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <button onclick="renderRegister()">Register</button>
    <button onclick="renderForgot()">Forgot Password</button>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
  
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      if (data.role === "admin") renderAdmin();
      else renderStudent();
    } else {
      alert(data.message);
    }
  });
  
}

function renderRegister() {
    app.innerHTML = `
      <h1>Register</h1>
      <form id="registerForm">
        <input type="email" id="regEmail" placeholder="Email address" required>
        <input type="text" id="regName" placeholder="Name" required>
        <input type="password" id="regPass" placeholder="Password" required>
        <button type="submit">Register</button>
      </form>
      <button onclick="renderLogin()">Back to Login</button>
    `;
  
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPass').value;
  
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (data.success) {
        alert("Registered successfully! Please log in.");
        renderLogin();
      } else {
        alert(data.message);
      }
    });
}
  

function renderForgot() {
  app.innerHTML = `
    <h1>Forgot Password</h1>
    <form id="forgotForm">
      <input type="email" id="forgotEmail" placeholder="Email address" required>
      <button type="submit">Send Change Password Request</button>
    </form>
    <button onclick="renderLogin()">Back to Login</button>
  `;

  document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    const res = await fetch('/api/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    alert(data.message);
  });
}

function renderStudent() {
    app.innerHTML = `
      <h1>Welcome, ${currentUser.name}</h1>
      <p>Status: ${
        currentUser.division 
          ? "Registered for " + currentUser.division + " contest" 
          : "Not registered for any contest yet"
      }</p>
      <button onclick="renderResources()">Resources Hub</button>
      <div class="outlined">
        <h3>Register for a contest</h3>
        <select id="contestSelect">
          <option value="Elementary">Elementary</option>
          <option value="Classroom">Classroom</option>
          <option value="Junior">Junior</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Senior">Senior</option>
        </select>
        <button id="registerContest">Register for Competition</button>
      </div>
      <button onclick="logout()">Logout</button>
    `;
  
    document.getElementById('registerContest').addEventListener('click', async () => {
      const division = document.getElementById('contestSelect').value;
      const res = await fetch('/api/register-contest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, division })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        currentUser.division = division; // update local status
        renderStudent(); // refresh to show "Registered for X contest"
      } else {
        alert(data.message);
      }
    });
  }
  

function renderResources() {
  app.innerHTML = `
    <h1>Resources Hub</h1>
    <h2>Elementary</h2><p>[tbd]</p>
    <h2>Classroom</h2><p>[tbd]</p>
    <h2>Junior</h2><p>[tbd]</p>
    <h2>Intermediate</h2><p>[tbd]</p>
    <h2>Senior</h2><p>[tbd]</p>
    <button onclick="renderStudent()">Back</button>
  `;
}

function renderAdmin() {
  app.innerHTML = `
    <h1>Admin Dashboard</h1>
    <h2>Registered Students</h2>
    <ul id="students"></ul>
    <h2>Teams</h2>
    <div id="teams"></div>
    <button onclick="logout()">Logout</button>
  `;
  loadAdminData();
}

async function loadAdminData() {
  const res = await fetch('/api/admin-data');
  const data = await res.json();
  const studentList = document.getElementById('students');
  studentList.innerHTML = '';
  data.students.forEach(s => {
    const li = document.createElement('li');
    li.innerText = `${s.name} (${s.email})`;
    studentList.appendChild(li);
  });

  const teamDiv = document.getElementById('teams');
  teamDiv.innerHTML = '';
  data.teams.forEach(t => {
    const p = document.createElement('p');
    p.innerText = `${t.teamName} (Division: ${t.division}): ${t.members.join(", ")}`;
    teamDiv.appendChild(p);
  });
  
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    renderLogin();
}
  

// Start app
renderLogin();
