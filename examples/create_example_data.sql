INSERT INTO "DataSources" ("id","name","type","config","createdAt","updatedAt")VALUES (DEFAULT,'nedb_notes','InMemory','{"options":{"timestampData":true}}','2018-07-02 15:44:45.467 +00:00','2018-07-02 15:44:45.467 +00:00') RETURNING *;

INSERT INTO "GraphQLSchemas" ("id","schema","createdAt","updatedAt") VALUES (DEFAULT,'schema {
      query: Query
      mutation: Mutation
      subscription: Subscription
    }

    # The query type, represents all of the entry points into our object graph
    type Query {
      readNote(id: String): Note
      listNotes: [Note]
    }

    # The mutation type, represents all updates we can make to our data
    type Mutation {
      createNote(
        title: String,
        content: String,
      ): Note
      updateNote(
        id: String,
        title: String,
        content: String
      ): Note
      deleteNote(id: String): Note
    }

    type Note {
      _id: String
      title: String
      content: String
      createdAt: String
      updatedAt: String
    }

    type Subscription {
      noteCreated: Note
    }','2018-07-03 09:49:57.062 +00:00','2018-07-03 09:49:57.062 +00:00') RETURNING *;

INSERT INTO "Resolvers" ("id","type","field","requestMapping","responseMapping","createdAt","updatedAt","DataSourceId") VALUES (DEFAULT,'Query','readNote','{"operation": "findOne","query": {"_id": "{{context.arguments.id}}"}}','{{toJSON context.result}}','2018-07-03 10:11:30.054 +00:00','2018-07-03 10:11:30.054 +00:00','1') RETURNING *;
INSERT INTO "Resolvers" ("id","type","field","requestMapping","responseMapping","createdAt","updatedAt","DataSourceId") VALUES (DEFAULT,'Query','listNotes','{"operation": "find","query": {}}','{{toJSON context.result}}','2018-07-03 10:11:30.054 +00:00','2018-07-03 10:11:30.054 +00:00','1') RETURNING *;
INSERT INTO "Resolvers" ("id","type","field","requestMapping","responseMapping","createdAt","updatedAt","DataSourceId") VALUES (DEFAULT,'Mutation','createNote','{"operation": "insert","doc": {"title": "{{context.arguments.title}}","content": "{{context.arguments.content}}"}}','{{toJSON context.result}}','2018-07-03 10:11:30.054 +00:00','2018-07-03 10:11:30.054 +00:00','1') RETURNING *;
INSERT INTO "Resolvers" ("id","type","field","requestMapping","responseMapping","createdAt","updatedAt","DataSourceId") VALUES (DEFAULT,'Mutation','updateNote','{"operation": "update","query": {"_id": "{{context.arguments.id}}"}, "update":{"title": "{{context.arguments.title}}","content": "{{context.arguments.content}}"},"options":{}}','{{toJSON context.result}}','2018-07-03 10:11:30.054 +00:00','2018-07-03 10:11:30.054 +00:00','1') RETURNING *;
INSERT INTO "Resolvers" ("id","type","field","requestMapping","responseMapping","createdAt","updatedAt","DataSourceId") VALUES (DEFAULT,'Mutation','deleteNote','{"operation": "remove","query": {"_id": "{{context.arguments.id}}"},"options":{}}','{{toJSON context.result}}','2018-07-03 10:11:30.054 +00:00','2018-07-03 10:11:30.054 +00:00','1') RETURNING *;
