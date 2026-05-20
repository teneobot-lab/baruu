module.exports = {
  apps: [
    {
      name: "gudangpro-api",
      cwd: "/root/baruu",
      script: "pnpm",
      args: "--filter @workspace/api-server run dev",
      env: {
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://gudangpro:password123@localhost:5433/gudangpro",
        SESSION_SECRET: "rahasia_session_super_panjang_ini",
        PORT: "3003",
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 5000,
    },
  ],
};
