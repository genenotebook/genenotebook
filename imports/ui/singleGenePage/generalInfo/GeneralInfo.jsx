import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import find from 'lodash/find';
import cloneDeep from 'lodash/cloneDeep';
import { diff, apply } from 'rus-diff'; 

import { EditHistory } from '/imports/api/genes/edithistory_collection.js';
import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import { updateGene } from '/imports/api/genes/updateGene.js';

import AttributeValue from './AttributeValue.jsx';

//import { withEither } from '/imports/ui/util/uiUtil.jsx';
//
//import { AttributeValue } from '/imports/ui/genetable/GeneTableBody.jsx';

import './generalInfo.scss';

const canEdit = () => {
  return true
}

const Controls = (props) => {
  return (
    <div>
      {
        props.showHistory &&
        <button type="button" className="btn btn-outline-dark btn-sm float-right px-2 py-0 viewingHistory" onClick={props.toggleHistory}>
          <span className="icon-history" aria-hidden="true" /> Hide history
        </button>
      }
      {
        props.totalVersionNumber > 0 && !props.isEditing && !props.showHistory &&
        <button type="button" className="btn btn-outline-dark btn-sm float-right px-2 py-0 viewingHistory" onClick={props.toggleHistory}>
          <i className="icon-history" aria-hidden="true"></i> 
          &nbsp;Show history&nbsp;
          <span className="badge badge-dark">{ props.totalVersionNumber }</span>
        </button>
      }
      {
        canEdit() && !props.isEditing && !props.showHistory &&
        <button type="button" className="btn btn-outline-dark btn-sm float-right px-2 py-0 edit border" onClick={props.startEdit}>
          <span className="icon-pencil" aria-hidden="true" /> Edit
        </button>
      }
      {
        canEdit() && props.isEditing && !props.showHistory &&
        <div className="btn-group float-right">
          <button type="button" className="btn btn-outline-success px-2 py-0 btn-sm save" onClick={props.saveEdit}>
            <span className="icon-floppy" aria-hidden="true" /> Save
          </button>
          <button type="button" className="btn btn-outline-danger btn-sm px-2 py-0 cancel" onClick={props.cancelEdit}>
            <span className="icon-cancel" aria-hidden="true" /> Cancel
          </button>
        </div>
      }
    </div>
  )
}

const VersionHistory = (props) => {
  const hasNextVersion = props.currentVersionNumber < props.totalVersionNumber;
  const nextText = hasNextVersion ? 'Next version' : 'No next version available';

  const hasPreviousVersion = props.currentVersionNumber != 0;
  const previousText = hasPreviousVersion ? 'Previous version' : 'No previous version available';
  return (
    <div>
      <div className="alert alert-primary" role="alert">
        <span className="icon-exclamation" aria-hidden="true" /> You are watching 
        version <span className='badge badge-light'> { props.currentVersionNumber + 1 } / { props.totalVersionNumber + 1 } </span> 
        &nbsp;of this gene by user Foobar Baz { /*props.editBy*/ } at { props.editAt }&nbsp;
        { 
          Roles.userIsInRole(Meteor.userId(),'admin') &&
          <button type='button' className="button btn-sm btn-primary px-2 py-0" onClick = {props.restoreVersion}>
            Revert to this version
          </button>
        }
      </div>
      <div className="pager">
        <button className="btn btn-sm btn-outline-dark px-2 py-0" name="previous" onClick={ props.selectVersion } disabled={!hasPreviousVersion}>
          <span className={`${hasPreviousVersion ? 'icon-left' : 'icon-block'}`} aria-hidden="true" /> {previousText}
        </button>
        <button className="btn btn-sm btn-outline-dark px-2 py-0 float-right" name="next" onClick={ props.selectVersion } disabled={!hasNextVersion}>
         {nextText} <span className={`${hasNextVersion ? 'icon-right' : 'icon-block'}`} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

const AttributeInput = ({ name, value, onChange, deleteAttribute }) => {
  return <div className='d-flex justify-content-between'>
    <textarea className='form-control'
      {...{ name, value, onChange }} />
    <button type='button' name={name}
      className='btn btn-outline-danger btn-sm'
      onClick={deleteAttribute.bind(this, name)}>
      <span className='icon-trash' /> 
    </button>
  </div>
}

const geneInfoDataTracker = props => {
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

  const attributeNames = attributeCollection.find({
    reserved: false
  },{
    field: name
  }).map( attribute => attribute.name)

  return {
    gene: props.gene,
    editHistory: editHistory,
    attributeNames: attributeNames
  }
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
    const geneId = this.props.gene.ID;

    console.log(update)

    updateGene.call({ geneId, update }, (err, res) => {
      if ( err ) {
        console.log(err)
        alert(err)
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
    const { gene, genome } = this.props;
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
                <td>Gene ID</td>
                <td>{ gene.ID }</td>
              </tr>
              <tr>
                <td>Genome</td>
                <td>{ genome.name } <small>({genome.organism})</small></td>
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
                gene.orthogroupId &&
                <tr>
                  <td>Orthogroup</td>
                  <td>{ gene.orthogroupId }</td>
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
                          <AttributeValue attributeValue={value} />
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
                    <div className="input-group-sm">
                      <div className='input-group-prepend'>
                        <span className="input-group-text">Key</span>
                      </div>
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
                    <div className='input-group-sm'>
                      <div className='input-group-prepend'>
                        <span className="input-group-text">Value</span>
                      </div>
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
                className = 'btn btn-outline-success btn-sm px-2 py-0'
                onClick = {this.startAddingAttribute}>
                <span className="icon-plus" /> Add new attribute
              </button>
            </div>
          }
        </div>
      </div>
    )
  }
}

export default withTracker(geneInfoDataTracker)(Info);