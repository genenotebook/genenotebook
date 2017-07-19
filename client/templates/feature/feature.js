import uniq from 'lodash/uniq';

Tracker.autorun( () => {
  Meteor.subscribe('userList');
  Session.setDefault('viewing',[]);
})

Template.feature.helpers({
  singleGene(){
    let geneId = FlowRouter.getParam('_id');
    return Genes.findOne({ ID: geneId })
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
  expression: function(){
    const gene = this;
    //const roles = Roles.getRolesForUser(.userId);
    const expression = Experiments.find({
      data: { 
        $elemMatch : { 
          ID: gene.ID 
        } 
      }
    }).fetch()
    /*.map((exp) => {
      let data = exp.data.filter((_gene) => {
        return _gene.ID == gene.ID
      })
      exp.data = data
      return exp
    })*/
    console.log(expression)
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

Template.feature.onCreated( function () {
  let template = this;
  let geneId = FlowRouter.getParam('_id')
  template.autorun( function () {
    template.subscribe('editHistory');
    template.subscribe('singleGene',geneId)
  })
})



 