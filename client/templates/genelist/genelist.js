var ITEMS_INCREMENT = 40;
Session.setDefault('itemsLimit', ITEMS_INCREMENT);
Session.setDefault('select-all',false);
Session.setDefault('filter',{})
Session.setDefault('selection',[])
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
  moreResults: function(){
    // If, once the subscription is ready, we have less rows than we
    // asked for, we've got all the rows in the collection.
    return !(Genes.find({'type':'gene'}).count() < Session.get("itemsLimit"));
  },
  queryCount:function(){
    const search = Session.get('search');
    const filter = Session.get('filter');
    Meteor.call('queryCount',search,filter,function(err,res){
      if(!err) Session.set('queryCount',res);
    })
    return Session.get('queryCount');
  },
  isChecked: function(){
    if (Session.get('select-all')){
      return 'checked'
    } else {
      const id = this.ID;
      const selection = Session.get('selection');
      if (typeof selection === 'undefined'){
        return 'unchecked'
      } else if (selection.indexOf(id) >= 0){
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
  selection: function(){
    const selection = Session.get('selection')
    if (selection.length > 0){
      return true
    } else {
      return Session.get('select-all')
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
  'click .select-gene':function(){
    const id = this.ID;
    const selection = Session.get('selection');
    //if ID was not selected index will be negative
    const wasSelected = selection.indexOf(id);
    if (wasSelected < 0){
      selection.push(id)
    } else {
      selection.splice(wasSelected,1);
    }
    Session.set('selection',selection)
  },
  'click .select-all':function(){
    const selectAll = Session.get('select-all');
    Session.set('select-all',!selectAll);
  },
  'click #download': function(event,template){
    event.preventDefault();
    const selectAll = Session.get('select-all');
    
    let query;
    if (selectAll){
      query = Session.get('filter') || {};
      const search = Session.get('search')
      if (search) {
        query.$or = [{'ID':{$regex:search, $options: 'i'}},{'Name':{$regex:search, $options: 'i'}}];
        if (!query.hasOwnProperty('Productname')){
            query.$or.push({'Productname':{$regex:search, $options: 'i'}})
        }
      }
    } else {
      const geneIds = Session.get('selection');
      query = { ID: { $in: geneIds } };
    } 

    Bert.defaults.hideDelay = 999999;
    
    Bert.alert({
      message:'Preparing download',
      style:'growl-bottom-right',
      icon:'fa-circle-o-notch'
    });

    Bert.defaults.hideDelay = 2500;

    Meteor.call('format.gff',query,function(err,res){
      
      if (err){
        Bert.alert('Preparing download failed','error','growl-bottom-right');
      } else {
        Bert.alert('Preparing download finished','success','growl-bottom-right');
        const blob = new Blob([res],{type: 'text/plain;charset=utf-8'})
        const date = new Date()

        saveAs(blob,'bioportal.' + date.toISOString() + '.gff3')
      }
    })
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
 



