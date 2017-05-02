import FileSaver from 'file-saver'

var ITEMS_INCREMENT = 40;
Session.setDefault('itemsLimit', ITEMS_INCREMENT);
Session.setDefault('select-all',false);
Session.setDefault('filter',{})
Session.setDefault('selection',[])
Session.setDefault('download-progress','progress unknown')
Meteor.subscribe('tracks');
Meteor.subscribe('downloads');
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
    // If (once the subscription is ready) we have less rows than we
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
  'click .nav-tabs li': function(event,template){
    var currentTab = $( event.target ).closest( "li" );
    currentTab.addClass( "active" );
    $( ".nav-tabs li" ).not( currentTab ).removeClass( "active" );
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
    const format = $('.active.download-format').attr('id');
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

    /*
    Meteor.call('initializeDownload',query,format,function(err,downloadId){
      console.log('downloadId',downloadId)
      const download = Downloads.find({_id:downloadId})
      download.observeChanges({
        changed: function(id,fields){
          if (fields.progress === 'finished'){
            console.log('finished')
            //save
          } else {
            Session.set('download-progress',fields.progress)
          }
        }
      })
    });
    */
    /*pseudocode todo
      //do this in the method:
      check if query previously downloaded:
      downloads.find({query:query})
      //do this here
     meteor.call('initialize-download',format,query,function(err,res){
        _id = res
        cursor = downloads.find({_id:_id})
        cursor.observeChanges({
           changed: function(id,fields){
             if fields.progress === 'finished':
                save file
             else 
                 Session.set('download-progress',fields.progress )
           }
        })
     })
     


    */

    
    Bert.defaults.hideDelay = 999999;
    
    Bert.alert({
      type:'prepare-download',
      title:'Preparing download',
      message:'This may take a while',
      type:'primary',
      style:'growl-bottom-right',
      icon:'fa-circle-o-notch fa-spin'
    });

    Bert.defaults.hideDelay = 2500;

    let formatFunction;
    switch(format){
      case 'gff':
        formatFunction = 'formatGff';
        break;
      case 'fasta':
        formatFunction = 'formatFasta';
        break;
      default:
        throw new Meteor.Error('Unkown format');
        break
    }

    Meteor.call(formatFunction, query, (err,res) => {
      
      if (err){
        Bert.alert('Preparing download failed','error','growl-bottom-right');
      } else {
        Bert.alert('Preparing download finished','success','growl-bottom-right');
        const blob = new Blob([res],{type: 'text/plain;charset=utf-8'})
        const date = new Date()
        const dateString = date.toISOString()

        FileSaver.saveAs(blob,`bioportal.${dateString}.${format}`)//'bioportal.' + date.toISOString() + '.' + format)
      }
    })
    
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


 



