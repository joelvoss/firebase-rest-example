const { STATUS_CODES } = require('http');

const TYPE = 'content-type';
const DEFAULT_MIME = 'application/octet-stream';

/**
 * Helper method to send http responses and infer different data formats.
 * @param {Object} res HTTP response object
 * @param {Number} [code=200] (Optional) Status code. Defaults to 200.
 * @param {Any} data (Optional) Data to return
 * @param {Object} headers (Optional) Response headers
 */
function send(res, code = 200, data = '', headers = {}) {
  // Transform headers to lowercase
  let obj = {};
  for (let k in headers) {
    obj[k.toLowerCase()] = headers[k];
  }

  // Get content-type
  let type = obj[TYPE] || res.getHeader(TYPE);

  // Pipe data into the response directly
  if (!!data && typeof data.pipe === 'function') {
    res.setHeader(TYPE, type || DEFAULT_MIME);
    return data.pipe(res);
  }

  // Infer different data formats
  if (data instanceof Buffer) {
    type = type || DEFAULT_MIME;
  } else if (typeof data === 'object') {
    data = JSON.stringify(data);
    type = type || 'application/json;charset=utf-8';
  } else {
    data = data || STATUS_CODES[code];
  }

  // Otherwise just handle data as plain text
  obj[TYPE] = type || 'text/plain';
  obj['content-length'] = Buffer.byteLength(data);

  res.writeHead(code, obj);
  res.end(data);
}

exports.send = send;
