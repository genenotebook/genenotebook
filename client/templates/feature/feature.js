import uniq from 'lodash/uniq';

Tracker.autorun( () => {
  Meteor.subscribe('userList');
  Session.setDefault('viewing',[]);
})

Template.feature.helpers({
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
  }
});



 