// Profile loader — shared by all platform adapters.
// Priority order:
//   1. PROFILE_PROMPT environment variable
//   2. api/profile.md file on disk
// Copy api/profile.example.md → api/profile.md to get started.

const fs   = require('fs');
const path = require('path');

// Cache so the file is only read once per function instance lifetime.
let _cached = null;

function loadProfile() {
    if (_cached) return _cached;

    if (process.env.PROFILE_PROMPT) {
        _cached = process.env.PROFILE_PROMPT;
        return _cached;
    }

    // __dirname is api/src/core/ → ../../profile.md = api/profile.md
    const filePath = path.join(__dirname, '../../profile.md');
    if (fs.existsSync(filePath)) {
        _cached = fs.readFileSync(filePath, 'utf8');
        return _cached;
    }

    throw new Error(
        'Profile not found. Create api/profile.md (copy from api/profile.example.md) ' +
        'or set the PROFILE_PROMPT environment variable.'
    );
}

module.exports = { loadProfile };
