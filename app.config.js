module.exports = {
  apps: [
    {
      "watch": false,
      "max_restarts": 5,
      "restart_delay": 120000,
      "cwd": process.cwd(),
      "exp_backoff_restart_delay": 30000,
      "name": "e_o_m",
      "script": "node index"
    }
  ]
}