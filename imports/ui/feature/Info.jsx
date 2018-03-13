import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import find from 'lodash/find';
import cloneDeep from 'lodash/cloneDeep';
import { diff, apply } from 'rus-diff'; 

import { EditHistory } from '/imports/api/genes/edithistory_collection.js';
import { Attributes } from '/imports/api/genes/attribute_collection.js';

import './info.scss';

const canEdit = () => {
  return true
}

const Controls = (props) => {
  return (
    <div>
      {
        props.showHistory &&
        <button type="button" className="btn btn-outline-secondary btn-sm pull-right viewingHistory" onClick={props.toggleHistory}>
          <i className="fa fa-history" aria-hidden="true"></i> Hide history
        </button>
      }
      {
        props.totalVersionNumber > 0 && !props.isEditing && !props.showHistory &&
        <button type="button" className="btn btn-outline-secondary btn-sm pull-right viewingHistory" onClick={props.toggleHistory}>
          <i className="fa fa-history" aria-hidden="true"></i> 
          &nbsp;Show history&nbsp;
          <span className="badge badge-secondary">{ props.totalVersionNumber }</span>
        </button>
      }
      {
        canEdit() && !props.isEditing && !props.showHistory &&
        <button type="button" className="btn btn-outline-secondary btn-sm pull-right edit" onClick={props.startEdit}>
          <i className="fa fa-pencil-square-o" aria-hidden="true"></i> Edit
        </button>
      }
      {
        canEdit() && props.isEditing && !props.showHistory &&
        <div className="btn-group pull-right">
          <button type="button" className="btn btn-outline-success btn-sm save" onClick={props.saveEdit}>
            <i className="fa fa-floppy-o" aria-hidden="true"></i> Save
          </button>
          <button type="button" className="btn btn-danger btn-sm cancel" onClick={props.cancelEdit}>
            <i className="fa fa-times" aria-hidden="true"></i> Cancel
          </button>
        </div>
      }
    </div>
  )
}

const VersionHistory = (props) => {
  const hasNextVersion = props.currentVersionNumber < props.totalVersionNumber;
  const hasPreviousVersion = props.currentVersionNumber != 0;
  return (
    <div>
      <div className="alert alert-danger" role="alert">
        <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
        You are watching version <b>{ props.currentVersionNumber } / { props.totalVersionNumber } </b> 
        of this gene by { props.editBy } at { props.editAt }.
        { 
          Roles.userIsInRole(Meteor.userId(),'admin') &&
          <a href="#" className="alert-link" onClick = {props.restoreVersion}>Click here to revert to this version.</a>
        }
      </div>
      <div className="pager">
        <button className="btn btn-sm btn-dark" name="previous" onClick={ props.selectVersion } disabled={!hasPreviousVersion}>
          <i className={`fa ${hasPreviousVersion ? 'fa-arrow-left' : 'fa-ban'}`} aria-hidden="true"></i> Older
        </button>
        <button className="btn btn-sm btn-dark pull-right" name="next" onClick={ props.selectVersion } disabled={!hasNextVersion}>
          Newer <i className={`fa ${hasNextVersion ? 'fa-arrow-right' : 'fa-ban'}`} aria-hidden="true"></i>
        </button>
      </div>
    </div>
  )
}

const AttributeInput = (props) => {
  return (
    <div className="input-group">
      <input 
        type = "text" 
        className = "form-control" 
        onChange = { props.onChange } 
        name = { props.name } 
        value = { props.value } />
      <div className="input-group-append">
        <button 
          type="button"
          className="btn btn-danger"
          name={props.name}
          onClick = {props.deleteAttribute.bind(this,props.name)}>
          <span className="fa fa-trash-o"/>
        </button>
      </div>
    </div>
  )
}

class Info extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      reversions: 0,
      attributes: this.props.gene.attributes,
      newAttributes: undefined,
      isEditing: false,
      addingNewAttribute: false,
      showHistory: false,
      newAttributeKey: undefined,
      newAttributeValue: undefined
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
    console.log(this.state)
    
    const oldGene = this.props.gene;
    oldGene.attributes = this.state.attributes;
    
    const newGene = cloneDeep(this.props.gene);
    if (this.state.newAttributes){
      newGene.attributes = this.state.newAttributes
    }
    newGene.changed = true;
    if (this.state.newAttributeKey || this.state.newAttributeValue){
      if (!(this.state.newAttributeKey && this.state.newAttributeValue)){
        if (!this.state.newAttributeKey){
          alert('New attribute key required')
        } else {
          alert('New attribute value required!')
        }
        throw new Meteor.Error('Incorrect new attribute')
      } else {
        if (!newGene.attributes){
          newGene.attributes = {}
        }
        newGene.attributes[this.state.newAttributeKey] = this.state.newAttributeValue;
      }
    }

    const update = diff(oldGene, newGene)
    const revert = diff(newGene, oldGene)
    const geneId = this.props.gene.ID;

    Meteor.call('updateGeneInfo',geneId,update,revert,(err,res) => {
      if (err) {
        console.error(err)
      }
      if (res) {
        console.log(res)
      }
    })
    //save changes and unlock gene so it can be edited by others again
    this.setState({ 
      isEditing: false,
      newAttributes: undefined,
      attributes: this.state.newAttributes,
      addingNewAttribute: false
    })
  }

  cancelEdit = () => {
    console.log('cancel edit')
    //unlock gene so it can be edited by others again
    this.setState({ 
      isEditing: false,
      newAttributes: undefined,
      addingNewAttribute: false 
    })
  }

  restoreVersion = () => {
    console.log('restoreVersion')
  }

  deleteAttribute = (key) => {
    let attributes = this.state.newAttributes ? cloneDeep(this.state.newAttributes) : cloneDeep(this.state.attributes);
    delete attributes[key];
    this.setState({
      newAttributes: attributes
    })
  }

  changeAttributeValue = (event) => {
    event.preventDefault();
    const value = event.target.value;
    const key = event.target.name;
    let attributes = this.state.newAttributes ? this.state.newAttributes : cloneDeep(this.state.attributes);
    attributes[key] = value;
    this.setState({
      newAttributes: attributes
    })
  }

  startAddingAttribute = () => {
    this.setState({
      addingNewAttribute: true
    })
  }

  addNewAttributeKey = (event) => {
    const newAttributeKey = event.target.value;
    this.setState({
      newAttributeKey: newAttributeKey
    })
  }

  addNewAttributeValue = (event) => {
    const addNewAttributeValue = event.target.value;
    this.setState({
      newAttributeValue: addNewAttributeValue
    })
  }

  toggleHistory = () => {
    this.setState({
      reversions: 0,
      showHistory: !this.state.showHistory,
      newAttributes: undefined,
      attributes: this.props.gene.attributes
    })
  }

  selectVersion = (event) => {
    const increment = event.target.name === 'previous' ? 1 : -1
    const reversions = this.state.reversions + increment;
    if (0 <= reversions && reversions <= this.props.editHistory.length){
      const gene = this.props.editHistory.slice(0, reversions).reduce( (gene,reversion) => {
        apply(gene,JSON.parse(reversion.revert))
        return gene
      },cloneDeep(this.props.gene))

      const attributes = gene.attributes;
      this.setState({
        reversions: reversions,
        attributes: attributes
      })
    }
  }

  render(){
    const gene = this.props.gene;
    const attributes = this.state.newAttributes ? this.state.newAttributes : this.state.attributes;

    const currentVersion = this.props.editHistory[0]

    const interproDomains = gene.subfeatures.filter(sub => {
      return sub.type === 'mRNA' && typeof sub.protein_domains !== 'undefined'
    }).map(sub => {
      return sub.protein_domains.filter(domain => {
        return typeof domain.dbxref !== 'undefined'
      }).map(domain => {
        return domain.dbxref.filter(dbxref => /^InterPro.*/.test(dbxref))
      })
    })

    //console.log(interproDomains)

    return (
      <div id="info">
        <Controls
          showHistory = { this.state.showHistory }
          toggleHistory = { this.toggleHistory }
          totalVersionNumber = { this.props.editHistory.length }
          currentVersionNumber = { this.props.editHistory.length - this.state.reversions }
          isEditing = { this.state.isEditing }
          startEdit = { this.startEdit }
          saveEdit = { this.saveEdit }
          cancelEdit = { this.cancelEdit }
        />
        <h3>General information</h3>
        {
          this.state.showHistory &&
          <VersionHistory 
            currentVersionNumber = { this.props.editHistory.length - this.state.reversions }
            totalVersionNumber = { this.props.editHistory.length }
            selectVersion = { this.selectVersion }
            restoreVersion = { this.restoreVersion }
            editBy = { currentVersion.user }
            editAt = { currentVersion.date.toDateString() } />
        }
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
                gene.orthogroup &&
                <tr>
                  <td>Orthogroup</td>
                  <td>{ gene.orthogroup }</td>
                </tr>
              }
              { attributes &&
                Object.keys(attributes).map(key => {
                  const value = attributes[key];
                  return (
                    <tr key = { key }>
                      <td>
                        { key }
                      </td>
                      <td>
                        {
                          this.state.isEditing ?
                          <AttributeInput 
                            name = {key} 
                            value = {value} 
                            onChange = {this.changeAttributeValue}
                            deleteAttribute = {this.deleteAttribute} /> :
                          value
                        }
                      </td>
                    </tr>
                  )
                })
              }
              {
                this.state.isEditing && this.state.addingNewAttribute &&
                <tr>
                  <td>
                    <div className="input-group">
                      <span className="input-group-addon">Key</span>
                      <input
                        list = 'attributes'
                        type = 'text'
                        className = 'form-control'
                        onChange = { this.addNewAttributeKey } />
                      <datalist id='attributes'>
                        {
                          this.props.attributeNames.map(attributeName => {
                            return (
                              <option value={attributeName} key={attributeName} />
                            )
                          })
                        }
                      </datalist>
                    </div>
                  </td>
                  <td>
                    <div className='input-group'>
                      <span className="input-group-addon">Value</span>
                      <input
                        type = 'text'
                        className = 'form-control'
                        onChange = { this.addNewAttributeValue } />
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          {
            this.state.isEditing && !this.state.addingNewAttribute &&
            <div className = 'text-center'>
              <button 
                type = 'button'
                className = 'btn btn-success'
                onClick = {this.startAddingAttribute}>
                Add new attribute
              </button>
            </div>
          }
        </div>
      </div>
    )
  }
}

export default withTracker( props => {
  Meteor.subscribe('editHistory');
  Meteor.subscribe('attributes');
  //Meteor.subscribe('singleGene',props.gene.ID)

  const editHistory = EditHistory.find({
      ID: props.gene.ID
    },{
      sort: {
        date: -1
      }
    }).fetch();

  const attributeNames = Attributes.find({
    reserved: false
  },{
    field: name
  }).map( attribute => attribute.name)

  return {
    gene: props.gene,
    editHistory: editHistory,
    attributeNames: attributeNames
  }
})(Info);