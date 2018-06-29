#!/bin/sh

APP_NAME = data-sync-server

DOCKER_MASTER_TAG = aerogear/$(APP_NAME):master

docker login --username $(DOCKERHUB_USERNAME) --password $(DOCKERHUB_PASSWORD)
docker push $(DOCKER_MASTER_TAG)
