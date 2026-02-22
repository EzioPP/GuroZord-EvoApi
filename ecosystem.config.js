module.exports = {
  apps: [
    {
      name: 'gurozorg',
      script: 'dist/src/index.js',
      node_args: '-r module-alias/register',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};