# AeroGear Sync Server

[![circle-ci](https://img.shields.io/circleci/project/github/aerogear/data-sync-server/master.svg)](https://circleci.com/gh/aerogear/data-sync-server)
[![Coverage Status](https://coveralls.io/repos/github/aerogear/data-sync-server/badge.svg)](https://coveralls.io/github/aerogear/data-sync-server)
[![License](https://img.shields.io/:license-Apache2-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

GraphQL based data sync server for mobile, with backend integration capabilities

## Architecture

The baseline architecture is shown below:

![Initial Data Sync Architecture](./initial_architecture_flow.png)

1. The [GraphQL](http://graphql.github.io/) Data Schema, Resolvers etc.. are defined in the [Data Sync UI](https://github.com/aerogear/data-sync-ui)
1. All this config is deployed to the Data Sync GraphQL Server
1. The developer generates typed Models for use in their App based on the schema defined
1. The developer executes queries, mutations & subsdcriptions in their App, which uses the [Apollo GraphQL client](https://www.apollographql.com/client/) to talk to the server. [The Apollo GraphQL Client](https://www.apollographql.com/client/) is auto configured by the AeroGear SDK e.g. it knows what the Data Sync GraphQL Server url is.
1. The Data Sync GraphQL Server executes the corresponding resolvers for queries, mutations & subscriptions.
1. Configured Authentication & Autohorizatin checks are applied
1. Logging & Metrics data is gathered from the Server & connected Clients

## Configuration

This server requires a bunch of environment variables to be set. If they're not set, defaults for development will be used.

* `AUDIT_LOGGING`:   : If true, audit logs of resolver operations will be logged to stdout. Defaults to true.
* `POSTGRES_DATABASE`: Name of the Postgres database. Defaults to `aerogear_data_sync_db`
* `POSTGRES_USERNAME`: Username to use when connecting Postgres. Defaults to `postgresql`
* `POSTGRES_PASSWORD`: Password to use when connecting Postgres. Defaults to `postgres`
* `POSTGRES_HOST`: Postgres host name. Defaults to `127.0.0.1`
* `POSTGRES_PORT`: Postgres port. Defaults to `5432`
* `SCHEMA_LISTENER_CONFIG`: Configuration of the config listening mechanism. Defaults to listening to a Postgres channel.
   Value of this environment variable must be a base64 encoded JSON. See below for an example.
 
```shell
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

## Getting Started

1. Install Dependencies

   ```shell
   npm install
   ```

1. Start and initialize the database

   Use docker compose to start the database(s).

   ```shell
   docker-compose -p aerogeardatasyncserver up
   ```

   There are 2 Postgres instances defined in docker-compose configuration:

   1. For storing the configuration of the sync server itself
   1. For storing the [Memeolist](#whats-memeolist) data.

   Since docker-compose is only used with development, starting up the Postgres instance for [Memeolist](#whats-memeolist) will not cause any harm. 

1. Initialize the database.

   **Those are destructive actions.** They drop and recreate the tables every time.

   No sample schema/resolvers

   ```shell   
   npm run db:init
   ```

   Commands below are useful for **local development** which and seed the database with config and tables
for [Memeolist](#whats-memeolist) sample application. 

   Sample schema/resolvers for memeolist - in-memory data source
   ```shell
   npm run db:init:memeo:inmem
   ```

   Sample schema/resolvers for memeolist - Postgres data source
   ```shell
   npm run db:init:memeo:postgres
   ```

1. Start the Server

   ```shell
   npm run dev
   ```

1. Go to http://localhost:8000/graphiql for an interactive query brower.

   The **graphql endpoint** is at `/graphql`.   
   The **subscriptions websocket** is at `/subscriptions`.

## Postgres

### Inspecting 

```shell
npm run db:shell
```

### Cleanup Postgres

The Postgres container started by `docker-compose` can be stopped with `Ctrl + C`. To remove it fully:

```shell
docker-compose -p aerogeardatasyncserver rm

Going to remove aerogeardatasyncserver_postgres_1
Are you sure? [yN] y
```

## Tests

### Running Unit Tests

```shell
npm run test:unit
```

### Running Integration tests:

   Start the database first:

   ```shell
   docker-compose -p aerogeardatasyncserver up
   ```

   In another session, run the tests:
   
   ```shell
   npm run test:integration
   ```

### Running all tests with CircleCi CLI

1. Install [CircleCi CLI](https://circleci.com/docs/2.0/local-cli/)
1. Execute these command locally:

   ```shell
   # CircleCi CLI doesn't support workflows yet
   circleci build --job unit_test
   circleci build --job integration_test
   ```

### Running Individual Tests

Assuming you have `npm@5.2.0` or greater you can do the following:

```shell
npx ava /path/to/test.js
```

`npx` will ensure the correct version of ava (specified in package.json) is used.

### Debugging Individual Tests

The easiest way to debug tests is using [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/). Use [inspect-process](https://npm.im/inspect-process) to easily launch a debugging session with Chrome DevTools.

```shell
npm install -g inspect-process
```

1. In chrome go to [`chrome://inspect`](chrome://inspect/)
1. Click on 'Open dedicated DevTools for Node.' This will open a new DevTools window.
1. Click on 'add folder to workspace' and use the wizard to open this project.
1. Go to the appropriate test file (or code that's being tested) and set a breakpoint
1. Now run the individual test as follows:

```shell
inspect node_modules/ava/profile.js some/test/file.js
```

The DevTools window should automatically connect to the debugging session and execution should pause if some breakpoints are set.

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