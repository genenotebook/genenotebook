Template.feature.helpers({
  isOwner: function () {
    return this.owner === Meteor.userId();
  },
  name: function() {
    return this.attributes.Name;
  },
  featuretype: function(){
    return this.source;
  },
  subfeatureNumber: function(){
    return this.children.length;
  },
  subfeatures: function(){
    console.log(this.children);
    return Genes.find({ 'ID':{$in: this.children} });
  },
  expand: function(){
    var Id = this._id;
    var expanded = Session.get('expand');
    if (typeof expanded === 'undefined'){
      return
    }
    for (var i = 0; i < expanded.length; i++){
      if (expanded[i].equals(Id)){
        return 'expanded';
      }
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

      var Id = this._id;
      var _expanded = Session.get('expand');
      var expanded = _expanded ? _expanded.splice(0) : [];
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
      console.log(expanded);
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

 