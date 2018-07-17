import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { genomeCollection, genomeSchema } from './genomeCollection.js';

/**
 * [ValidatedMethod description]
 * @param {[type]} options.name:     'updateGenome' [description]
 * @param {[type]} options.validate: new            SimpleSchema({                                        _id:          { type: String        [description]
 * @param {[type]} name:             {             type:           String    }           [description]
 * @param {[type]} organism:         {             type:           String    }           [description]
 * @param {[type]} description:      {             type:           String    }           [description]
 * @param {[type]} permissions:      {             type:           Array     }           [description]
 * @param {[type]} 'permissions.$':  {             type:           String}               }).validator() [description]
 * @param {[type]} applyOptions:     {                                                    noRetry:        true             }    [description]
 * @param {[type]} run({            _id,           name,           organism, description, permissions     }){                                if            (! this.userId) {      throw new Meteor.Error('not-authorized');    }    if (! Roles.userIsInRole(this.userId, 'admin') [description]
 */
export const updateGenome = new ValidatedMethod({
  name: 'updateGenome',
  validate: genomeSchema.validator(),
  applyOptions: {
    noRetry: true
  },
  run({ _id, name, organism, description, permissions }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId, 'admin')){
      throw new Meteor.Error('not-authorized');
    }

    genomeCollection.update({
      _id
    },{
      $set: {
        name,
        organism,
        description,
        permissions
      }
    })
  }
})