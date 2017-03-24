Meteor.startup(function () {
    if ( Meteor.users.find().count() === 0 ) {
        console.log('Adding default admin user');
        const adminId = Accounts.createUser({
            username: 'admin',
            email: 'admin@none.com',
            password: 'admin',
            profile: {
                first_name: 'admin',
                last_name: 'admin',
            }
        });
        Roles.addUsersToRoles(adminId,['admin','curator','user','registered']);

        console.log('Adding default guest user')
        const guestId = Accounts.createUser({
            username: 'guest',
            email: 'guest@none.com',
            password: 'guest',
            profile: {
                first_name: 'guest',
                last_name: 'guest',
            }
        });
        Roles.addUsersToRoles(guestId,['user','registered'])
    }
});