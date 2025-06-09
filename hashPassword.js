
// hashPassword.js
// ────────────────────────────────────────────────────────────────────
// Prints each admin’s email, role, and a bcrypt-hashed version of the
// plaintext password defined below.
//
// Run with:  node hashPassword.js
// ────────────────────────────────────────────────────────────────────

const bcrypt = require('bcryptjs');
const saltRounds = 10;

// 🔒 Plain-text passwords live ONLY here.
//    Replace them with env vars or a secrets manager in production.
const adminUsers = [
  { email: 'manager@caffico.com',       role: 'BUSINESS_MANAGER',   password: 'managerPass123'   },
  { email: 'manualorder@caffico.com',   role: 'MANUAL_ORDER_TAKER', password: 'manualPass123'    },
  { email: 'processor@caffico.com',     role: 'ORDER_PROCESSOR',    password: 'processorPass123' },
];

async function generateHashedAdminCredentials(users) {
  for (const user of users) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      const lowerCaseEmail = user.email.toLowerCase();

      console.log(`Email   : ${lowerCaseEmail}`);
      console.log(`Role    : ${user.role}`);
      console.log(`Password: ${hashedPassword}`);
      console.log('───────────────────────────────────────────────');
    } catch (err) {
      console.error(`Error hashing password for ${user.email}:`, err);
    }
  }
}

generateHashedAdminCredentials(adminUsers);

