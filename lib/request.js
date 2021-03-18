var util = require('util')
var OutgoingMessage = require('./outgoing-message')

class Request extends OutgoingMessage {
  constructor(encoder, opts, streamOpts) {
    super(encoder, streamOpts)

    this.method = opts.method
    this.uri = opts.uri

    const self = this;
    if (opts.headers) {
      Object.keys(opts.headers).forEach(name => {
        self.setHeader(name, opts.headers[name])
      })
    }

    if (opts.body) {
      this.write(opts.body)
      process.nextTick(this.end.bind(this))
    }
  }

  writeHead() {
    if (this.headersSent) throw new Error('Headers already sent!')
    const requestLine = util.format('%s %s RTSP/1.0\r\n', this.method, this.uri);
    this._writeHead(requestLine)
  }
}

module.exports = Request