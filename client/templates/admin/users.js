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

		if (accesslevel === 'user'){
			roles.push('user')
		} else if (accesslevel === 'curator') {
			roles.push('user','curator')
		} else if (accesslevel === 'admin') {
			roles.push('user','curator','admin')
		} else {
			//nothing
		}

		data.roles = roles

		Meteor.call('users.update',this._id,data)
	},
	'click .accesslevel':function(event, template){
		const id = event.target.id;
		console.log()
		if (id === 'accesslevel-user'){
			$('#accesslevel-curator').addClass('btn-default')
			$('#accesslevel-curator').removeClass('btn-primary')

			$('#accesslevel-admin').addClass('btn-default')
			$('#accesslevel-admin').removeClass('btn-primary')
		} else if (id === 'accesslevel-curator'){
			$('#accesslevel-curator').addClass('btn-primary')
			$('#accesslevel-curator').removeClass('btn-default')

			$('#accesslevel-admin').addClass('btn-default')
			$('#accesslevel-admin').removeClass('btn-primary')
		} else if (id === 'accesslevel-admin'){
			$('#accesslevel-curator').addClass('btn-primary')
			$('#accesslevel-curator').removeClass('btn-default')

			$('#accesslevel-admin').addClass('btn-primary')
			$('#accesslevel-admin').removeClass('btn-default')
		} else {

		}
	}
})