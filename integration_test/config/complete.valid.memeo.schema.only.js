'use strict'

const time = new Date()

module.exports = {
  id: 2,
  name: 'default',
  // language=GraphQL
  schema: `

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
