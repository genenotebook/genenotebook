import './publications.js';

/**
 * Import these methods here so they can be used with the
 * Meteor.call('methodName') syntax.
 * This is crucial to be able to call them with the asteroid
 * ddp connection in the data-loading scripts
 */
import './transcriptomes/addTranscriptome.js';
import './transcriptomes/updateSampleInfo.js';
import './transcriptomes/updateReplicaGroup.js';

import './genomes/addGenome.js';
import './genomes/updateGenome.js';
import './genomes/removeGenome.js';
import './genomes/addAnnotationTrack.js';
import './genomes/removeAnnotationTrack.js';

import './genes/addInterproscan.js';
import './genes/eggnog/addEggnog.js'
import './genes/addOrthogroupTrees.js';
import './genes/downloadGenes.js';
import './genes/scanGeneAttributes.js';
import './genes/updateAttributeInfo.js';
import './genes/updateGene.js';

import './blast/makeblastdb.js';
import './blast/removeblastdb.js';
import './blast/submitblastjob.js';

import './users/users.js';
import './users/getUserName.js';

import './methods/methods.js';
import './methods/getQueryCount.js';
import './methods/list.js';
import './methods/getVersion.js';

// import the following so that jobs can start running
import './jobqueue/process-interproscan.js';
import './jobqueue/process-makeBlastDb.js';
import './jobqueue/process-blast.js';
import './jobqueue/process-download.js';
import './jobqueue/process-addGenome.js';
import './jobqueue/process-eggnog.js'
