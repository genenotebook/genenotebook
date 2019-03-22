#!/usr/bin/env bash

set -eo pipefail

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
meteor npm install 
popd 
pushd scripts 
meteor npm install 
popd 
cp -r scripts/* $BUNDLE_NAME 
cp -r testdata.tgz $BUNDLE_NAME 
cp -r LICENSE $BUNDLE_NAME 