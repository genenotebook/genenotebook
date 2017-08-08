import { Template } from 'meteor/templating';

import './blasthit.html';

import lodash from 'lodash';

_ = lodash;



Template.blasthit.helpers({
	hspNum:function(){
		const hspNum = this.Hit_hsps[0].Hsp.length;
		return hspNum
	},
	firstHsp:function(){
		const firstHsp = this.Hit_hsps[0].Hsp[0];
		return firstHsp
	},
	hit:function(){
		const _hit = this.Hit_def[0].split(' ')
		const hit = {'transcript':_hit[1],'gene':_hit[0]}
		return hit
	},
	hsps:function(){
		const hsps = this.Hit_hsps[0].Hsp
		const formattedHsps = hsps.map(function(obj){
			const newObj = _.mapKeys(obj,function(value,key){
				return key.replace('-','_')
			})
			return newObj
		})
		return formattedHsps
	},
	queryTag:function(hsp){
		//Create padding of non-breaking space ( \xA0 ) between Query and start position
		const queryStart = hsp.Hsp_query_from[0];
		const hspStart = hsp.Hsp_hit_from[0];
		var repeatPadding = queryStart.length >= hspStart.length ? 0 : hspStart.length - queryStart.length
		const padding = '\xA0'.repeat(repeatPadding + 1)
		const queryTag = 'Query\xA0\xA0' + padding + queryStart
		return queryTag
	},
	midlineTag:function(hsp){
		//Create padding of non-breaking space ( \xA0 ) for midline
		const queryStart = hsp.Hsp_query_from[0];
		const hspStart = hsp.Hsp_hit_from[0];
		var repeatPadding = Math.max(queryStart.length,hspStart.length);
		const midlineTag = '\xA0'.repeat(repeatPadding + 8)
		return midlineTag
	},
	subjectTag:function(hsp){
		//Create padding of non-breaking space ( \xA0 ) between Subject and start position
		const queryStart = hsp.Hsp_query_from[0];
		const hspStart = hsp.Hsp_hit_from[0];
		var repeatPadding = hspStart.length >= queryStart.length ? 0 : queryStart.length - hspStart.length
		const padding = '\xA0'.repeat(repeatPadding)
		const queryTag = 'Subject\xA0' + padding + hspStart
		return queryTag
	}
})

Template.blasthit.events({
	'click .blast-hit-link':function(event){
		event.preventDefault();
		const gene = event.target.id;
		console.log(gene)
		Router.go('gene',{'_id':gene});
	},
})