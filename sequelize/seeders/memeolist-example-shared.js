'use strict'

const time = new Date()

const subscriptions = [
  {
    type: 'Subscription',
    field: 'memeAdded',
    GraphQLSchemaId: 1,
    topic: 'memeCreated',
    filter: JSON.stringify({
      match: ['$payload.memeAdded.photourl', 'https://.*']
    }),
    createdAt: time,
    updatedAt: time
  }
]

const memeoListSchema = {
  id: 1,
  name: 'default',
  schema: `
  type Profile {
    id: ID! 
    email: String!
    displayname: String
    pictureurl: String
    memes: [Meme!]!
  }
  
  type Meme {
    id: ID!
    photourl: String!    
    likes: Int!
    owner: [Profile!]!
    comments: [Comment!]!
  }
  
  type Comment {
    id: ID!
    owner: String!
    comment: String!
  }
  
  type Query {
    allMemes:[Meme!]!
    profile(email: String!): [Profile]!
  }
  
  type Mutation {
    createProfile(email: String!, displayname: String!, pictureurl: String!):Profile! @hasRole(role: "admin", type: "realm")
    createMeme(owner: ID!, photourl: String!):Meme!
    likeMeme(id: ID!): Boolean @hasRole(role: "voter", type: "realm")
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
