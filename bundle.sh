#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset
set -o xtrace

error_cleanup() {
  rm -rf genenotebook_bundle genenotebook_bundle.tgz
}

trap error_cleanup ERR

exit_cleanup() {
  rm -rf genenotebook_bundle
}

trap exit_cleanup EXIT

meteor build --directory --server-only genenotebook_bundle &&\
mv genenotebook_bundle/bundle/* genenotebook_bundle &&\
pushd genenotebook_bundle/programs/server &&\
npm install &&\
popd &&\
cp -r scripts genenotebook_bundle &&\
cp $0 genenotebook_bundle/settings.json &&\
tar cvzf genenotebook_bundle.tgz genenotebook_bundle 