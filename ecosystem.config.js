module.exports = {
  apps: [
    {
      name: "Comms Core",
      script: "dist/app.js",
      watch: false,
      instances: 3,
      exec_mode: "cluster",
    },
  ],
};