Template.gene.helpers({
  isOwner: function () {
    return this.owner === Meteor.userId();
  },
  name: function() {
    return this.attributes.Name;
  },
  featuretype: function(){
    return this.source;
  },
  transcriptNumber: function(){
    return this.children.length;
  },
  transcripts: function(geneId){
    console.log(geneId);
    console.log(Genes.find({'parents':geneId}));
    return Genes.find({'parents':geneId});
  },
  expand: function(){
    var geneId = this._id;
    var expanded = Session.get('expand');
    //console.log(expanded);
    if (typeof expanded === 'undefined'){
      return
    }
    for (var i = 0; i < expanded.length; i++){
      if (expanded[i].equals(geneId)){
        return 'expanded';
      }

    }
    //console.log([geneId,expandedGene,expandedGene===geneId])
    //if ( expandedGene.equals(geneId) ){
    //  console.log('expand');
    //  return 'expanded';
    //}
  }
});

Template.gene.events({
    "click .toggle-expand": function () {
      var geneId = this._id;
      var _expanded = Session.get('expand');
      var expanded = _expanded ? _expanded.splice(0) : [];
      var wasExpanded = false;
      for (var i = expanded.length -1; i >= 0; i--){
        if (expanded[i].equals(geneId)){
          expanded.splice(i,1);
          wasExpanded = true;
        }
      }
      if (!wasExpanded){
        expanded.push(geneId);
      }
     // var expandedCopy = expanded.splice(0);
      Session.set('expand',expanded);
      // Set the checked property to the opposite of its current value
      
      //Meteor.call("setChecked",this._id, ! this.checked);
      /*Genes.update(this._id, {
        $set: {checked: ! this.checked}
      });*/
    },
    "click .delete": function () {
      Meteor.call("deleteTask",this._id);
    },
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
      //Genes.remove(this._id);
    }
  });
Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

 