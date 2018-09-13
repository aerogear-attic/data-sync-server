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
    owner: Profile!
  }
  
  type Comment {
    id: ID!
    comment: String!
    owner: Profile!
  }
  
  type Query {
    profile(email: String!): [Profile]!
    allMemes:[Meme!]!
    comments(memeid: ID!): [Comment]!
  }
    
  type Mutation {
    createProfile(email: String!, displayname: String!, pictureurl: String!):Profile! @hasRole(role: "realm:admin")
    createMeme(owner: ID!, photourl: String!):Meme!
    likeMeme(id: ID!): Boolean @hasRole(role: "realm:voter")
    postComment(memeid: ID!, comment: String!, owner: ID!): Comment!
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
