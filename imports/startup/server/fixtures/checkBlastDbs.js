import fs from 'fs';

import { genomeCollection } from '/imports/api/genomes/genomeCollection.js';

export default function checkBlastDbs() {
  // Check if blast DBs exist
  const genomesWithDb = genomeCollection
    .find()
    .fetch()
    .filter((genome) => {
      const { _id: genomeId } = genome;
      const cleanedTrackName = genomeId.replace(/ |\./g, '_');

      const filenames = [
        `${cleanedTrackName}.nucl.nhr`,
        `${cleanedTrackName}.prot.phr`,
      ];

      const filesExist = filenames.every(fs.existsSync);

      return filesExist;
    })
    .map(genome => genome._id);

  // Update genome collection if blast DB present on disk but somehow not listed in DB
  genomesWithDb.forEach((genomeId) => {
    const cleanedTrackName = genomeId.replace(/ |\./g, '_');
    genomeCollection.update(
      {
        _id: genomeId,
      },
      {
        $set: {
          'annotationTrack.blastDb.nucl': `${cleanedTrackName}.nucl`,
          'annotationTrack.blastDb.prot': `${cleanedTrackName}.prot`,
        },
      },
    );
  });

  // Update genome collection if blast DB has gone missing
  genomeCollection.update(
    {
      _id: {
        $nin: genomesWithDb,
      },
    },
    {
      $unset: {
        'annotationTrack.blastDb': false,
      },
    },
  );
}
