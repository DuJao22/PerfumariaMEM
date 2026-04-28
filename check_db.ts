import db from './database.ts';

async function checkUsers() {
  try {
    const users = await db.sql('SELECT id, nome, login, tipo FROM usuarios');
    console.log('Users in database:', JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err);
    process.exit(1);
  }
}

checkUsers();
