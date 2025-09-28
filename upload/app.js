// app name: Online ACSL Club
// app email: jiaochao.2030@gmail.com
// app password: gbap tydm jell bvjr [DO NOT DELETE 16 characters]
/////////////////////////////////////////////////
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}


// Setup Gmail transport (needs "App Passwords" if using Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jiaochao.2030@gmail.com',
    pass: 'gbaptydmjellbvjr' // NOT your Gmail password
  }
});

function sendMail(to, subject, text) {
  return transporter.sendMail({
    from: '"ACSL Club" <yourgmail@gmail.com>',
    to,
    subject,
    text
  });
}

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const TEAMS_FILE = path.join(__dirname, 'data', 'teams.json');

let users = [];
let teams = []; // array of objects: { division: "Elementary", members: [userIds] }


// Load users from disk at startup
if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

// Helper function to save users to disk
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Load teams from disk at startup
if (fs.existsSync(TEAMS_FILE)) {
  teams = JSON.parse(fs.readFileSync(TEAMS_FILE, 'utf-8'));
}

// Helper function to save teams to disk
function saveTeams() {
  fs.writeFileSync(TEAMS_FILE, JSON.stringify(teams, null, 2));
}



const session = require('express-session');
app.use(session({
  secret: 'replace_this_with_a_strong_secret', // change this in production
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 10 * 60 * 1000 } // 10 minutes
}));


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Helper: find or create a team with space (max 10 per team)
let nextTeamId = teams.length > 0 ? Math.max(...teams.map(t => t.id)) + 1 : 1;

function assignToTeam(user) {
  // Remove user from any existing team first
  teams.forEach(team => {
    team.members = team.members.filter(id => id !== user.id);
  });

  // Find a team with same division and <10 members
  let team = teams.find(t => t.division === user.division && t.members.length < 10);
  if (team) {
    team.members.push(user.id);
  } else {
    // Create new team with unique id
    const newTeam = {
      id: nextTeamId++,
      division: user.division,
      members: [user.id]
    };
    teams.push(newTeam);
  }

  saveTeams(); // persist changes
}



// Register
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.json({ success: false, message: "Email already registered." });
  }

  const confirmationToken = generateToken();
  const role = (email === "david.jiao.2020@gmail.com") ? "admin" : "student";
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    role,
    confirmed: false,
    confirmationToken
  };
  users.push(newUser);
  saveUsers();

  // Email confirmation link
  const confirmUrl = `http://localhost:3000/api/confirm/${confirmationToken}`;
  sendMail(email, "Confirm your ACSL account",
    `Hi ${name},\n\nPlease confirm your account by clicking this link:\n${confirmUrl}\n\nThanks!`
  );

  res.json({ success: true, message: "Registered. Check your email to confirm account." });
});

// Email confirmation
app.get('/api/confirm/:token', (req, res) => {
  const { token } = req.params;
  const user = users.find(u => u.confirmationToken === token);

  if (!user) {
    return res.send("Invalid or expired confirmation link.");
  }

  user.confirmed = true;
  user.confirmationToken = null;
  saveUsers();

  res.send("✅ Account confirmed! You can now log in.");
});



// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Hardcoded admin login
  if (email === "david.jiao.2020@gmail.com" && password === "123456") {
    req.session.user = { role: "admin", name: "David", email };
    return res.json({ success: true, role: "admin", user: { name: "David", email } });
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.json({ success: false, message: "Login failed. Try again or register." });
  }

  // 🚨 NEW CHECK: must be confirmed
  if (!user.confirmed) {
    return res.json({
      success: false,
      message: "Please confirm your email before logging in."
    });
  }

  req.session.user = { role: "student", name: user.name, email: user.email, division: user.division };
  res.json({ success: true, role: "student", user });
});




app.post('/api/forgot', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.json({ success: false, message: "Email not found." });

  const resetToken = generateToken();
  user.resetToken = resetToken;
  saveUsers();

  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
  sendMail(email, "Reset your ACSL password",
    `Hi ${user.name},\n\nReset your password using this link:\n${resetUrl}\n\nIf you didn't request this, ignore this email.`
  );

  res.json({ success: true, message: "Password reset link sent to email." });
});

// Serve reset password page
app.get("/reset-password/:token", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reset.html"));
});

app.post('/api/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  const user = users.find(u => u.resetToken === token);
  console.log(user);
  if (!user) return res.json({ success: false, message: "Invalid or expired reset link." });

  user.password = newPassword;
  user.resetToken = null;
  saveUsers();

  res.json({ success: true, message: "Password updated. You can now log in." });
});



// Register for contest
app.post('/api/register-contest', (req, res) => {
  const { email, division } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.json({ success: false, message: "User not found" });

  user.division = division; // save student's contest division
  assignToTeam(user);
  saveUsers();

  // update session if logged in
  if (req.session.user && req.session.user.email === user.email) {
    req.session.user.division = division;
  }

  res.json({ success: true, message: `Registered for ${division} contest` });

});


// Admin: get all users + teams
app.get('/api/admin-data', (req, res) => {
  res.json({
    students: users.filter(u => u.role === "student"),
    teams: teams.map((team, idx) => ({
      teamName: `Team ${idx + 1}`,
      division: team.division,
      members: team.members.map(id => users.find(u => u.id === id)?.name || "Unknown")
    }))
  });
});

app.get('/api/session', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === "admin") {
      res.json({ loggedIn: true, user: req.session.user });
    } else {
      // For students, return full user including division
      const fullUser = users.find(u => u.email === req.session.user.email);
      res.json({ loggedIn: true, user: fullUser });
    }
  } else {
    res.json({ loggedIn: false });
  }
});



app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.json({ success: false, message: "Logout failed" });
    res.json({ success: true });
  });
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
