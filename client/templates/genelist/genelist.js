var ITEMS_INCREMENT = 40;
Session.setDefault('itemsLimit', ITEMS_INCREMENT);
Session.setDefault('select-all',false);
Session.setDefault('filter',{}  )
Meteor.subscribe('tracks');
Tracker.autorun(function(){
  Meteor.subscribe('genes',Session.get('itemsLimit'),Session.get('search'),Session.get('filter'));
})

Template.genelist.helpers({
  genes: function(){
    const query = Session.get('filter') || {};
    const search = Session.get('search')
    if (search) {
      query.$or = [{'ID':{$regex:search, $options: 'i'}},{'Name':{$regex:search, $options: 'i'}}];
      if (!query.hasOwnProperty('Productname')){
        query.$or.push({'Productname':{$regex:search, $options: 'i'}})
    }
  }
    return Genes.find(query,{sort:{'ID':1}});
  },
  transcripts: function(){
    const transcripts = this.subfeatures.filter(function(x){ return x.type === 'mRNA' });
    return transcripts
  },
  moreResults: function(){
    // If, once the subscription is ready, we have less rows than we
    // asked for, we've got all the rows in the collection.
    return !(Genes.find({'type':'gene'}).count() < Session.get("itemsLimit"));
  },
  hasFilter: function(){
    const filter = Session.get('filter')
    return !_.isEmpty(filter);
  },
  queryCount:function(){
    Meteor.call('queryCount',Session.get('filter'),function(err,res){
      if(!err) Session.set('queryCount',res);
    })
    return Session.get('queryCount');
  },
  isChecked: function(){
    if (Session.get('select-all')){
      return 'checked'
    } else {
      const id = this.ID;
      const checked = Session.get('checked');
      if (typeof checked === 'undefined'){
        return 'unchecked'
      } else if (checked.indexOf(id) >= 0){
        return 'checked';
      } else {
        return 'unchecked'
      }
    }
  },
  selectAll: function(){
    if (Session.get('select-all')){
      return 'checked'
    } else {
      return 'unchecked'
    }
  },
  tracks:function(){
    return Tracks.find({});
  },
  formatTrackName:function(trackName){
    return trackName.split('.')[0];
  },
  confidence:function(){
    if (this.one_to_one_orthologs === 'High confidence') {
      return 'label-success'
    } else {
      return 'label-danger'
    }
  }
});

Template.genelist.events({
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
  "click .reset_filter": function(event){
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
  "click .export-data":function(event,template){
    $(event.target).button('loading');
    let name        = 'name',   //Meteor.user().profile.name,
        fileName    = 'fileName'   //`${name.first} ${name.last}`,
        //profileHtml = Modules.client.getProfileHTML();
        /*
    Meteor.call('exportData',profileHtml,(error,response) => {
      if (error) {
        Bert.alert( error.reason, 'warning' );
      } else if ( response ) {
      // We'll handle the download here.
      }
    })
    */
  },
  "click .select-gene":function(){
    console.log(this);
    const id = this.ID;
    const _checked = Session.get('checked');
    const checked = _checked ? _checked.slice(0) : [];
    const wasChecked= checked.indexOf(id);
    if (wasChecked < 0) {
      checked.push(id);
    } else {
      checked.splice(wasChecked,1);
    }
    Session.set('checked',checked)
  },
  "click .select-all":function(){
    const selectAll = Session.get('select-all');
    Session.set('select-all',!selectAll);
  }
});

Template.genelist.rendered = function(){
  const input = document.getElementById('slider')
  
  noUiSlider.create(input,{
    start: [20,80],
    connect: true,
    range: {
      'min': [0],
      'max': [100]
    }
  })
}

// whenever #showMoreResults becomes visible, retrieve more results
function showMoreVisible() {
    var threshold, target = $('#showMoreGenes');
    
    if (!target.length) return;
    
    threshold = $(window).scrollTop() + $(window).height() - target.height();

    if (target.offset().top <= threshold) {
        if (!target.data("visible")) {
            // console.log("target became visible (inside viewable area)");
            target.data("visible", true);
            Session.set("itemsLimit",
                Session.get("itemsLimit") + ITEMS_INCREMENT);
        }
    } else {
        if (target.data("visible")) {
            // console.log("target became invisible (below viewable arae)");
            target.data("visible", false);
        }
    }        
}
// run the above func every time the user scrolls
$(window).scroll(showMoreVisible)

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
 



