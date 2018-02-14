import './publications.js';

//Import these methods here so they can be used with the Meteor.call('methodName') syntax.
//This is crucial to be able to call them with the asteroid ddp connection in the data-loading scripts
import './transcriptomes/add_transcriptome.js';
import './transcriptomes/updateSampleInfo.js';

import './genomes/add_reference.js';
import './genomes/add_gff.js';
import './genomes/updateTrackPermissions.js';

import './genes/interproscan.js';
import './genes/add_interproscan.js';
import './genes/add_orthogroup_trees.js';
import './genes/download_genes.js';

import './blast/makeblastdb.js';
import './blast/hasblastdb.js';
import './blast/removeblastdb.js';
import './blast/submitblastjob.js';
import './users/users.js';

import './methods/methods.js';
//import './methods/blast.js';
import './methods/list.js';

//import the following so that jobs can start running
import './jobqueue/process-interproscan.js';
import './jobqueue/process-makeBlastDb.js';
import './jobqueue/process-blast.js';
import './jobqueue/process-download.js';