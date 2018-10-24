const {test} = require('ava')

const {getClientInfoFromHeaders} = require('./logger')

test('getClientInfoFromHeaders should not throw error if the header value is missing', t => {
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
})

test('getClientInfoFromHeaders should throw error if the header value is malformed', t => {
  // structure ok, invalid base64
  t.throws(
    () => { getClientInfoFromHeaders({headers: {'data-sync-client-info': 1}}) },
    Error
  )

  // structure ok, invalid base64
  t.throws(
    () => { getClientInfoFromHeaders({headers: {'data-sync-client-info': 'foo'}}) },
    Error
  )

  // structure ok, base64 ok, value not JSON
  t.throws(
    () => { getClientInfoFromHeaders({headers: {'data-sync-client-info': Buffer.from('foo', 'utf8').toString('base64')}}) },
    Error
  )
})

test('getClientInfoFromHeaders return client info successfully', t => {
  t.deepEqual(getClientInfoFromHeaders({
    headers: {
      'data-sync-client-info': Buffer.from('{"clientId":1234}', 'utf8').toString('base64')
    }
  }), {'clientId': 1234})
})
