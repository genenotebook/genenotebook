#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset
set -o xtrace

if [ $# -eq 0 ]
	then
	echo "WARNING: no settings file provided. Using settings.json"
	if [ ! -f settings.json ]
		then
		echo "ERROR: settings.json not found!"
		exit 1
	else
		SETTINGS=settings.json
	fi
else
	if [ ! -f "$1" ]
		then
		echo "ERROR: $1 not found!"
		exit 1
	else
		SETTINGS=$1
	fi
fi


MONGO_URL=$(jq -r .private.mongoUrl $SETTINGS)
ROOT_URL=$(jq -r .private.rootUrl $SETTINGS)
PORT=$(jq -r .private.port $SETTINGS)
NODE_SETTINGS=$(jq -r '[.private.nodeSettings | to_entries[] | .key + "=" +  (.value | tostring)] | join(" ")' $SETTINGS)
METEOR_SETTINGS=$(cat $SETTINGS)

(
	export METEOR_SETTINGS=$METEOR_SETTINGS
	export MONGO_URL=$MONGO_URL
	export ROOT_URL=$ROOT_URL
	export PORT=$PORT
	node $NODE_SETTINGS main.js
)