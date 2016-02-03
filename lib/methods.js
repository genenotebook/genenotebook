Meteor.methods({
  addGene: function (text) {
    // Make sure the user is logged in before inserting a task
    
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
 
    Genes.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteGene: function (taskId) {
    var task = Genes.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    }
 
    Genes.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    var task = Genes.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }
 
    Genes.update(taskId, { $set: { checked: setChecked} });
      },
  setPrivate: function (taskId, setToPrivate) {
    var task = Genes.findOne(taskId);
 
    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
 
    Genes.update(taskId, { $set: { private: setToPrivate } });
  }
})