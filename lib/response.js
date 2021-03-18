'use strict'

var util = require('util')
var OutgoingMessage = require('./outgoing-message')
var STATUS_CODES = require('./status-codes')

class Response extends OutgoingMessage {
  
  constructor(encoder, opts) {
    super(encoder, opts)
    this.statusCode = 200
  }

  writeHead(statusCode, statusMessage, headers) {
    if (this.headersSent) throw new Error('Headers already sent!')

    if (typeof statusMessage === 'object') {
      headers = statusMessage
      statusMessage = null
    }

    if (statusCode) this.statusCode = statusCode
    this.statusMessage = statusMessage || this.statusMessage || STATUS_CODES[String(this.statusCode)]
    const statusLine = util.format('RTSP/1.0 %s %s\r\n', this.statusCode, this.statusMessage);

    this._writeHead(statusLine, headers)
  }
}


module.exports = Response;