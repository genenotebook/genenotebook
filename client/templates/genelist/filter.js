Meteor.subscribe('filterOptions');
Meteor.subscribe('tracks');

Session.setDefault('selectedFeatures',['Comment','Productname','Pseudogene','orthogroup','paralogs','singleton'])

Template.filter.helpers({
    hasFilter: function(){
        const filter = Session.get('filter');
        return !_.isEmpty(filter);
    },
    features: function(){
        const features = FilterOptions.find({});
        return features
    },
    selectedFeatures: function(){
        const selectedFeatures = Session.get('selectedFeatures')
        return FilterOptions.find({ _id: { $in: selectedFeatures } })
    },
    tracks:function(){
        return Tracks.find({});
    },
    formatTrackName:function(trackName){
        return trackName.split('.')[0];
    }
})

Template.filter.events({
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
        
      console.log(parent.context.id);
      if (checkbox.readOnly){
        //go from negative to unchecked
        delete filter[id]
        parent.removeClass('checkbox-danger');
        checkbox.checked=checkbox.readOnly=false;
      } else if (!checkbox.checked){
        //go from positive to negative
        filter[id] = negativeQuery;
        parent.addClass('checkbox-danger');
        parent.removeClass('checkbox-success');
        checkbox.readOnly=checkbox.checked=true;
      } else {
        //go from unchecked to positive
        filter[id] = positiveQuery;
        parent.addClass('checkbox-success');
        parent.removeClass('checkbox-danger');
     }
     Session.set('filter',filter)
    },
    'click .reset_filter': function(event){
      event.preventDefault();
      const filters = $('input[type=checkbox]');
      filters.each(function(){
        this.checked = this.readOnly = false;
      })
      $('#gene_id_filter').val('');
      Session.set('filter',{});
      Session.set('select-all',false);
      Session.set('checked',[]);
    },  
    'click .featuremenu-item':function(event,template){
        const feature = event.target.text;
        const selectedFeatures = Session.get('selectedFeatures');
        if (selectedFeatures.indexOf(feature) < 0){
            selectedFeatures.push(feature);
        }
        Session.set('selectedFeatures',selectedFeatures);
    }
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
})

//toggle between checked/unchecked/indeterminate for checkboxes to determine query yes/no/don't care
function toggleSwitch(checkbox) {
  const filter = Session.get(filter)
  const parent = $(checkbox).parent();
  const id = parent.context.id;
  if (id === 'Productname'){
    positiveQuery = {$ne:'None'}
    negativeQuery = 'None'
  } else {
    positiveQuery = {$exists:true}
    negativeQuery = {$exists:false}
  }
  console.log(parent.context.id);
  if (checkbox.readOnly){
    //go from negative to unchecked
    parent.removeClass('checkbox-danger');
    checkbox.checked=checkbox.readOnly=false;
  } else if (!checkbox.checked){
    //go from positive to negative
    parent.addClass('checkbox-danger');
    parent.removeClass('checkbox-success');
    checkbox.readOnly=checkbox.checked=true;
  } else {
    //go from unchecked to positive
    parent.addClass('checkbox-success');
    parent.removeClass('checkbox-danger');

 }
}