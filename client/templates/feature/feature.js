Meteor.subscribe('orthogroups')
/*
Template.feature.onCreated(function(){
  this.currentTab = new ReactiveVar('info');
})
*/

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
    const transcripts = this.subfeatures.filter(function(x){return x.type === 'mRNA'});
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
    const transcripts = this.subfeatures.filter(function(x){return x.type === 'mRNA'});
    const domains = transcripts.map(function(x){ return Object.keys(x.interproscan) })
    return _.uniq(domains[0]).length
  },
  orthogroupSize: function(){
    const og = Orthogroups.findOne({'ID':this.orthogroup})
    return og.alignment.length
  },
  user: function(userId){
    const user = Meteor.users.findOne({'_id':userId});
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

Template.feature.rendered = function(){
  /*
  $('#feature-nav').affix({
    offset: {
      top: 50
    }
  });
  */
}

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

 