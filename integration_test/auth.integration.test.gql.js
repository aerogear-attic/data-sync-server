'use strict'

const gql = require('graphql-tag')
const crypto = require('crypto')

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
  const randomUrl = `http://example.com/meme.jpg?${crypto.randomBytes(16).toString('hex')}`
  return {
    // language=GraphQL
    mutation: gql`
            mutation {
                createMeme (
                owner: ${owner},
                photourl: "${randomUrl}"                
            ) {
                id,
                photourl,
                likes,
                owner {
                    id
                }
            }
            }
        `
  }
}

module.exports.allMemes = (withComments) => {
  const comments = withComments ? ',comments' : ''
  return {
    query: gql`
        query {
        allMemes {
            id,
            photourl,
            likes,
            owner {
               id
            }
            ${comments}
        }
        }
    `
  }
}

module.exports.likeMeme = (id) => {
  return {
    mutation: gql`
            mutation {
                likeMeme (id: "${id}") 
            }
        `
  }
}

module.exports.postComment = (memeid, comment, owner) => {
  return {
    mutation: gql`
            mutation {
                postComment (memeid:"${memeid}",comment:"${comment}",owner:"${owner}")
                {
                    id
                    comment
                }
            }
        `
  }
}

module.exports.allComments = {
  // language=GraphQL
  query: gql`  
    query {
        allComments {
            id
            comment
        }
    }
    `}
