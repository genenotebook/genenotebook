import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

// import SimpleSchema from 'simpl-schema';

import { genomeCollection, genomeSchema } from './genomeCollection.js';

const updateGenome = new ValidatedMethod({
  name: 'updateGenome',
  validate: genomeSchema.validator(),
  applyOptions: {
    noRetry: true,
  },
  run({
    _id, name, organism, description, permission, isPublic,
  }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    return genomeCollection.update({
      _id,
    }, {
      $set: {
        name,
        organism,
        description,
        permission,
        isPublic,
      },
    });
  },
});

export default updateGenome;
