// pm2 process definition used by the deploy workflow: `pm2 startOrReload ecosystem.config.cjs`
module.exports = {
  apps: [
    {
      name: 'cosmopolish-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
