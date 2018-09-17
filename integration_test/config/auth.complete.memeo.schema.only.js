'use strict'
const time = new Date()
const schema = {
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
      comments: [Comment!]! @hasRole(role: ["admin","commentViewer" ])
    }
    
    type Comment {
      id: ID!
      owner: String!
      comment: String!
    }
    
    type Query {
      allMemes:[Meme!]!
      profile(email: String!): [Profile]!
      allProfiles:[Profile!]!
      allComments: [Comment!]! @hasRole(role: "admin")
    }
    
    type Mutation {
      createProfile(email: String!, displayname: String!, pictureurl: String!):Profile! @hasRole(role: "admin")
      createProfileRealm(email: String!, displayname: String!, pictureurl: String!):Profile! @hasRole(role: "realm:admin")
      createMeme(owner: ID!, photourl: String!):Meme! 
      likeMeme(id: ID!): Boolean @hasRole(role: ["voter","test"])
      postComment(memeid: ID!, comment: String!, owner: String!): Comment!
    }
  
    type Subscription {
      memeAdded(photourl: String):Meme! @hasRole(role: "commentViewer")
    }
    `,
  createdAt: time,
  updatedAt: time
}

module.exports = schema
