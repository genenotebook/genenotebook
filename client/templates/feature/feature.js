Template.feature.onCreated(function(){
  this.currentTab = new ReactiveVar('seq');
})

Template.feature.helpers({
  tab:function(){
    return Template.instance().currentTab.get();
  },
  tabData:function(){
    const tab = Template.instance().currentTab.get();
    const data = {
      'seq': this.subfeatures.filter(function(x){return x.type === 'mRNA'}),
      'interproscan': this.subfeatures.filter(function(x){return x.type === 'mRNA'}),
      'genemodel': this.subfeatures
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
  name: function() {
    var name = this.attributes.Name;
    if (typeof name !== 'undefined'){
      return name
    } else {
      return ''
    }
  },
  /*
  interproscan: function(){
    var array = [];
    //console.log(this.interproscan)
    for (var key in this.interproscan){
      //console.log(key)
      if (this.interproscan.hasOwnProperty(key)){
        //console.log(this.interproscan[key])
        var str = this.interproscan[key]['name'];
        str += '...' + this.interproscan[key]['start'];
        str += '...' + this.interproscan[key]['end'];
        console.log(str);
        array.push(str);
      }
    }
    return array;
  },
  */
  featuretype: function(){
    return this.source;
  },
  orthologs: function(){
    return this.attributes['putative orthologs'];
  },
  subfeatureNumber: function(){
    return this.children.length;
  }
});

Template.feature.events({
  'click .nav-tabs li': function(event,template){
    var currentTab = $( event.target ).closest( "li" );
    currentTab.addClass( "active" );
    $( ".nav-tabs li" ).not( currentTab ).removeClass( "active" );
    template.currentTab.set( currentTab.data( "template" ) );
  }
});

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

 