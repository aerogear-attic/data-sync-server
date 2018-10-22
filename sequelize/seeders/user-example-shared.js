'use strict'

const time = new Date()

// const subscriptions = [
//   // {
//   //   type: 'Subscription',
//   //   field: 'userAdded',
//   //   GraphQLSchemaId: 1,
//   //   createdAt: time,
//   //   updatedAt: time
//   // }
// ]

const userSchema = {
  id: 1,
  name: 'default',
  schema: `
  type Feedback {
      id: ID!
      text: String!
      votes: Int!
      author: User!
  }
  type User {
      _id: ID!
      name: String!
      dateOfBirth: String!
      feedback: [Feedback]
  }
  type Query {
      allFeedbacks: [Feedback],
      getFeedback(id: Int!): Feedback,
      allUsers: [User],
      getUser(id: ID!): User
  }
  type Mutation {
      createUser(name: String!, dateOfBirth: String!): User
      updateUser(id: ID!, name: String, dateOfBirth: String): User
      deleteUser(id: ID!): User
      deleteFeedback(id: ID!): Feedback
      createFeedback(text: String!, votes: Int!, author: ID!): Feedback
      updateFeedback(id: ID!, text: String, votes: Int, author: ID!): Feedback
      ## Increment counter for specific feedback
      vote(id: ID!, userId: ID!): Feedback
  }
  `,
  createdAt: time,
  updatedAt: time
}

module.exports = {
  schema: userSchema
  // subscriptions
}
