const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(__dirname, 'session.json');


// ==================================================
// GET ALL SESSIONS
// ==================================================

function getAllSessions() {

    if (!fs.existsSync(SESSION_FILE)) {
        return {};
    }

    const data = fs.readFileSync(SESSION_FILE, 'utf-8');

    if (!data.trim()) {
        return {};
    }

    return JSON.parse(data);
}


// ==================================================
// SAVE SESSION
// ==================================================

function saveSession(role, session) {

    const sessions = getAllSessions();

    sessions[role] = session;

    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));

    // console.log('SESSION FILE:', SESSION_FILE);
    // console.log('SAVED SESSION:', sessions[role]);
}

//Remove Session

function removeSession(role) {

    const sessions = getAllSessions();

    if (sessions[role]) {

        delete sessions[role];

        fs.writeFileSync(SESSION_FILE,JSON.stringify(sessions, null, 2));

        console.log(`✓ Removed invalid ${role} session`);
    }
}


// ==================================================
// GET SESSION
// ==================================================

function getSession(role) {

    const sessions = getAllSessions();

    return sessions[role] || null;
}


module.exports = { saveSession, getSession,removeSession };