'use strict'

const time = new Date()

const subscriptions = [
  {
    type: 'Subscription',
    field: 'memeAdded',
    GraphQLSchemaId: 1,
    topic: 'memeCreated',
    createdAt: time,
    updatedAt: time
  }
]

const memeoListSchema = {
  id: 1,
  name: 'default',
  schema: `

  type Meme {
    id: ID! @isUnique
    photoUrl: String!
  }
  
  type Query {
    allMemes:[Meme!]!
  }
  
  type Mutation {
    createMeme(photoUrl: String!):Meme!
  }
  
  type Subscription {
    memeAdded(photoUrl: String):Meme!
  }
  
  `,
  createdAt: time,
  updatedAt: time
}

module.exports = {
  schema: memeoListSchema,
  subscriptions
}
