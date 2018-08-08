# aerogear-data-sync-server

GraphQL based data sync server for mobile, with backend integration capabilities

[![CircleCI](https://circleci.com/gh/aerogear/data-sync-server.svg?style=svg)](https://circleci.com/gh/aerogear/data-sync-server)
[![Coverage Status](https://coveralls.io/repos/github/aerogear/data-sync-server/badge.svg)](https://coveralls.io/github/aerogear/data-sync-server)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Getting Started

### Install Dependencies

```
npm install
```

### Start and Initialize the Database

Use docker compose to start the database(s).

```
docker-compose -p aerogeardatasyncserver up
```

There are 2 Postgres instances defined in docker-compose configuration:
1. For storing the configuration of the sync server itself
2. For storing the [Memeolist](#whats-memeolist) data.

Since docker-compose is only used with development, starting up the Postgres instance for [Memeolist](#whats-memeolist)
will not cause any harm. 

Initialize the database in another terminal.

```
# no sample schema/resolvers
npm run db:init

# sample schema/resolvers for memeolist - in-memory data source
npm run db:init:memeo:inmem

# sample schema/resolvers for memeolist - Postgres data source
npm run db:init:memeo:postgres
```

`npm run db:init*` commands set up the necessary tables.  **Those are destructive actions.** 
They drop and recreate the tables every time.

`npm run db:init:memeo:*` commands are useful for local development which and seed the database with config and tables
for [Memeolist](#whats-memeolist) sample application. 

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
docker-compose -p aerogeardatasyncserver rm

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
docker-compose -p aerogeardatasyncserver up
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

### Running Individual Tests

Assuming you have `npm@5.2.0` or greater you can do the following:

```
npx ava /path/to/test.js
```

`npx` will ensure the correct version of ava (specified in package.json) is used.

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

* `AUDIT_LOGGING`:   : If true, audit logs of resolver operations will be logged to stdout. Defaults to true.
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
    "user": "postgresql",
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

### What's Memeolist?

Memeolist is an application where AeroGear team targets testing AeroGear mobile services and SDKs on it.

You can see the specification for it here: https://github.com/aerogear/proposals/blob/master/dogfood.md 

There is some tooling adjusted to create Memeolist app's backend within the project.

### Memeolist - In memory 

To start the application with MemeoList schema and queries with an in-memory data source, run these commands:
```
docker-compose -p aerogeardatasyncserver up
npm run db:init:memeo:inmem
npm run dev:memeo
```

### Memeolist - Postgres 

To start the application with MemeoList schema and queries with an Postgres source, run these commands:
```
docker-compose -p aerogeardatasyncserver up
npm run db:init:memeo:postgres
npm run dev:memeo
``` 