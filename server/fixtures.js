Meteor.startup(function () {
    if ( Meteor.users.find().count() === 0 ) {
        console.log('Adding default admin user');
        var userId = Accounts.createUser({
            username: 'admin',
            email: 'admin@none.com',
            password: 'admin',
            profile: {
                first_name: 'admin',
                last_name: 'admin',
            }
        });
        Roles.addUsersToRoles(userId,['admin','curator','user','registered']);
    }
});