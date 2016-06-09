/*
Meteor.startup(function () {
    const exec = Npm.require('child_process').exec;
});

function test(callback){
    setTimeout(function(){
        cb(null, 'Dummy result');
    },
    100);
}

runCmd = Meteor.wrapAsync(exec);

Meteor.methods({
  test: function(){
    const result = runCmd('readlink -f .');
    console.log(result);  
  }
})
*/