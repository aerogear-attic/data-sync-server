'use strict'
const gql = require('graphql-tag')

const time = new Date()
const schema = {
  id: 1,
  name: 'default',
  // language=GraphQL
  schema: gql`
   
      type Profile {
          id: ID! @isUnique
          email: String! @isUnique
          displayName: String!
          biography: String!
          avatarUrl: String!
          memes: [Meme]!
      }

      type Meme {
          id: ID! @isUnique
          photoUrl: String!
          ownerId: String!
      }

      type Query {
          allProfiles:[Profile!]!
          profile(email: String!):Profile
          allMemes:[Meme!]!
      }

      type Mutation {
          createProfile(email: String!, displayName: String!, biography: String!, avatarUrl: String!):Profile!
          updateProfile(id: ID!, email: String!, displayName: String!, biography: String!, avatarUrl: String!):Profile
          deleteProfile(id: ID!):Boolean!
          createMeme(ownerId: String!, photoUrl: String!):Meme!
      }

      type Subscription {
        memeAdded(photoUrl: String):Meme!
      }

    `,
  createdAt: time,
  updatedAt: time
}

module.exports = schema
