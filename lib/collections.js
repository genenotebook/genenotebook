Genes = new Mongo.Collection('genes');
this.Pages = new Meteor.Pagination(Genes, {
	itemTemplate: 'feature',
	//router: false
	//route: '/genelist',
	templateName: 'genelist',
	filters: {
		type: 'gene'
	}
});