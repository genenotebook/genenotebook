#!/usr/bin/env bash

set -eox pipefail

VERSION=$(jq -r '.version' package.json)

BUNDLE_NAME="genenotebook_v$VERSION"

if [ -d $BUNDLE_NAME ]
then
  echo "Removing existing folder $BUNDLE_NAME"
  rm -rf $BUNDLE_NAME
fi

meteor build $BUNDLE_NAME --server-only --directory
mv $BUNDLE_NAME/bundle/* $BUNDLE_NAME
pushd $BUNDLE_NAME/programs/server
ls -l
jq . package.json
chmod 775 npm-shrinkwrap.json package.json
npm install
popd
pushd cli
npm install
popd
cp -r cli/* $BUNDLE_NAME
jq ".version = $(jq .version package.json)" cli/package.json > \
  $BUNDLE_NAME/package.json
cp -r tests/testdata.tgz $BUNDLE_NAME
cp -r LICENSE $BUNDLE_NAME
