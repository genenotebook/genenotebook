import { Template } from 'meteor/templating';
import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';
import find from 'lodash/find';
import { diff, apply } from 'rus-diff'; 

import { EditHistory } from '/imports/api/genes/edithistory_collection.js';

const canEdit = () => {
  return true
}

const Controls = (props) => {
  return (
    <div>
      {
        props.totalVersionNumber > 0 &&
        <button type="button" class="btn btn-default btn-sm pull-right viewingHistory">
          <i class="fa fa-history" aria-hidden="true"></i> 
          Show history
          <small><span class="label label-default label-as-badge">{ props.totalVersionNumber }</span></small> 
        </button>
      }
      {
        canEdit() && !props.isEditing &&
        <button type="button" className="btn btn-default btn-sm pull-right edit" onClick={props.startEdit}>
          <i className="fa fa-pencil-square-o" aria-hidden="true"></i> Edit
        </button>
      }
      {
        canEdit() && props.isEditing &&
        <div className="btn-group pull-right">
          <button type="button" className="btn btn-default btn-sm save" onClick={props.saveEdit}>
            <i className="fa fa-floppy-o" aria-hidden="true"></i> Save
          </button>
          <button type="button" className="btn btn-default btn-sm cancel" onClick={props.cancelEdit}>
            <i className="fa fa-times" aria-hidden="true"></i> Cancel
          </button>
        </div>
      }
    </div>
  )
}

const VersionHistory = (props) => {
  return (
    <div>
      <div class="alert alert-danger" role="alert">
      <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
      You are watching version <b>{ props.currentVersionNumber } / { props.totalVersionNumber }</b> 
      of this gene by { props.editBy } at { props.editAt }.
      {/*{{ #if isInRole 'curator' }}
        <a href="#" class="alert-link">Click here to revert to this version.</a>
      {{ /if }} */}
      </div>
      <nav>
        <ul class="pager">
          <li class="previous"><a href="#"><i class="fa fa-arrow-left" aria-hidden="true"></i> Older</a></li>
          <li class="next"><a href="#">Newer <i class="fa fa-arrow-right" aria-hidden="true"></i></a></li>
        </ul>
      </nav>
    </div>
  )
}

class _Info extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      reversions: 0,
      attributes: this.props.gene.attributes,
      isEditing: false
    }
  }

  selectVersion = (version) => {
    this.setState({reversions: version})
  }

  startEdit = () => {
    console.log('start editing')
    //implement logic to lock gene from being edited by others
    this.setState({ isEditing: true })
  }

  saveEdit = () => {
    console.log('save edit')
    //save changes and unlock gene so it can be edited by others again
    this.setState({ isEditing: false })
  }

  cancelEdit = () => {
    console.log('cancel edit')
    //unlock gene so it can be edited by others again
    this.setState({ isEditing: false })
  }

  changeAttributeKey = (event) => {
    console.log(event.target.name)
    console.log(event.target.value)
  }

  changeAttributeValue = (value) => {
    console.log(`changeAttributeValue: ${value}`)
  }

  render(){
    let gene = this.props.gene;
    let attributes = this.state.attributes;
    let reversions = this.props.editHistory.slice(0, this.state.reversions)
    reversions.forEach(reversion => {
      let revertString = reversion.revert;
      let revertQuery = JSON.parse(revertString);
      attributes = apply(attributes,revertQuery);
    })
    return (
      <div>
        <Controls
          showHistory = { false }
          totalVersionNumber = { reversions.length }
          currentVersionNumber = { reversions.length - this.state.reversions }
          selectVersion = { this.selectVersion }
          isEditing = { this.state.isEditing }
          startEdit = { this.startEdit }
          saveEdit = { this.saveEdit }
          cancelEdit = { this.cancelEdit }
        />
        <h3>General information</h3>

        <div className="table-responive">
          <table className="table table-hover">
            <tbody>
              <tr>
                <td>Reference</td>
                <td>{ gene.reference }</td>
              </tr>
              <tr>
                <td>Genome coordinates</td>
                <td>{ gene.seqid } { gene.start }..{gene.end} { gene.strand }</td>
              </tr>
              <tr>
                <td>Source</td>
                <td>{ gene.source }</td>
              </tr>
              {
                Object.keys(attributes).map(key => {
                  const value = attributes[key];
                  console.log(key,value)
                  return (
                    <tr key={key}>
                      <td>
                        {
                          this.state.isEditing ? 
                          <input type="text" className="form-control" onChange={this.changeAttributeKey} name={key} value={key}/> :
                          key
                        }
                      </td>
                      <td>
                        {
                          this.state.isEditing ?
                          <input type="text" className="form-control" onChange={this.changeAttributeValue} name={value} value={value}/> :
                          value
                        }
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

export default Info = createContainer( props => {
  const editHistory = EditHistory.find({
      ID: props.gene.ID
    },{
      sort: {
        date: -1
      }
    }).fetch();

  return {
    gene: props.gene,
    editHistory: editHistory
  }
}, _Info)