module.exports = {
  apps: [{
    name: 'gudangpro-api',
    cwd: '/root/baruu',
    script: 'pnpm',
    args: '--filter @workspace/api-server run dev',
    env: {
      NODE_ENV: 'production',
      PORT: '3003',
      DATABASE_URL: 'postgresql://gudangpro:password123@localhost:5433/gudangpro',
      SESSION_SECRET: 'rahasia_session_super_panjang_ini',
      ALLOWED_ORIGINS: 'https://baruu-gudangpro.vercel.app'
    }
  }]
}
