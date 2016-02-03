Meteor.subscribe("genes");

Template.geneList.helpers({
  genes: function () {
    return Genes.find({'type':'gene'});
  },
  hideCompleted: function () {
    return Session.get("hideCompleted");
  },
  incompleteCount: function () {
    return Genes.find({checked: {$ne: true}}).count();
  },
  geneCount: function () {
    return Genes.find({'type':'gene'}).count();
  }
});

Template.geneList.events({
  "submit .new-gene": function (event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    var text = event.target.text.value;

    // Insert a task into the collection
    Meteor.call("addGene",text);
    /* not safe
    Genes.insert({
      text: text,
      createdAt: new Date(),            // current time
      owner: Meteor.userId(),           // _id of logged in user
      username: Meteor.user().username  // username of logged in user
    });
    */

    // Clear form
    event.target.text.value = "";
  },
  "change .hide-completed input": function (event) {
    Session.set("hideCompleted", event.target.checked);
  }
});


