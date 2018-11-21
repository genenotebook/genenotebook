import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import find from 'lodash/find';
import { cloneDeep, isEqual } from 'lodash';
import { diff, apply } from 'rus-diff'; 

import { EditHistory } from '/imports/api/genes/edithistory_collection.js';
import { attributeCollection } from '/imports/api/genes/attributeCollection.js';
import { updateGene } from '/imports/api/genes/updateGene.js';
import { getUserName } from '/imports/api/users/getUserName.js';
import logger from '/imports/api/util/logger.js';

import AttributeValue from '/imports/ui/genetable/columns/AttributeValue.jsx';

import './generalInfo.scss';

const Controls = ({ showHistory, totalVersionNumber, isEditing, toggleHistory, 
  saveEdit, startEdit, cancelEdit }) => {
  
  const canEdit = Roles.userIsInRole(Meteor.userId(), ['admin', 'curator']);
  
  return <div>
    {
      showHistory &&
      <button type="button" onClick={toggleHistory}
        className="btn btn-outline-dark btn-sm float-right px-2 py-0 viewingHistory" >
        <span className="icon-history" aria-hidden="true" /> Hide history
      </button>
    }
    {
      totalVersionNumber > 0 && !isEditing && !showHistory &&
      <button type="button" onClick={toggleHistory}
        className="btn btn-outline-dark btn-sm float-right px-2 py-0 viewingHistory" >
        <i className="icon-history" aria-hidden="true"></i> 
        &nbsp;Show history&nbsp;
        <span className="badge badge-dark">{ totalVersionNumber }</span>
      </button>
    }
    {
      canEdit && !isEditing && !showHistory &&
      <button type="button" onClick={startEdit}
        className="btn btn-outline-dark btn-sm float-right px-2 py-0 edit border">
        <span className="icon-pencil" aria-hidden="true" /> Edit
      </button>
    }
    {
      canEdit && isEditing && !showHistory &&
      <div className="btn-group float-right">
        <button type="button" onClick={saveEdit}
          className="btn btn-outline-success px-2 py-0 btn-sm save">
          <span className="icon-floppy" aria-hidden="true" /> Save
        </button>
        <button type="button" onClick={cancelEdit}
          className="btn btn-outline-danger btn-sm px-2 py-0 cancel" >
          <span className="icon-cancel" aria-hidden="true" /> Cancel
        </button>
      </div>
    }
  </div>
}

class VersionHistory extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      userName: '...'
    }
  }

  componentDidMount = () => {
    const userId = this.props.editBy
    getUserName.call({ userId }, (err,res) => {
      if (err) logger.warn(err);
      this.setState({
        userName: res
      })
    })
  }

  render(){
    const { currentVersionNumber, totalVersionNumber, 
      restoreVersion, selectVersion, editAt, ...props } = this.props;
    const { userName } = this.state;
    const hasNextVersion = currentVersionNumber < totalVersionNumber;
    const nextText = hasNextVersion ? 'Next version' : 'No next version available';

    const hasPreviousVersion = currentVersionNumber != 0;
    const previousText = hasPreviousVersion ? 'Previous version' : 'No previous version available';
    return (
      <div>
        <div className="alert alert-primary d-flex justify-content-between" role="alert">
          <div>
            <span className="icon-exclamation" aria-hidden="true" /> 
            You are watching version <span className='badge badge-light'> 
              { currentVersionNumber + 1 } / { totalVersionNumber + 1 } 
            </span> of this gene. <br/>
          </div>
          <div> 
            Edit by { userName } at { editAt }. <br/>
          </div>
          { 
            Roles.userIsInRole(Meteor.userId(),'admin') &&
            <button type='button' className="button btn-sm btn-primary px-2 py-0" 
            onClick = {restoreVersion}>
              Revert to this version
            </button>
          }
        </div>
        <div className="pager">
          <button className="btn btn-sm btn-outline-dark px-2 py-0" name="previous" 
            onClick={ selectVersion } disabled={!hasPreviousVersion}>
            <span className={`${hasPreviousVersion ? 'icon-left' : 'icon-block'}`} 
              aria-hidden="true" /> {previousText}
          </button>
          <button className="btn btn-sm btn-outline-dark px-2 py-0 float-right" 
            name="next" onClick={ selectVersion } disabled={!hasNextVersion}>
            {nextText} 
            <span className={`${hasNextVersion ? 'icon-right' : 'icon-block'}`} 
              aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }
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

const geneInfoDataTracker = ({ gene, ...props }) => {
  Meteor.subscribe('editHistory');
  Meteor.subscribe('attributes');

  const editHistory = EditHistory.find({
      ID: gene.ID
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
    gene,
    editHistory,
    attributeNames
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
    this.setState({ reversions: version })
  }

  startEdit = () => {
    logger.debug('start editing')
    //implement logic to lock gene from being edited by others
    this.setState({ isEditing: true })
  }

  saveEdit = () => {
    logger.debug('save edit')
    logger.debug(this.state)

    const { newAttributeKey, newAttributeValue, attributes, newAttributes } = this.state;
    const { gene: oldGene } = this.props;

    oldGene.attributes = attributes;
    
    const newGene = cloneDeep(oldGene);
    if (newAttributes){
      newGene.attributes = newAttributes
    }
    newGene.changed = true;
    if (newAttributeKey || newAttributeValue){
      if (!(newAttributeKey && newAttributeValue)){
        if (!newAttributeKey){
          alert('New attribute key required')
        } else {
          alert('New attribute value required!')
        }
        throw new Meteor.Error('Incorrect new attribute')
      } else {
        if (!newGene.attributes){
          newGene.attributes = {}
        }
        newGene.attributes[newAttributeKey] = newAttributeValue;
      }
    }

    const update = diff(oldGene, newGene)
    const geneId = oldGene.ID;

    logger.debug(update)

    updateGene.call({ geneId, update }, (err, res) => {
      if ( err ) {
        logger.warn(err)
        alert(err)
      }
    })

    //save changes and unlock gene so it can be edited by others again
    this.setState({ 
      isEditing: false,
      newAttributes: undefined,
      attributes: newAttributes,
      addingNewAttribute: false
    })
  }

  cancelEdit = () => {
    logger.debug('cancel edit')
    //unlock gene so it can be edited by others again
    this.setState({ 
      isEditing: false,
      newAttributes: undefined,
      addingNewAttribute: false 
    })
  }

  restoreVersion = () => {
    logger.debug('restoreVersion')
  }

  deleteAttribute = (key) => {
    const { newAttributes: _newAttributes, attributes } = this.state;
    let newAttributes = _newAttributes ? cloneDeep(_newAttributes) : cloneDeep(attributes);
    delete newAttributes[key];
    this.setState({ newAttributes });
  }

  changeAttributeValue = (event) => {
    event.preventDefault();
    const { target: { name, value }} = event;
    const { newAttributes: _newAttributes, attributes } = this.state;
    const newAttributes = _newAttributes ? cloneDeep(_newAttributes) : cloneDeep(attributes);
    newAttributes[name] = value;
    this.setState({ newAttributes });
  }

  startAddingAttribute = () => {
    this.setState({
      addingNewAttribute: true
    })
  }

  addNewAttributeKey = (event) => {
    const newAttributeKey = event.target.value;
    this.setState({ newAttributeKey });
  }

  addNewAttributeValue = (event) => {
    const newAttributeValue = event.target.value;
    this.setState({ newAttributeValue });
  }

  toggleHistory = () => {
    const { attributes } = this.props.gene;
    this.setState({
      reversions: 0,
      showHistory: !this.state.showHistory,
      newAttributes: undefined,
      attributes
    })
  }

  selectVersion = (event) => {
    logger.debug(event.target.name)
    const increment = event.target.name === 'previous' ? 1 : -1;
    const { editHistory } = this.props;
    const currentGene = cloneDeep(this.props.gene);
    const reversions = this.state.reversions + increment;
    if (0 <= reversions && reversions <= this.props.editHistory.length){
      const previousGene = editHistory
        .slice(0, reversions)
        .reduce( (gene,reversion) => {
          logger.debug({ reversion })
          apply(gene, JSON.parse(reversion.revert))
          return gene
        }, currentGene )

      const { attributes } = previousGene;
      this.setState({
        reversions,
        attributes
      })
    }
  }

  render(){
    const { gene, genome } = this.props;
    const attributes = this.state.newAttributes ? this.state.newAttributes : this.state.attributes;

    const currentVersion = this.props.editHistory[0]

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