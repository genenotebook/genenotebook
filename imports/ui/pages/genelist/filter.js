import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { Tracks } from '/imports/api/genomes/track_collection.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';

import './filter.html';
import './filter.scss';

Session.setDefault('selectedAttributes',
  ['Note','Comment','Productname',
  'Pseudogene','orthogroup','paralogs',
  'singleton'])

function updateCheckboxes(){
  const filter = Session.get('filter')
  const featureCheckboxes = $('.attribute-checkbox')
  featureCheckboxes.each(function(index,checkbox){
    const parent = $(checkbox).parent()
    if ( filter.hasOwnProperty(checkbox.id) ){
      if ( filter[checkbox.id]['$exists'] === true ){
        parent.removeClass('checkbox-danger');
        parent.addClass('checkbox-success')
        checkbox.checked = true;
        checkbox.readOnly = false;
      } else if ( filter[checkbox.id]['$exists'] === false ){
        parent.addClass('checkbox-danger');
        parent.removeClass('checkbox-success')
        checkbox.checked = checkbox.readOnly = true;
      }
    } else {
      parent.removeClass('checkbox-danger');
      parent.removeClass('checkbox-success')
      checkbox.checked = checkbox.readOnly = false;
    }
  })
  if (filter.hasOwnProperty('track')){
    const trackCheckboxes = $('.track-checkbox');
    trackCheckboxes.each(function(index,checkbox){
      if (filter['track']['$in'].indexOf(checkbox.id) < 0){
        checkbox.checked = false
      } else {
        checkbox.checked = true
      }
    })
  }
  

}

function updateInputfields(){
  const filter = Session.get('filter')
  if (filter.hasOwnProperty('ID')){
    const geneIdsField = $('#gene_id_filter')
    geneIdsField.val(filter.ID.join('\n'))
  }
  
  if (filter.hasOwnProperty('orthogroup')){
    if (!filter.orthogroup.hasOwnProperty('$exists')){
      const orthogroupField = $('#orthogroup_filter')
      orthogroupField.val(filter.orthogroup)
    }
  }
}

Template.filter.helpers({
  hasFilter: function(){
    const filter = Session.get('filter');
    return !_.isEmpty(filter);
  },
  attributes: function(){
    const attributes = Attributes.find({
      show: true
    },{
      sort: {
        name: 1
      }
    });
    return attributes
  },
  selectedAttributes: function(){
    const selectedAttributes = Session.get('selectedAttributes')
    const attributes = Attributes.find({ 
      name: { 
        $in: selectedAttributes 
      } 
    },{
      sort: {
        name: 1
      }
    })
    return attributes
  },
  tracks:function(){
    return Tracks.find({});
  },
  formatTrackName:function(trackName){
    return trackName.split('.')[0];
  }
})

Template.filter.events({
  'keydown #orthogroup_filter': function(event){
    if (event.keyCode === 13){
      event.preventDefault();
    }
  },
  'input #gene_id_filter': function(event){
      const filter = Session.get('filter')
      const geneIdString = event.currentTarget.value
      const temp = geneIdString ? geneIdString.split('\n') : [];
      const filterGeneIds = temp.filter(function(x){ return x });
      if (filterGeneIds.length > 0){
        filter.ID = {$in:filterGeneIds}
        Session.set('filter',filter)
      }
  },
  'input #orthogroup_filter': function(event){
    const filter = Session.get('filter');
    const orthogroup = event.currentTarget.value.trim();
    if (orthogroup.length > 0){
      filter.orthogroup = orthogroup
      Session.set('filter',filter)
    }
  },
  'click input.track-checkbox[type=checkbox]': function(event){
      const filter = Session.get('filter');
      const checkbox = event.target;
      const parent = $(checkbox).parent();
      const id = parent.context.id;
      if (checkbox.checked){
        if (!filter.hasOwnProperty('track')){
          filter['track'] = {'$in':[id]}
        } else {
          filter['track']['$in'].push(id)
        }
      } else {
        filter['track']['$in'] = _.without(filter['track']['$in'],id)
      } 
      if (filter['track']['$in'].length === 0){
        delete filter['track']
      }
      Session.set('filter',filter)
    },
  'click input.ternary-toggle[type=checkbox]': function(event){
    const filter = Session.get('filter');
    const checkbox = event.target;
    const parent = $(checkbox).parent();
    const id = parent.context.id;

    const positiveQuery = {$exists:true}
    const negativeQuery = {$exists:false}
      
    if (checkbox.readOnly){
      //go from negative to unchecked
      delete filter[id]
    } else if (!checkbox.checked){
      //go from positive to negative
      filter[id] = negativeQuery;
    } else {
      //go from unchecked to positive
      filter[id] = positiveQuery;
   }
   Session.set('filter',filter)
   updateCheckboxes()
  },
  'click .reset_filter': function(event){
    event.preventDefault();
    const filters = $('input[type=checkbox]');
    filters.each(function(){
      this.checked = this.readOnly = false;
    })
    $('#gene_id_filter, #orthogroup_filter').val('');
    Session.set('filter',{});
    Session.set('select-all',false);
    Session.set('checked',[]);
  },  
  'click .attributemenu-item':function(event,template){
    const attribute = event.target.text;
    console.log(`click ${attribute}`)
    const selectedAttributes = Session.get('selectedAttributes');
    if (selectedAttributes.indexOf(attribute) < 0){
        selectedAttributes.push(attribute);
    }
    Session.set('selectedAttributes',selectedAttributes);
  }
})

Template.filter.onCreated(function(){
  let template = this;
  template.autorun(function(){
    Meteor.subscribe('attributes');
    Meteor.subscribe('tracks');
  })
})

Template.filter.onRendered(function(){
  /*
  const input = document.getElementById('slider')
  
  noUiSlider.create(input,{
    start: [20,80],
    connect: true,
    range: {
      'min': [0],
      'max': [100]
    }
  })
  */
  updateCheckboxes()
  updateInputfields()
})

