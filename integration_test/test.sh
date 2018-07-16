#!/usr/bin/env bash

echo "Stopping and removing existing Postgres container, if exists"
docker stop sync_postgres_integration_test || true && docker rm sync_postgres_integration_test || true

echo "Starting Postgres container"
docker run --name sync_postgres_integration_test\
  -e POSTGRES_USER=postgresql -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=aerogear_data_sync_db\
  --detach\
  --rm\
  postgres:9.6


echo "Executing tests"



echo "Stopping and removing Postgres container"
docker stop sync_postgres_integration_test