import React from 'react';

import { updateAttributeInfo } from '/imports/api/genes/updateAttributeInfo.js';
import logger from '/imports/api/util/logger.js';

class EditAttributeInfo extends React.PureComponent {
  constructor(props){
    super(props)
    const { defaultShow, defaultSearch } = props;
    this.state = {
      defaultSearch,
      defaultShow
    }
  }

  update = event => {
    const field = event.target.id;
    this.setState({
      [field]: !this.state[field]
    })
  }

  saveChanges = () => {
    const { _id: attributeId, toggleEdit } = this.props;
    const { defaultShow, defaultSearch } = this.state;
    updateAttributeInfo.call({ attributeId, defaultShow, defaultSearch }, (err,res) => {
      if (err) {
        logger.warn(err);
        alert(err);
      }
    })
    toggleEdit()
  }

  render(){
    const { name, query, toggleEdit } = this.props;
    const { defaultShow, defaultSearch } = this.state;
    logger.debug( defaultShow, defaultSearch )
    const hasChanges = !(defaultShow === this.props.defaultShow && defaultSearch === this.props.defaultSearch)
    return <tr>
      <td>
        { name }
      </td>
      <td>
        <code> { query } </code>
      </td>
      <td>
        <input type="checkbox" checked={defaultShow} id='defaultShow' onChange={this.update}/>
      </td>
      <td>
        <input type="checkbox" checked={defaultSearch} id='defaultSearch' onChange={this.update} />
      </td>
      <td>
        <div className='btn-group btn-group-justified'>
          <button
            type='button' 
            className='btn btn-outline-success btn-sm px-2 py-0'
            onClick={this.saveChanges}
            disabled={!hasChanges} >
            <span className="icon-check" /> Save
          </button>
          <button 
            type='button' 
            className='btn btn-outline-dark btn-sm px-2 py-0'
            onClick={toggleEdit} >
            <span className="icon-remove" /> Cancel
          </button>
        </div>
      </td>
    </tr>
  }
}

const AttributeInfoLine = ({_id: attributeId, name, query, defaultShow, defaultSearch, toggleEdit }) => {
  return <tr>
    <td>
      { name }
    </td>
    <td>
      <code> { query } </code>
    </td>
    <td>
      <input type="checkbox" checked={defaultShow} disabled />
    </td>
    <td>
      <input type="checkbox" checked={defaultSearch} disabled />
    </td>
    <td>
      <button type='button' className='btn btn-sm btn-outline-dark py-0 px-2' onClick={toggleEdit}>
        <span className='icon-pencil' /> Edit
      </button>
    </td>
  </tr>
}

export default class AttributeInfo extends React.PureComponent {
  constructor(props){
    super(props)
    this.state = {
      isEditing: false
    }
  }

  toggleEdit = () => {
    this.setState({
      isEditing: !this.state.isEditing
    })
  }

  render(){
    const { isEditing } = this.state;
    return (
      isEditing ?
      <EditAttributeInfo {...this.props} toggleEdit={this.toggleEdit} /> :
      <AttributeInfoLine {...this.props} toggleEdit={this.toggleEdit} />
    )
  }
}