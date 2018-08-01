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
  type Profile {
    id: ID! @isUnique
    email: String! @isUnique
    displayname: String
    pictureurl: String
    memes: [Meme!]!
  }
  
  type Meme {
    id: ID! @isUnique
    ownerid: ID!
    photourl: String!
    owner: String
    likes: Int!
    comments: [Comment!]!
  }
  
  type Comment {
    id: ID! @isUnique
    owner: String!
    comment: String!
  }
  
  type Query {
    allMemes:[Meme!]!
    profile(email: String!): [Profile]!
  }
  
  type Mutation {
    createProfile(email: String!, displayname: String!, pictureurl: String!):Profile!
    createMeme(ownerid: ID!, photourl: String!, owner: String!):Meme!
    likeMeme(id: ID!): Boolean
    postComment(memeid: ID!, comment: String!, owner: String!): Comment!
  }

  type Subscription {
    memeAdded(photourl: String):Meme!
  }
  `,
  createdAt: time,
  updatedAt: time
}

module.exports = {
  schema: memeoListSchema,
  subscriptions
}
