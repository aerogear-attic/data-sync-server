const { split } = require('apollo-link')
const { HttpLink } = require('apollo-link-http')
const { WebSocketLink } = require('apollo-link-ws')
const { getMainDefinition } = require('apollo-utilities')
const fetch = require('node-fetch')
const ws = require('ws')
const { ApolloClient } = require('apollo-client')
const { InMemoryCache } = require('apollo-cache-inmemory')
const gql = require('graphql-tag')

class TestApolloClient {
  constructor() {
    this.client = createApolloClient()
  }

  subscribe(query, timeout = 3000) {
    return new Promise((resolve, reject) => {
      this.client.subscribe({
        query: query
      }).subscribe({
        next: resolve,
        error: reject
      })
      setTimeout(reject, timeout);
    })
  }
}

module.exports = TestApolloClient

function createApolloClient () {
  // Create an http link:
  const httpLink = new HttpLink({
    uri: 'http://localhost:8000/graphql',
    fetch: fetch
  })

  // Create a WebSocket link:
  const wsLink = new WebSocketLink({
    uri: `ws://localhost:8000/subscriptions`,
    options: {
      reconnect: true
    },
    webSocketImpl: ws
  })

  // using the ability to split links, you can send data to each link
  // depending on what kind of operation is being sent
  const link = split(
    // split based on operation type
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query)
      return kind === 'OperationDefinition' && operation === 'subscription'
    },
    wsLink,
    httpLink
  )

  return new ApolloClient({
    link: link,
    cache: new InMemoryCache()
  })
}
