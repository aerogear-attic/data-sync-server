'use strict'

const time = new Date()

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
    _: Boolean
  }
  
  `,
  createdAt: time,
  updatedAt: time
}

module.exports = {
  schema: memeoListSchema
}
