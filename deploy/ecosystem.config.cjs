module.exports = {
  apps: [
    {
      name: "tanyora",
      script: ".output/server/index.mjs",
      cwd: __dirname + "/..",
      env_file: ".env.production",
      env: { NODE_ENV: "production", PORT: process.env.PORT || 3100, HOST: "127.0.0.1" },
      max_memory_restart: "512M",
    },
  ],
};
