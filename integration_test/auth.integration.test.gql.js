'use strict'

const gql = require('graphql-tag')

module.exports.profileMutation = mutationName => {
  return {
    // language=GraphQL
    mutation: gql`
          mutation {
              ${mutationName} (
                  email: "jordan@example.com",
                  displayname: "Michael Jordan",
                  pictureurl:"http://example.com/mj.jpg"
              ) {
                  id,
                  email,
                  displayname,
                  pictureurl
              }
          }
      `
  }
}

module.exports.allProfiles = {
  // language=GraphQL
  query: gql`{
        allProfiles {
            id
        }
      }`
}

module.exports.createMeme = (owner) => {
  return {
    // language=GraphQL
    mutation: gql`
            mutation {
                createMeme (
                owner: ${owner},
                photourl:"http://example.com/meme.jpg"
            ) {
                id,
                photourl,
                owner
            }
            }
        `
  }
}
