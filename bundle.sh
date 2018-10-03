#!/usr/bin/env bash

set -exo pipefail

VERSION=$(jq -r '.version' package.json)

BUNDLE_NAME="genenotebook_v$VERSION"

meteor build $BUNDLE_NAME --server-only --directory 
mv $BUNDLE_NAME/bundle/* $BUNDLE_NAME 
pushd $BUNDLE_NAME/programs/server 
npm install 
popd 
pushd scripts 
npm install 
popd 
cp -r scripts/* $BUNDLE_NAME 
cp -r testdata $BUNDLE_NAME 
cp -r LICENSE $BUNDLE_NAME 