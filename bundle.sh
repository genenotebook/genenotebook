#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset
#set -o xtrace

error_cleanup() {
  rm -rf genenotebook_bundle genenotebook_bundle.tgz
}

trap error_cleanup ERR

exit_cleanup() {
  rm -rf genenotebook_bundle
}

trap exit_cleanup EXIT

if [ $# -eq 0 ]
	then
	echo "WARNING: no config file provided. Using example_config.json"
	if [ ! -f example_config.json ]
		then
		echo "ERROR: example_config.json not found!"
		exit 1
	else
		CONFIG=example_config.json
	fi
else
	if [ ! -f "$1" ]
		then
		echo "ERROR: $1 not found!"
		exit 1
	else
		CONFIG=$1
	fi
fi

meteor build --directory genenotebook_bundle &&\
mv genenotebook_bundle/bundle/* genenotebook_bundle &&\
pushd genenotebook_bundle/programs/server &&\
npm install &&\
popd &&\
pushd scripts &&\
npm install &&\
popd &&\
cp -r scripts/* genenotebook_bundle &&\
cp $CONFIG genenotebook_bundle/config.json &&\
cp -r testdata genenotebook_bundle &&\
tar cvzf genenotebook_bundle.tgz genenotebook_bundle 