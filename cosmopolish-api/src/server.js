import { createApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const { app, deps } = createApp(config);

if ((await deps.users.count()) === 0) {
  const { username, password } = config.seedAdmin;
  if (username && password) {
    await deps.users.upsert(username, password);
    console.log(`Created initial admin "${username}" from ADMIN_USERNAME/ADMIN_PASSWORD.`);
  } else {
    console.warn('No admin accounts yet. Create one with: npm run create-admin -- <username>');
  }
}

app.listen(config.port, config.host, () => {
  console.log(`CosmoPolish API listening on http://${config.host}:${config.port}`);
});
