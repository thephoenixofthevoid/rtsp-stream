'use strict'

var stream = require('readable-stream')
var Response = require('./lib/response')
var Request = require('./lib/request')

class Encoder extends stream.Readable {
  constructor(opts) {
    super(opts)
    this._messageQueue = []
  }

  _read(size) {
    if (this._drainedCallback) {
      const cb = this._drainedCallback;
      this._drainedCallback = null
      cb()
    }
  }

  _push(chunk, encoding, cb) {
    const drained = this.push(chunk, encoding);
    if (drained) return cb()
    this._drainedCallback = cb
  }

  // Build a new response. We have to take extra care if more than one
  // response is active at the same time. In that case, the order in which
  // the responses was created should be the same as the order of which
  // their data is emitted from the encoder stream. Also, data from one
  // response must not be mixed with data from another response.
  response() {
    const res = new Response(this);
    this._pushQueue(res)
    return res
  }

  // Options:
  // - method
  // - uri
  // - headers (optional)
  // - body (optional)
  request(opts, cb) {
    const req = new Request(this, opts);
    if (cb) req.on('finish', cb)
    this._pushQueue(req)
    return req
  }

  _pushQueue(msg) {
    this._messageQueue.push(msg)
    if (this._messageQueue.length > 1) return
    msg.once('finish', this._shiftQueue.bind(this))
    msg._kick()
  }

  _shiftQueue() {
    this._messageQueue.shift()
    if (this._messageQueue.length === 0) return
    this._messageQueue[0].once('finish', this._shiftQueue.bind(this))
    this._messageQueue[0]._kick()
  }
}

module.exports = Encoder;
