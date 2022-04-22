#!/usr/bin/env node

import { GeneSchema } from '../imports/api/genes/geneCollection';

function extractSchemas() {
  console.log('extracting schemas');
  console.log({ GeneSchema });
}

extractSchemas();
