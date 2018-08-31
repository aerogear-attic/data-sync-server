'use strict'
const gql = require('graphql-tag')

const time = new Date()
const memeoListSchema = {
  id: 2,
  name: 'default',
  // language=GraphQL
  schema: gql`
    type Profile {
      id: ID! @isUnique
      email: String! @isUnique
      displayname: String
      pictureurl: String
      memes: [Meme!]!
    }
    
    type Meme {
      id: ID! @isUnique
      photourl: String!    
      likes: Int!
      owner: [Profile!]!
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
  schema: memeoListSchema
}
