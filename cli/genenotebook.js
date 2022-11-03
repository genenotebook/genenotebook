#!/usr/bin/env node
/* eslint-disable no-underscore-dangle, no-console */

const commander = require('commander');
const { Tail } = require('tail');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const asteroid = require('asteroid');
const WebSocket = require('ws');

const pkginfo = require('./package.json');

const logger = {
  log(msg) {
    console.log(`## LOG:   ${new Date().toISOString()} ${msg}`);
  },
  error(msg) {
    console.error(`## ERROR: ${new Date().toISOString()} ${msg}`);
  },
};

function customExitOverride(cmd) {
  return (err) => {
    if (
      err.code === 'commander.missingMandatoryOptionValue' ||
      err.code === 'commander.missingArgument'
    ) {
      cmd.help();
    }
  };
}

class GeneNoteBookConnection {
  constructor({ port, username, password }) {
    const Connection = asteroid.createClass();
    this.connection = new Connection({
      endpoint: `ws://localhost:${port}/websocket`,
      SocketConstructor: WebSocket,
      reconnectInterval: 1000,
    });
    this.username = username;
    this.password = password;
  }

  async call(methodName, methodOpts) {
    this.connection
      .loginWithPassword({
        username: this.username,
        password: this.password,
      })
      .then(() => {
        logger.log(`Established connection to ${this.connection.endpoint}`);
        return this.connection.call(methodName, methodOpts);
      })
      .then(({ result, jobId, jobStatus }) => {
        if (jobId) {
          logger.log(`Job ID ${jobId}`);
        } else if (result) {
          const { nInserted } = result;
          logger.log(
            `Server method ${methodName} succesfully inserted ${nInserted} elements`
          );
        } else if (jobStatus) {
          logger.log(`Job status: ${jobStatus}`);
        } else {
          logger.error('Undefined server response');
        }
        this.connection.disconnect();
      })
      .catch((error) => {
        logger.error(error);
        console.log(error);
        this.connection.disconnect();
      });
  }
}

function checkMongoLog(logPath) {
  const tail = new Tail(logPath);
  tail.on('line', (line) => {
    const parts = line.split(' ');
    const status = parts[1];
    if (status === 'E') {
      logger.error(`MongoDB error: ${parts.slice(2).join(' ')}`);
      process.exit(1);
    }
  });
}

function startMongoDaemon(
  dbPath,
  mongoPort,
  dbStartupTimeout = 10000,
  dbCacheSizeGB = null
) {
  const dataFolderPath = `${dbPath}/data`;
  const logFolderPath = `${dbPath}/log`;
  execFileSync('mkdir', ['-p', dataFolderPath, logFolderPath]);
  const logPath = `${dbPath}/log/mongod.log`;

  logger.log(`Using DB path: ${dbPath}`);
  logger.log(`MongoDB data files are in ${dataFolderPath}`);
  logger.log(`MongoDB logs are in ${logFolderPath}`);
  logger.log('Starting MongoDB daemon');
  const MONGO_URL = `mongodb://localhost:${mongoPort}/genenotebook`;
  const mongodOptions = {
    '--port': mongoPort,
    '--dbpath': dataFolderPath,
    '--logpath': logPath,
  };

  if (dbCacheSizeGB !== null) {
    mongodOptions['--wiredTigerCacheSizeGB'] = dbCacheSizeGB;
  }
  const mongodOptionArray = Object.entries(mongodOptions).flat();
  logger.log(
    `Starting mongod with the following options: ${mongodOptionArray}`
  );

  const mongoDaemon = spawn('mongod', mongodOptionArray);

  mongoDaemon.on('error', (err) => {
    logger.error(err);
  });

  mongoDaemon.stderr.on('data', (chunk) => {
    logger.error(chunk.toString('utf8'));
  });

  mongoDaemon.stdout.on('data', (chunk) => {
    const msg = chunk.toString('utf8').split(' ').slice(5).join(' ');
    logger.log(`MongoDB message: ${msg}`);
    checkMongoLog(logPath);
  });

  const connection = {
    mongoDaemon,
    MONGO_URL,
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(connection);
    }, dbStartupTimeout);
  });
}

async function startGeneNoteBook(cmd) {
  const {
    port,
    rootUrl,
    mongoUrl,
    dbPath,
    mongoPort = 27017,
    dbStartupTimeout,
    dbCacheSizeGB,
    storagePath
  } = cmd.opts();
  const PORT = parseInt(port, 10) || 3000;
  const ROOT_URL = rootUrl || `http://localhost:${PORT}`;
  const STORAGE_PATH = storagePath || 'assets/app/uploads';
  const opts = { PORT, ROOT_URL, GNB_VERSION: pkginfo.version, STORAGE_PATH };

  if (mongoUrl) {
    if (dbPath) {
      throw new Error('--db-path and --mongo-url are mutually exclusive');
    }
    Object.assign(opts, { MONGO_URL: mongoUrl });
  } else {
    const { MONGO_URL, mongoDaemon } = await startMongoDaemon(
      path.resolve(dbPath || './db'),
      mongoPort,
      dbStartupTimeout,
      dbCacheSizeGB,
    );
    Object.assign(opts, { MONGO_URL });
    process.on('exit', () => {
      logger.log('Shutting down mongo daemon');
      mongoDaemon.kill();
    });
  }
  Object.assign(process.env, opts);
  // eslint-disable-next-line global-require, import/no-unresolved
  require('./main.js');
}

const program = new commander.Command();

program
  .version(pkginfo.version, '-v, --version')
  .usage('<command>')
  .exitOverride(customExitOverride(program));

// run
program
  .command('run')
  .description('Run a GeneNoteBook server')
  .usage('[options]')
  .option(
    '--port [port]',
    'Web server port on which to serve GeneNoteBook. Default: 3000'
  )
  .option(
    '-m, --mongo-url [url]',
    'URL of running MongoDB daemon and database name, for example mongodb://localhost:27017/genenotebook (Mutually exclusive with --dbpath)'
  )
  .option(
    '-d, --db-path [path]',
    'Folder where DB files will be stored. Default: ./db.' +
      ' (Mutually exclusive with --mongo-url)'
  )
  .option(
    '--mongo-port [port]',
    'Port on which the mongo daemon will serve. Default: 27017'
  )
  .option(
    '--db-startup-timeout [timeout (ms)]',
    'Timeout to wait for mongo daemon to start. Default 10,000ms'
  )
  .option(
    '--db-cache-size-gb [cache size (GB)]',
    `Cache size for MongoDB in GB. Default is max(0.6*maxRAM - 1, 1GB). 
    Specify a lower value if your mongodb daemon is using to much RAM`
  )
  .option(
    '-r, --root-url [url]',
    'Root URL on which GeneNoteBook will be accessed. Default: http://localhost'
  )
  .option(
    '-s, --storage-path [path]',
    'Path where the uploaded files will be stored. Default: assets/app/uploads'
  )
  .action((_, command) => {
    startGeneNoteBook(command);
  });

// add
const add = program
  .command('add <command>')
  .description('Add data to a running GeneNoteBook server')
  .usage('<command>');

// add genome
const addGenome = add.command('genome');

addGenome
  .description('Add reference genome')
  .usage('[options] <genome fasta file>')
  .arguments('<file>')
  .option('-u, --username <username>', 'GeneNoteBook admin username. REQUIRED')
  .option('-p, --password <password>', 'GeneNoteBook admin password. REQUIRED')
  .option(
    '-n, --name [name]',
    'Reference genome name. Default: fasta file name'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .action((file, { username, password, name, port = 3000 }) => {
    if (typeof file !== 'string') addGenome.help();
    const fileName = path.resolve(file);

    if (!(fileName && username && password)) {
      addGenome.help();
    }
    const genomeName = name || fileName.split('/').pop();

    new GeneNoteBookConnection({ username, password, port }).call('addGenome', {
      genomeName,
      fileName,
      async: false,
    });
  })
  .on('--help', () => {
    console.log(`
Example:
    genenotebook add genome -u admin -p admin -n test testdata.fasta
    `);
  })
  .exitOverride(customExitOverride(addGenome));

// add annotation
const addAnnotation = add.command('annotation');

addAnnotation
  .description(
    'Add fasta formatted reference genome to a running GeneNoteBook server'
  )
  .usage('[options] <annotation gff3 file>')
  .arguments('<file>')
  .option('-u, --username <username>', 'GeneNoteBook admin username')
  .option('-p, --password <password>', 'GeneNoteBook admin password')
  .option(
    '-n, --genome-name <name>',
    'Reference genome name to which the annotation should be added'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .option('-v, --verbose', 'Verbose warnings during GFF parsing')
  .action(
    (
      file,
      { username, password, genomeName, port = 3000, verbose = false }
    ) => {
      if (typeof file !== 'string') addAnnotation.help();
      const fileName = path.resolve(file);

      if (!(fileName && username && password)) {
        addAnnotation.help();
      }

      new GeneNoteBookConnection({ username, password, port }).call(
        'addAnnotationTrack',
        { fileName, genomeName, verbose }
      );
    }
  )
  .exitOverride(customExitOverride(addAnnotation));

// Add Diamond.
const addDiamond = add.command('diamond');

addDiamond
  .description(
    `Add Diamond output formats, including BLAST pairwise, tabular and XML to a
running GeneNoteBook server.`
  )
  .usage('[options] <Diamond output formats .xml, .txt file>')
  .arguments('<file>')
  .requiredOption(
    '-u, --username <adminUsername>',
    'GeneNoteBook admin username'
  )
  .requiredOption(
    '-p, --password <adminPassword>',
    'GeneNoteBook admin password'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .option(
    '-fmt, --format [parser]',
    `Choose a parser for the diamond output format. Parses .xml, .txt
    extensions.`
  )
  .option(
    '-alg, --algorithm [algorithm]',
    'The algorithm used to compare the sequences to a database (e.g: blastx, blastp).'
  )
  .option(
    '-mtx, --matrix [matrix]',
    `The matrix of substitution used for sequence alignment (e.g:
    BLOSUM90, BLOSUM80, PAM100).`
  )
  .option(
    '-db --database [database]',
    `The database used to compare the sequences (e.g: Non-reundant protein
    sequences (nr)).`
  )
  .action(
    (
      file,
      { username, password, port = 3000, format, algorithm, matrix, database }
    ) => {
      if (typeof file !== 'string') addDiamond.help();

      const fileName = path.resolve(file);
      if (!(fileName && username && password)) {
        addDiamond.help();
      }

      const parserAccepted = ['xml', 'txt'];
      const extensionFile = path.extname(file).replace(/\./g, '');
      let parserType = format;

      if (parserType) {
        if (!parserAccepted.includes(parserType)) {
          logger.error(`
Error: unknow format : ${parserType}. To specify --format, choose a format
compatible with diamond e.g : "xml", "txt".`);
          addDiamond.help();
        }
      } else if (parserAccepted.includes(extensionFile)) {
        parserType = extensionFile;
      } else {
        logger.error(`
Error : unknow file extension : ${extensionFile}. Must specify --extension when
file extension is not "xml", "txt"`);
        addDiamond.help();
      }

      new GeneNoteBookConnection({ username, password, port }).call(
        'addSimilarSequence',
        {
          fileName,
          parser: parserType,
          program: 'diamond',
          algorithm: algorithm,
          matrix: matrix,
          database: database,
        }
      );
    }
  )
  .on('--help', () => {
    console.log(`
Example:
    genenotebook add diamond mmucedo.xml -u admin -p admin
or
    genenotebook add diamond mmucedo.txt --format txt --program blastp --matrix BLOSUM90 -db "Non-reundant protein sequences (nr)" -u admin -p admin
    `);
  })
  .exitOverride(customExitOverride(addDiamond));

// Add Blast.
const addBlast = add.command('blast');

addBlast
  .description(
    `Add BLAST output formats, including pairwise and XML to a
running GeneNoteBook server.`
  )
  .usage('[options] <Blast output formats .xml, .txt file>')
  .arguments('<file>')
  .requiredOption(
    '-u, --username <adminUsername>',
    'GeneNoteBook admin username'
  )
  .requiredOption(
    '-p, --password <adminPassword>',
    'GeneNoteBook admin password'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .option(
    '-fmt, --format [parser]',
    'Choose a parser for the blast output format. Parses .xml, .txt extensions.'
  )
  .option(
    '-alg, --algorithm [algorithm]',
    'The algorithm used to compare the sequences to a database (e.g: blastx, blastp).'
  )
  .option(
    '-mtx, --matrix [matrix]',
    'The matrix of substitution used for sequence alignment (e.g: BLOSUM90, BLOSUM80, PAM100).'
  )
  .option(
    '-db --database [database]',
    'The database used to compare the sequences (e.g: Non-reundant protein sequences (nr)).'
  )
  .action(
    (
      file,
      { username, password, port = 3000, format, algorithm, matrix, database }
    ) => {
      if (typeof file !== 'string') addBlast.help();

      const fileName = path.resolve(file);
      if (!(fileName && username && password)) {
        addBlast.help();
      }

      const parserAccepted = ['xml', 'txt'];
      const extensionFile = path.extname(file).replace(/\./g, '');
      let parserType = format;

      if (parserType) {
        if (!parserAccepted.includes(parserType)) {
          logger.error(`
Error: unknow format : ${parserType}. To specify --format, choose a format
compatible with diamond e.g : "xml", "txt".`);
          addBlast.help();
        }
      } else if (parserAccepted.includes(extensionFile)) {
        parserType = extensionFile;
      } else {
        logger.error(`
Error : unknow file extension : ${extensionFile}. Must specify --extension when
file extension is not "xml", "txt"`);
        addBlast.help();
      }

      new GeneNoteBookConnection({ username, password, port }).call(
        'addSimilarSequence',
        {
          fileName,
          parser: parserType,
          program: 'blast',
          algorithm: algorithm,
          matrix: matrix,
          database: database,
        }
      );
    }
  )
  .on('--help', () => {
    console.log(`
Example:
    genenotebook add blast mmucedo.xml -u admin -p admin
or
    genenotebook add blast mmucedo.txt --format txt --algorithm blastp --matrix BLOSUM90 -db "Non-reundant protein sequences (nr)" -u admin -p admin
    `);
  })
  .exitOverride(customExitOverride(addBlast));

// add transcriptome
const addTranscriptome = add.command('transcriptome');

addTranscriptome
  .description(
    'Add Kallisto quantified gene expression to a running GeneNoteBook server'
  )
  .usage('[options] <Kallisto abundance.tsv file>')
  .arguments('<file>')
  .option('-u, --username <username>', 'GeneNoteBook admin username')
  .option('-p, --password <password>', 'GeneNoteBook admin password')
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .option('-s, --sample-name <sample name>', 'Unique sample name')
  .option(
    '-r, --replica-group <replica group>',
    'Identifier to group samples that belong to the same experiment'
  )
  .option(
    '-d, --sample-description <description>',
    'Description of the experiment'
  )
  .action((file, { username, password, port = 3000, ...opts }) => {
    if (typeof file !== 'string') addTranscriptome.help();
    const fileName = path.resolve(file);
    const sampleName = opts.sampleName || fileName;
    const replicaGroup = opts.replicaGroup || fileName;
    const description = opts.sampleDescription || 'description';

    if (!(fileName && username && password)) {
      program.help();
    }
    new GeneNoteBookConnection({ username, password, port }).call(
      'addTranscriptome',
      {
        fileName,
        sampleName,
        replicaGroup,
        description,
      }
    );
  })
  .exitOverride(customExitOverride(addTranscriptome));

// Add interproscan file
const addInterproscan = add.command('interproscan');

addInterproscan
  .description('Add InterProScan results to a running GeneNoteBook server')
  .usage('[options] <InterProScan gff3 or tsv output file>')
  .arguments('<file>')
  .requiredOption(
    '-u, --username <adminUsername>',
    'GeneNoteBook admin username'
  )
  .requiredOption(
    '-p, --password <adminPassword>',
    'GeneNoteBook admin password'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .option(
    '--format [parser]',
    `Choose a parser for the interproscan output files. Parses .gff3 and .tsv
    extensions.`
  )
  .action((file, { username, password, port = 3000, format }) => {
    if (typeof file !== 'string') addInterproscan.help();

    const fileName = path.resolve(file);
    if (!(fileName && username && password)) {
      addInterproscan.help();
    }

    const parserAccepted = ['tsv', 'gff3', 'xml'];
    const extensionFile = path.extname(file).replace(/\./g, '');
    let parserType = format;

    if (parserType) {
      if (!parserAccepted.includes(parserType)) {
        logger.error(`
Error: unknow format : ${parserType}. To specify --format, choose a format
compatible with InterProScan e.g : "gff3", "tsv" or "xml".`);
        addInterproscan.help();
      }
    } else if (parserAccepted.includes(extensionFile)) {
      parserType = extensionFile;
    } else {
      logger.error(`
Error : unknow file extension : ${extensionFile}. Must specify --format when
file extension is not "tsv", "gff3" or "xml".`);
      addInterproscan.help();
    }

    new GeneNoteBookConnection({ username, password, port }).call(
      'addInterproscan',
      {
        fileName,
        parser: parserType,
      }
    );
  })
  .on('--help', () => {
    console.log(`
Example:
    genenotebook add interproscan testdata.iprscan.gff3 -u admin -p admin
or
    genenotebook add interproscan testdata.iprscan --format tsv -u admin -p admin
    `);
  })
  .exitOverride(customExitOverride(addInterproscan));

// Add eggnog annotations file.
const addEggnog = add.command('eggnog');

addEggnog
  .description('Add EggNog-mapper results to a running GeneNoteBook server')
  .usage('[options] <EggNog-mapper tsv output file>')
  .arguments('<file>')
  .requiredOption(
    '-u, --username <adminUsername>',
    'GeneNoteBook admin username'
  )
  .requiredOption(
    '-p, --password <adminPassword>',
    'GeneNoteBook admin password'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .action((file, { username, password, port = 3000 }) => {
    if (typeof file !== 'string') addEggnog.help();

    const fileName = path.resolve(file);
    if (!(fileName && username && password)) {
      addEggnog.help();
    }

    new GeneNoteBookConnection({ username, password, port }).call('addEggnog', {
      fileName,
    });
  })
  .on('--help', () => {
    console.log(`
Example:
    genenotebook add eggnog eggnog_annotations.tsv -u admin -p admin
    `);
  })
  .exitOverride(customExitOverride(addEggnog));

// add orthogroups.
const addOrthogroups = add.command('orthogroups');

addOrthogroups
  .description(
    'Add Orthogroup phylogenetic trees to a running GeneNoteBook server'
  )
  .usage('[options] <Folder with (e.g. OrthoFinder) tree files>')
  .arguments('<folder>')
  .option(
    '-pfx, --prefixe [prefixe]',
    'List each proteome filenames as a name for that species contained in a file or folder.',
  )
  .option(
    '-l, --list [prefixe]',
    'List of each proteome filename as the name for that species enumerated by hand.',
  )
  .option(
    '-f, --force [force]',
    'Ignore the use of prefixes.',
  )
  .requiredOption('-u, --username <username>', 'GeneNoteBook admin username')
  .requiredOption('-p, --password <password>', 'GeneNoteBook admin password')
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .action((file, { prefixe, list, force, username, password, port = 3000 }) => {
    if (typeof file !== 'string') addOrthogroups.help();
    const folderName = path.resolve(file);
    const prefixes = (typeof list !== 'undefined' ? list : path.resolve(prefixe));

    if (!(folderName && username && password)) {
      addOrthogroups.help();
    }

    new GeneNoteBookConnection({ username, password, port }).call(
      'addOrthogroupTrees',
      {
        folderName,
        force,
        prefixes,
      },
    );
  })
  .on('--help', () => {
    console.log(`
Orthofinder will use each proteome filename as the name for that species.
However, Genotebook does not know the filename of each proteome if it is not
given in the parameter.

Example:

# In case you want to ignore the use of prefixes.
    genenotebook add orthogroups newicks/ --force -u admin -p admin

# Folder that contain the list of proteome filename e.g. :
#.
#├── genomes
#│   ├── Citrus_sinensis.fasta
#│   └── Somus_speciesus.fasta
#├── newicks
#│   ├── OG0000001_tree.txt
#│   └── OG0000002_tree.txt
    genenotebook add orthogroups newicks/ -pfx genomes/ -u admin -p admin

or

# A file that lists filename.
# for f in \`ls 2>/dev/null *{.fa,.faa,.fasta,.fas,.pep}\`; do echo -n "$f, " >> prfx-list.txt; done;
    genenotebook add orthogroups newicks/ -pfx prfx-list.txt -u admin -p admin

or

# Prefix with the list of filename (with or without extension)
    genenotebook add orthogroups newicks/ --list "Citrus_sinensis, Somus_speciesus" -u admin -p admin
`);
  })
  .exitOverride(customExitOverride(addOrthogroups));

// remove
const remove = program
  .command('remove <type>')
  .description('Remove data from a running GeneNoteBook server')
  .usage('<type>');

// remove genome
const removeGenome = remove.command('genome');
removeGenome
  .description('Remove genome from a running GeneNoteBook server')
  .action(() => {
    logger.error('Not implemented');
  });

// list
const list = program
  .command('list <type>')
  .description('List contents of a running GeneNoteBook server')
  .usage('<type>');

// list genomes
const listGenomes = list.command('genomes');
listGenomes
  .description('List available genomes in a running GeneNoteBook server')
  .usage('')
  .requiredOption('-u, --username <username>', 'Admin username')
  .requiredOption('-p, --password <password>', 'Admin password')
  .action(() => {
    logger.error('Not implemented');
  });

// add
const user = program
  .command('user <command>')
  .description(
    'Add/modify/delete user profiles of a running genenotebook server'
  )
  .usage('<command>');

const setUserPassword = user.command('setpassword');

setUserPassword
  .description('Set the password of a specific user')
  .usage('[options]')
  .arguments('<userName> <newPassword>')
  .requiredOption(
    '-u, --username <adminUsername>',
    'GeneNoteBook admin username'
  )
  .requiredOption(
    '-p, --password <adminPassword>',
    'GeneNoteBook admin password'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .action((userName, newPassword, { username, password, port = 3000 }) => {
    if (!(userName && newPassword && username && password)) {
      setUserPassword.help();
    }

    new GeneNoteBookConnection({ username, password, port }).call(
      'setUsernamePassword',
      { userName, newPassword }
    );
  })
  .on('--help', () => {
    console.log(`
Example:
    genenotebook user setpassword -u admin -p admin username newpassword
    `);
  })
  .exitOverride(customExitOverride(setUserPassword));

// Create new user account.
const addUser = user.command('add');

addUser
  .description('Add a new user account')
  .usage('[option]')
  .requiredOption(
    '-u, --username <adminUsername>',
    'GeneNoteBook admin username'
  )
  .requiredOption(
    '-p, --password <adminPassword>',
    'GeneNoteBook admin password'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .option('-nu, --new-username [newUsername]', 'New username')
  .option('-np, --new-password [newPassword]', 'New password')
  .option('-e, --email [email]', 'New user email')
  .option('-f, --first-name [userFirstName]', 'New user first name')
  .option('-l, --last-name [userLastName]', 'New user last name')
  .option(
    '-r, --role [userRole]',
    'New user role e.g: registered, user, curator, admin. Default: registered'
  )
  .option(
    '-b, --bulk-file [bulkFile]',
    `JSON formatted file with account information to be added in bulk, mutually
    exclusive with any of -e -f -l -r`
  )
  .action(
    ({
      username,
      password,
      port = 3000,
      newUsername,
      newPassword,
      email,
      firstName,
      lastName,
      role,
      bulkFile,
    }) => {
      if (bulkFile) {
        if (
          newUsername ||
          newPassword ||
          email ||
          firstName ||
          lastName ||
          role
        ) {
          logger.error(`Bulk file operation is mutually exclusive with specifying 
          individual account information`);
          addUser.help();
        }
      } else if (!(newUsername && newPassword && username && password)) {
        addUser.help();
      }

      new GeneNoteBookConnection({ username, password, port }).call('addUser', {
        userName: newUsername,
        newPassword,
        emails: email,
        profile: {
          first_name: firstName,
          last_name: lastName,
        },
        role,
      });
    }
  )
  .on('--help', () => {
    console.log(`
Example:
    genenotebook user add newUserName newPassword -u admin -p admin
or
    genenotebook user add newUserName newPassword -e userMail -f userFirstName -l userLastName -r userRole -u admin -p admin
or
    genenotebook user add newUserName newPassword --email userMail --first-name userFirstName --last-name userLastName --role userRole -u admin -p admin
    `);
  })
  .exitOverride(customExitOverride(addUser));

// Remove a user account.
const removeUser = user.command('rm');

removeUser
  .description('Remove a user account')
  .usage('[option]')
  .arguments('<username>')
  .requiredOption(
    '-u, --username <adminUsername>',
    'GeneNoteBook admin username'
  )
  .requiredOption(
    '-p, --password <adminPassword>',
    'GeneNoteBook admin password'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .action((userName, { username, password, port = 3000 }) => {
    if (!(userName && username, password)) {
      removeUser.help();
    }

    new GeneNoteBookConnection({ username, password, port }).call(
      'removeUserAccount',
      { userName }
    );
  })
  .on('--help', () => {
    console.log(`
Example:
    genenotebook user rm userName -u admin -p admin
    `);
  })
  .exitOverride(customExitOverride(removeUser));

// Edit or update the information of a user account.
const editUser = user.command('edit');

editUser
  .description('Edit the information of a user account.')
  .usage('[option]')
  .arguments('<username>')
  .requiredOption(
    '-u, --username <adminUsername>',
    'GeneNoteBook admin username'
  )
  .requiredOption(
    '-p, --password <adminPassword>',
    'GeneNoteBook admin password'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .option('-e, --email [email]', 'User email')
  .option('-f, --first-name <userFirstName>', 'User first name')
  .option('-l, --last-name <userLastName>', 'User last name')
  .option(
    '-r, --role <userRole>',
    'User role e.g: registered, user, curator, admin'
  )
  .action((userName, { username, password, port = 3000, ...opts }) => {
    if (!(userName && username, password)) {
      editUser.help();
    }

    new GeneNoteBookConnection({ username, password, port }).call(
      'editUserInfo',
      {
        username: userName,
        profile: {
          first_name: opts.firstName,
          last_name: opts.lastName,
        },
        emails: [{ address: opts.email }],
        role: opts.role,
      }
    );
  })
  .on('--help', () => {
    console.log(`
Example:
    genenotebook user edit userName -u admin -p admin
or
    genenotebook user edit userName -e userMail -f userFirstName -l userLastName  -u admin -p admin
or
    genenotebook user edit userName --email userMail --first-name userFirstName --last-name userLastName -u admin -p admin
    `);
  })
  .exitOverride(customExitOverride(editUser));
/*
// Bulk operations.
const bulk = program
  .command('bulk <command>')
  .description('Interact with GeneNoteBook users')
  .usage('<command>');

const bulkOperation = bulk.command('json');

bulkOperation
  .description('Bulk user operation')
  .usage('[option]')
  .argument('<path-to-json-file.json>')
  .requiredOption(
    '-u, --username <adminUsername>',
    'GeneNoteBook admin username'
  )
  .requiredOption(
    '-p, --password <adminPassword>',
    'GeneNoteBook admin password'
  )
  .option(
    '--port [port]',
    'Port on which GeneNoteBook is running. Default: 3000'
  )
  .action((bulkFile, { username, password, port = 3000 }) => {
    if (!(bulkFile && username, password)) {
      bulkOperation.help();
    }

    const data = JSON.parse(fs.readFileSync(bulkFile, 'utf8'));

    data.accounts.forEach((account) => {
      new GeneNoteBookConnection({ username, password, port }).call('addUser', {
        userName: account.username,
        newPassword: account.password,
        emails: account.email,
        profile: {
          first_name: account.profile.first_name,
          last_name: account.profile.last_name,
        },
        role: account.role,
      });
    });
  })
  .on('--help', function () {
    console.log(`
Example:
    genenotebook bulk json users.json -u admin -p admin
   `);
  })
  .exitOverride(customExitOverride(bulkOperation));
*/
program.parse(process.argv);
