#!/bin/sh


DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

source $DIR/dev_env.sh

node $DIR/sequelize_models.js

docker exec postgres psql -U postgres -f /tmp/examples/create_example_data.sql