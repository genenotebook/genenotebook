import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor';

const addDiamond = new ValidatedMethod({
  name: 'addDiamond',
  validate: new SimpleSchema({
    fileName: { type: String },
    parser: {
      type: String,
      allowedValues: ['tsv', 'tabular', 'xml', 'txt', 'sam'],
    },
  }).validator(),
  applyOptions: {
    noRetry: true,
  },
  run({ fileName }) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!Roles.userIsInRole(this.userId, 'admin')) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('file :', { fileName });

    const jobStatus = `Success to add ouput ${fileName}.`;
    return { jobStatus };
  },
});

export default addDiamond;
