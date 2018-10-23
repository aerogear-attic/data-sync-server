const {test} = require('ava')

const {getClientInfoFromHeaders} = require('./logger')

test('getClientInfoFromHeaders should never throw error', t => {
  t.is(getClientInfoFromHeaders(undefined), undefined)

  t.is(getClientInfoFromHeaders(null), undefined)
  t.is(getClientInfoFromHeaders(1), undefined)
  t.is(getClientInfoFromHeaders('foo'), undefined)
  t.is(getClientInfoFromHeaders({}), undefined)
  t.is(getClientInfoFromHeaders({foo: 1}), undefined)

  t.is(getClientInfoFromHeaders({headers: null}), undefined)
  t.is(getClientInfoFromHeaders({headers: 1}), undefined)
  t.is(getClientInfoFromHeaders({headers: 'foo'}), undefined)
  t.is(getClientInfoFromHeaders({headers: {}}), undefined)
  t.is(getClientInfoFromHeaders({headers: {foo: 1}}), undefined)

  // structure ok, missing data
  t.is(getClientInfoFromHeaders({
    headers: {
      'data-sync-client-info': null
    }
  }), undefined)

  // structure ok, invalid base64
  t.is(getClientInfoFromHeaders({
    headers: {
      'data-sync-client-info': 1
    }
  }), undefined)

  // structure ok, invalid base64
  t.is(getClientInfoFromHeaders({
    headers: {
      'data-sync-client-info': 'foo'
    }
  }), undefined)

  // structure ok, base64 ok, value not JSON
  t.is(getClientInfoFromHeaders({
    headers: {
      'data-sync-client-info': Buffer.from('foo', 'utf8').toString('base64')
    }
  }), undefined)
})

test('getClientInfoFromHeaders return client info successfully', t => {
  t.deepEqual(getClientInfoFromHeaders({
    headers: {
      'data-sync-client-info': Buffer.from('{"clientId":1234}', 'utf8').toString('base64')
    }
  }), {'clientId': 1234})
})
