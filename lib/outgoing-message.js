var util = require('util')
var stream = require('readable-stream')
var debug = require('./debug')

class OutgoingMessage extends stream.Writable {
  constructor(encoder, opts) {
    super(opts)

    this.headersSent = false
    this._encoder = encoder
    this._headers = {}

    this.on('finish', function () {
      if (!this.headersSent) this.writeHead() // must be implemented by descendants
    })
  }

  _write(chunk, encoding, cb) {
    if (this._active) {
      if (!this.headersSent) this.writeHead() // must be implemented by descendants
      this._encoder._push(chunk, encoding, cb)
    } else {
      this._bufChunk = chunk
      this._bufEncoding = encoding
      this._bufCallback = cb
    }
  }

  _kick() {
    this._active = true
    if (!this._bufChunk) return
    const chunk = this._bufChunk;
    const encoding = this._bufEncoding;
    const cb = this._bufCallback;
    this._bufChunk = null
    this._bufEncoding = null
    this._bufCallback = null
    this._write(chunk, encoding, cb)
  }

  setHeader(name, value) {
    if (this.headersSent) throw new Error('Headers already sent!')
    this._headers[name.toLowerCase()] = [name, value]
  }

  getHeader(name) {
    const header = this._headers[name.toLowerCase()];
    return header ? header[1] : undefined
  }

  removeHeader(name) {
    if (this.headersSent) throw new Error('Headers already sent!')
    delete this._headers[name.toLowerCase()]
  }

  _writeHead(startLine, headers) {
    const self = this;

    if (this.headersSent) throw new Error('Headers already sent!')

    if (headers) {
      Object.keys(headers).forEach(name => {
        self.setHeader(name, headers[name])
      })
    }

    this._encoder.push(startLine, 'utf8')
    debug('start-line sent', startLine.trim())

    const debugHeaders = {};
    Object.keys(this._headers).forEach(key => {
      const header = self._headers[key];
      const name = header[0];
      let value = header[1];
      debugHeaders[name] = value
      if (!Array.isArray(value)) value = [value]
      value.forEach(value => {
        self._encoder.push(util.format('%s: %s\r\n', name, value), 'utf8')
      })
    })

    this._encoder.push('\r\n', 'utf8')
    debug('headers sent', debugHeaders)

    this.headersSent = true
  }
}

module.exports = OutgoingMessage;