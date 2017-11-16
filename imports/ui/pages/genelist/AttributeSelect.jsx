import React from 'react';
import { cloneDeep } from 'lodash';

import ThreewayRadioButtons from './ThreewayRadioButtons.jsx';

export default class AttributeSelect extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      selectedAttributes: new Set(['Name','Comment','Note'])
    }

    handleAttributeSelect = event => {
      const attribute = event.target.id;
      const selectedAttributes = cloneDeep(this.state.selectedAttributes)
      if (selectedAttributes.has(attribute)){
        selectedAttributes.delete(attribute)
      } else {
        selectedAttributes.add(attribute)
      }
      this.setState({
        selectedAttributes: selectedAttributes
      })
    }
  }
  render(){
    const { attributes, updateAttributeFilter } = this.props;
    const { selectedAttributes } = this.state;
    return (
      <div className="attribute-select">
        <div className="dropdown">
          <button 
            className="btn btn-outline-secondary btn-sm dropdown-toggle pull-right" 
            type="button" 
            data-toggle="dropdown" 
            aria-haspopup="true" 
            aria-expanded="false" 
            id="attributemenu-button" >
            Select
          </button>
          <ul 
            className="dropdown-menu scrollable-menu pull-right" 
            role="menu" 
            aria-labelledby="attributemenu-button" >
            { 
              attributes.map(attribute => {
                const active = selectedAttributes.has(attribute.name) ? 'active' : ''
                return (
                  <li key={attribute._id} role="presentation" >
                    <a 
                      role="menuitem" 
                      className={`dropdown-item attributemenu-item ${active}`}
                      id={attribute.name}
                      onClick={this.handleAttributeSelect} >
                      {attribute.name}
                    </a>
                  </li>
                )
              })
            }
          </ul>
        </div>
        <label className="font-weight-bold">Attributes</label>
        <div className="col">
        {
          Array.from(selectedAttributes).map(attribute => {
            return <ThreewayRadioButtons 
              key={attribute} 
              attribute={attribute}
              onClick={updateAttributeFilter} />
          })
        }
        </div>
      </div>
    )
  }
}