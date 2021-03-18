var stream = require('readable-stream')
var nextLine = require('next-line')
var httpHeaders = require('http-headers')
var requestLine = require('./request-line')
var statusLine = require('./status-line')

const STATUS_LINE_START = new Buffer('RTSP/1.0');

class IncomingMessage extends stream.PassThrough {
  constructor(head, opts) {

    super(opts)

    if (typeof head === 'string') head = new Buffer(head)

    let line = nextLine(head)();

    if (isResponse(head)) {
      line = statusLine.parse(line)
      this.statusCode = line.statusCode
      this.statusMessage = line.statusMessage
    } else {
      line = requestLine.parse(line)
      this.method = line.method
      this.uri = line.uri
    }

    this.rtspVersion = line.rtspVersion
    this.headers = httpHeaders(head)
  }
}


function isResponse (head) {
  for (var i = 0; i < 8; i++) {
    if (STATUS_LINE_START[i] !== head[i]) return false
  }
  return true
}

module.exports = IncomingMessage;