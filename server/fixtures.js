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
    //add the viewing, editing and expression option, 
    //since some keys are dynamic it will not allways be present on any gene, 
    //but we do want to filter on this
    const permanentOptions = ['viewing','editing','expression']
    permanentOptions.forEach(function(optionId){
        console.log(`Adding default filter option: ${optionId}`)
        Attributes.findAndModify({
            query: { 
                ID: optionId 
            },
            update: { 
                $setOnInsert: { 
                    name: optionId, 
                    query: optionId, 
                    show: true, 
                    canEdit: false, 
                    reserved: true,
                    allReferences: true 
                } 
            }, 
            new: true, 
            upsert: true 
        })
    })
});