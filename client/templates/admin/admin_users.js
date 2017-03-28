Template.adminUsers.events({
	'click .save':function(event, template){
		const data = {
			username: template.find('#' + this.username + '-username').value,
			profile: {
				last_name: template.find('#' + this.username + '-lastname').value,
				first_name: template.find('#' + this.username + '-firstname').value
			}
		}

		const roles = []
		const accesslevel = template.find('input.' + this.username + '-accesslevel:checked' ).id;


		if (accesslevel === 'registered'){
			roles.push('registered')
		} else if (accesslevel === 'user'){
			roles.push('registered','user')
		} else if (accesslevel === 'curator') {
			roles.push('registered','user','curator')
		} else if (accesslevel === 'admin') {
			roles.push('registered','user','curator','admin')
		} else {
			//nothing
		}

		data.roles = roles

		Meteor.call('updateUsers',this._id,data)
	}
})
