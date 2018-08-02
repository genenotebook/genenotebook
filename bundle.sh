#!/usr/bin/env bash

set -exo pipefail

VERSION=$(jq -r '.version' package.json)

BUNDLE_NAME="genenotebook_v$VERSION"

meteor build --allow-superuser --architecture os.linux.x86_64 --server-only --directory $BUNDLE_NAME 
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