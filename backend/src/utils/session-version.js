const { createHash } = require('crypto');

// Changes automatically when the password hash changes; no schema migration.
module.exports = (passwordHash) => createHash('sha256').update(passwordHash).digest('hex');
