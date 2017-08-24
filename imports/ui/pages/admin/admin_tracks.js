import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Job } from 'meteor/vsivsi:job-collection';

//import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { makeBlastDb } from '/imports/api/blast/makeblastdb.js';

import './admin_tracks.html';

Template.adminTracks.helpers({
	hasDb: function(){
		const hasDb = this.blastdbs !== undefined 
		return hasDb
	}
})

Template.adminTracks.events({
	'click .makeblastdb':function(){
		const dbTypes = ['nucl','prot']

		dbTypes.forEach(dbType => {
			const jobOptions = { 
				trackName: this.trackName,
				dbType: dbType 
			}

      makeBlastDb.call(jobOptions, (error,result) => {
        if (error) {
          console.error(error)
        }
        
        console.log(result)
      })
      /*
			const job = new Job(jobQueue, 'makeBlastDb', jobOptions)

			job.priority('normal').save();
      */
		})
	}
})

Template.adminTracks.onCreated( function () {
  let template = this;

  template.autorun( function () {
    template.subscribe('jobCollection');
  })
})