import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';

import SimpleSchema from 'simpl-schema';

import { ReferenceInfo } from './reference_collection.js';

/**
 * [ValidatedMethod description]
 * @param {[type]} options.name:     'updateReferenceInfo' [description]
 * @param {[type]} options.validate: new                   SimpleSchema({                                        _id:          { type: String        [description]
 * @param {[type]} referenceName:    {                    type:           String    }           [description]
 * @param {[type]} organism:         {                    type:           String    }           [description]
 * @param {[type]} description:      {                    type:           String    }           [description]
 * @param {[type]} permissions:      {                    type:           Array     }           [description]
 * @param {[type]} 'permissions.$':  {                    type:           String}               }).validator() [description]
 * @param {[type]} applyOptions:     {                                                           noRetry:        true             }    [description]
 * @param {[type]} run({            _id,                  referenceName,  organism, description, permissions     }){                                if            (! this.userId) {      throw new Meteor.Error('not-authorized');    }    if (! Roles.userIsInRole(this.userId, 'admin') [description]
 */
export const updateReferenceInfo = new ValidatedMethod({
  name: 'updateReferenceInfo',
  validate: new SimpleSchema({
    _id: { type: String },
    referenceName: { type: String },
    organism: { type: String },
    description: { type: String },
    permissions: { type: Array },
    'permissions.$': { type: String}
  }).validator(),
  applyOptions: {
    noRetry: true
  },
  run({ _id, referenceName, organism, description, permissions }){
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(this.userId, 'admin')){
      throw new Meteor.Error('not-authorized');
    }

    ReferenceInfo.update({
      _id
    },{
      $set: {
        referenceName,
        organism,
        description,
        permissions
      }
    })
  }
})