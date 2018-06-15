const fs = require('fs')
const graphqlTools = require('graphql-tools')
const graphqlSubscriptions = require('graphql-subscriptions')

const pubsub = new graphqlSubscriptions.PubSub()
const CREATED_NOTE_TOPIC = 'new_note'

const resolvers = {
  Query: {
    readNote: (root, { id }) => {
      console.log('notes readNote', id)
      // return models.Note.findById(id);
      return null
    },
    listNotes: () => {
      console.log('notes listNotes')
      // return models.Note.findAll();
      return []
    }
  },
  Mutation: {
    createNote: (root, { note }) => {
      // let newNote = models.Note.build(note).save();
      // This is a simplified pub/sub setup that doesn't take
      // into account if the model created OK, or return the
      // resulting created model
      pubsub.publish(CREATED_NOTE_TOPIC, {noteCreated: note})
      return note
    },
    updateNote: (root, { note }) => {
      return note
      // return models.Note.findById(note.id).then((existing_note) => {
      //   return existing_note.update(note);
      // });
    },
    deleteNote: (root, { note }) => {
      return note
      // return models.Note.findById(note.id).then((existing_note) => {
      //   return existing_note.destroy({force: true});
      // });
    }
  },
  Subscription: {
    noteCreated: {
      subscribe: graphqlSubscriptions.withFilter(
        () => pubsub.asyncIterator(CREATED_NOTE_TOPIC),
        (payload, variables) => {
          return payload !== undefined
          // return (payload !== undefined) &&
          // ((variables.episode === null) || (payload.reviewAdded.episode === variables.episode));
        }
      )
    }
  }
}

exports.parseFromFile = function (schemaFile) {
  const schemaString = fs.readFileSync(schemaFile).toString()

  return graphqlTools.makeExecutableSchema({
    typeDefs: [schemaString],
    resolvers
  })
}
