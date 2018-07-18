# aerogear-data-sync-server

GraphQL based data sync server for mobile, with backend integration capabilities

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Getting Started

### Install Dependencies

```
npm install
```

### Start and Initialize the Database

Use docker compose to start the database.

```
docker-compose up
```

Initialize the database in another terminal.

```
npm run db:init
```

`npm run db:init` sets up the necessary tables and seeds the database with data useful for local development. **It is a destructive action.** It drops and recreates the tables every time.


### Start the Server

```
npm run dev
```

Go to http://localhost:8000/graphiql for an interactive query brower.
The graphql endpoint is at `/graphql`.
The subscriptions websocket is at `/subscriptions`.

### Inspecting Postgres

```
npm run db:shell
```

### Cleanup Postgres

The Postgres container started by `docker-compose` can be stopped with `Ctrl + C`. To remove it fully:

```
docker-compose rm

Going to remove aerogeardatasyncserver_postgres_1
Are you sure? [yN] y
```

### Running Unit Tests

```
npm run test:unit
```

### Running Integration tests:

Start the database first:
```
docker-compose up
```

Then, in a separate session, init the database (blank) and start the application:
```
npm run db:init
npm run dev
```

In another session, run the tests:
```
npm run test:integration
```

### Running all tests with CircleCi CLI

Install CircleCi CLI using this link: https://circleci.com/docs/2.0/local-cli/

Then execute these command locally:

```
# CircleCi CLI doesn't support workflows yet
circleci build --job unit_test
circleci build --job integration_test
```

### Debugging Individual Tests

The easiest way to debug tests is using Chrome DevTools. Use [inspect-process](https://npm.im/inspect-process) to easily launch a debugging session with Chrome DevTools.

```
npm install -g inspect-process
```

* In chrome go to [`chrome://inspect`](chrome://inspect/)
* Click on 'Open dedicated DevTools for Node.' This will open a new DevTools window.
* Click on 'add folder to workspace' and use the wizard to open this project.
* Go to the appropriate test file (or code that's being tested) and set a breakpoint
* Now run the individual test as follows:

```
inspect node_modules/ava/profile.js some/test/file.js
```

The DevTools window should automatically connect to the debugging session and execution should pause if some breakpoints are set.

# Configuration

This server requires a bunch of environment variables to be set. If they're not set, defaults for development will be used.

* `POSTGRES_DATABASE`: Name of the Postgres database. Defaults to `aerogear_data_sync_db`
* `POSTGRES_USERNAME`: Username to use when connecting Postgres. Defaults to `postgresql`
* `POSTGRES_PASSWORD`: Password to use when connecting Postgres. Defaults to `postgres`
* `POSTGRES_HOST`: Postgres host name. Defaults to `127.0.0.1`
* `POSTGRES_PORT`: Postgres port. Defaults to `5432`
* `SCHEMA_LISTENER_CONFIG`: Configuration of the config listening mechanism. Defaults to listening to a Postgres channel.
   Value of this environment variable must be a base64 encoded JSON. See below for an example.
 
```
$ echo '
{
  "type": "postgres",
  "config": {
    "channel": "aerogear-data-sync-config",
    "database": "aerogear_data_sync_db",
    "username": "postgresql",
    "password": "postgres",
    "host": "127.0.0.1",
    "port": "5432" 
  } 
}
' | base64 --wrap=0

> CnsKICAidHlwZSI6ICJwb3N0Z3JlcyIsCiAgImNvbmZpZyI6IHsKICAgICJjaGFubmVsIjogImFlcm9nZWFyLWRhdGEtc3luYy1jb25maWciLAogICAgImRhdGFiYXNlIjogImFlcm9nZWFyX2RhdGFfc3luY19kYiIsCiAgICAidXNlcm5hbWUiOiAicG9zdGdyZXNxbCIsCiAgICAicGFzc3dvcmQiOiAicG9zdGdyZXMiLAogICAgImhvc3QiOiAiMTI3LjAuMC4xIiwKICAgICJwb3J0IjogIjU0MzIiIAogIH0gCn0KCg==
```
Currently only Postgres channel listening is supported.


## Running on Kubernetes

TODO

## Architecture

The baseline architecture is shown below:

![Initial Data Sync Architecture](./initial_architecture_flow.png)

1. The GraphQL Data Schema, Resolvers etc.. are defined in the Data Sync Admin UI
2. All this config is deployed to the Data Sync GraphQL Server
3. The developer generates typed Models for use in their App based on the schema defined
4. The developer executes queries, mutations & subsdcriptions in their App, which uses the Apollo GraphQL client to talk to the server. The Apollo GraphQL Client is auto configured by the AeroGear SDK e.g. it knows what the Data Sync GraphQL Server url is.
5. The Data Sync GraphQL Server executes the corresponding resolvers for queries, mutations & subscriptions.
6. Configured Authentication & Autohorizatin checks are applied
7. Logging & Metrics data is gathered from the Server & connected Clients


## Memeolist

To start the application with MemeoList schema and queries run
```
npm run db:init:memeo
npm run dev:memeo
```