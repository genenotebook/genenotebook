var ITEMS_INCREMENT = 40;
Session.setDefault('itemsLimit', ITEMS_INCREMENT);
Deps.autorun(function(){
  //console.log(Session.get('search'))
  Meteor.subscribe('genes',Session.get('itemsLimit'),Session.get('search'),Session.get('filter'));
})

Template.genelist.helpers({
  genes: function () {
    var search = Session.get('search');
    var filter = Session.get('filter');
    if (search){
      return Genes.find({
        'type':'gene',$or:[{'ID':search},{'attributes.Name':search}]},{sort:{'ID':1}});
    } else if (filter){
      return Genes.find({'type':'gene','ID':{$in:filter.gene_ids}},{sort:{'ID':1}});
    } else {
      return Genes.find({'type':'gene'},{sort:{'ID':1}});
    }
  },
  geneCount: function () {
    return Genes.find({'type':'gene'}).count();
  },
  moreResults: function(){
    // If, once the subscription is ready, we have less rows than we
    // asked for, we've got all the rows in the collection.
    return !(Genes.find({'type':'gene'}).count() < Session.get("itemsLimit"));
  },
  hasFilter: function(){
    return Session.get('filter');
  }
});

Template.genelist.events({
  "click .genelink": function(){
    var Id = this._id._str;
    console.log(Id);
    var _expanded = Session.get('expand');
    var expanded = _expanded ? _expanded.splice(0) : [];
    var wasExpanded = expanded.indexOf(Id);
    //console.log(wasExpanded);
    if (wasExpanded < 0) {
      expanded.push(Id);
    }
  },
  "submit #genelist_filter": function(event){
    event.preventDefault();
    var filter = {}
    filter.gene_ids = $('#gene_id_filter').get(0).value.split('\n');
    filter.species = ''
    filter.experiment = ''
    console.log('filter submit');
    console.log(filter);
    Session.set('filter',filter);
  },
  "click .reset_filter": function(event){
    event.preventDefault();
    Session.set('filter',undefined);
  }

});

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


