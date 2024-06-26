const winston = require('winston')
const { createLogger, format } = winston
const FluentTransport = require('fluent-logger').support.winstonTransport()

// Create a Winston logger
const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new FluentTransport(process.env.API ? 'api.access' : 'frontend.access', {
      host: 'fluentd',
      port: 24224,
      timeout: 3.0,
      reconnectInterval: 600000 // 10 minutes
    })
  ]
})
// Create a Winston logger
module.exports = logger
