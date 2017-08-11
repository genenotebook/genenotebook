import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import uniq from 'lodash/uniq';

import jobQueue from '/imports/api/jobqueue/jobqueue.js';
import { Genes } from '/imports/api/genes/gene_collection.js';
import { ExperimentInfo, Transcriptomes } from '/imports/api/transcriptomes/transcriptome_collection.js';

import './feature.html';
import './feature.scss';

import './expression.js';
import './genemodel.js';
import './info.js';
import './interproscan.js';
import './orthogroup.js';
import './seq.js';

Tracker.autorun( () => {
  Meteor.subscribe('userList');
  Session.setDefault('viewing',[]);
})

Template.feature.helpers({
  singleGene(){
    const geneId = FlowRouter.getParam('_id');
    const gene = Genes.findOne({ ID: geneId });
    return gene
  },
  tab:function(){
    return Template.instance().currentTab.get();
  },
  tabData:function(){
    const tab = Template.instance().currentTab.get();
    const data = {
      'info': this,
      'seq': this,//this.subfeatures.filter(function(x){return x.type === 'mRNA'}),
      'interproscan': this,//this.subfeatures.filter(function(x){return x.type === 'mRNA'}),
      'genemodel': this
    };
    return data[tab];
  },
  transcripts: function(){
    const transcripts = this.subfeatures.filter( (sub) => {return sub.type === 'mRNA'});
    return transcripts
  },
  isOwner: function () {
    return this.owner === Meteor.userId();
  },
  featuretype: function(){
    return this.source;
  },
  orthologs: function(){
    return this.attributes['putative orthologs'];
  },
  subfeatureNumber: function(){
    return this.children.length;
  },
  domainCount: function(){
    //const transcripts = this.subfeatures.filter( (sub) => {return sub.type === 'mRNA'});
    //const domains = transcripts.map( (transcript) => { return Object.keys(transcript.interproscan) })
    const domains = this.domains ? this.domains : []
    if (domains.length){
      return uniq(domains[0]).length
    } else {
      return 0
    }
    
  },
  orthogroupSize: function(){
    const orthogroup = Orthogroups.findOne({ID:this.orthogroup})
    let orthogroupSize = 0
    if (orthogroup !== undefined){
      orthogroupSize = orthogroup.alignment.length
    }
    return orthogroupSize
  },
  user: function(userId){
    const user = Meteor.users.findOne({ _id: userId });
    return user.username
  },
  hasTranscriptomes: function(){
    const gene = this;
    const expression = Transcriptomes.find({geneId: gene.ID}).fetch()
    
    return expression.length > 0
  },
  transcriptomeNumber: function(){
    const gene = this;
    const expression = Transcriptomes.find({geneId: gene.ID}).fetch()
    console.log(expression)
    return expression.length
  }
});

Template.feature.events({
  'click .nav-tabs li': function(event){
    const currentTab = $( event.target ).closest('li');
    currentTab.addClass('active');
    $('.nav-tabs li').not(currentTab).removeClass('active');

    const target = currentTab.context.hash
    targetOffset = $(target).offset().top
    $('html','body').animate({scrollTop:targetOffset},200);
    //template.currentTab.set( currentTab.data( "template" ) );
  },
  'click #interproscan': function(event,template){
    console.log(this.ID)
    const userId = Meteor.userId()
    if (!userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (! Roles.userIsInRole(userId,'admin')){
      throw new Meteor.Error('not-authorized');
    }

    const job = new Job(jobQueue, 'interproscan',
      {
        geneId: this.ID
      })

    job.priority('normal').save()
  
  }
});

Template.feature.onCreated( function () {
  let template = this;
  let geneId = FlowRouter.getParam('_id');

  template.autorun( function () {
    template.subscribe('editHistory');
    template.subscribe('singleGene',geneId)
  })
})

Template.feature.onDestroyed(function(){
  console.log('destroyed feature template')
})



 