#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset
set -o xtrace

VERSION=$(jq -r '.version' package.json)

BUNDLE_NAME="genenotebook_v$VERSION"

error_cleanup() {
  rm -rf $BUNDLE_NAME #$BUNDLE_NAME.tgz
}

trap error_cleanup ERR

#exit_cleanup() {
#  rm -rf $BUNDLE_NAME
#}

#trap exit_cleanup EXIT

meteor build --directory --allow-superuser $BUNDLE_NAME &&\
mv $BUNDLE_NAME/bundle/* $BUNDLE_NAME &&\
pushd $BUNDLE_NAME/programs/server &&\
npm install &&\
popd &&\
pushd scripts &&\
npm install &&\
popd &&\
cp -r scripts/* $BUNDLE_NAME &&\
cp -r testdata $BUNDLE_NAME &&\
cp -r LICENSE $BUNDLE_NAME #&&\
#tar cvzf $BUNDLE_NAME.tgz $BUNDLE_NAME 