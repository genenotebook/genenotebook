Template.feature.helpers({
  isGene: function() {
    return this.type === 'gene';
  },
  isTranscript: function(){
    return this.type === 'mRNA';
  },
  isCds: function(){
    return this.type === 'CDS';
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
    //return this.attributes.Name;
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
  subfeatureArray: function(){
    var array = [];
    Genes.find({ 'ID':{$in: this.children} }).forEach(function(sub){array.push(sub.start + '...' + sub.end)})
    console.log(array);
    return array;
  },
  subfeatures: function(){
    //console.log(this.children);
    return Genes.find({ 'ID':{$in: this.children} });
  },
  expand: function(){
    var Id = this._id._str;
    var expanded = Session.get('expand');
    if (typeof expanded === 'undefined'){
      return
    }
    if (expanded.indexOf(Id) >= 0){
      return 'expanded';
    }
  },
  expand_check: function(){
    var Id = this._id._str;
    var checked = Session.get('expand');
    if (typeof checked === 'undefined'){
      return
    }
    if (checked.indexOf(Id) >= 0){
      return 'checked';
    }
  },
  info_check: function(){
    var Id = this._id._str;
    var checked = Session.get('info');
    if (typeof checked === 'undefined'){
      return
    }
    if (checked.indexOf(Id) >= 0){
      return 'checked';
    }
  }
});

Template.feature.events({
    "click .toggle-expand": function () {
      //the following prevents 'event bubbling', this was causing mRNA features to be not expandable
      //http://www.quirksmode.org/js/events_order.html
      if (!e) var e = window.event;
      e.cancelBubble = true;
      if (e.stopPropagation) e.stopPropagation();

      var Id = this._id._str;
      //console.log(Id);
      var _expanded = Session.get('expand');
      var expanded = _expanded ? _expanded.splice(0) : [];
      var wasExpanded = expanded.indexOf(Id);
      //console.log(wasExpanded);
      if (wasExpanded < 0) {
        expanded.push(Id);
      } else {
        expanded.splice(wasExpanded,1);
      }
      /*
      var wasExpanded = false;
      for (var i = expanded.length -1; i >= 0; i--){
        if (expanded[i].equals(Id)){
          expanded.splice(i,1);
          wasExpanded = true;
        }
      }
      if (!wasExpanded){
        expanded.push(Id);
      }
      */
      //console.log(expanded);
      Session.set('expand',expanded);
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

 