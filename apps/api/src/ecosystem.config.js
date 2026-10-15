module.exports = {
    apps: [
      {
        name: "Hymn-API",
  
        script: "/usr/bin/tsx",
        args: "src/index.ts",
  
        cwd: "/var/lib/hymn-app/Hymn-App/apps/api",
  
        exec_mode: "fork",
        instances: 1,
  
        out_file: "/var/log/hymn-app/hymn-api-out.log",
        error_file: "/var/log/hymn-app/hymn-api-error.log",
  
        time: true,
        log_date_format: "YYYY-MM-DD HH:mm:ss",
  
        autorestart: true,
        watch: false
      }
    ]
  };