import React from 'react';

const ThreewayRadioButtons = ({attribute, onClick}) => {
  const options = {
    'yes': {
      labelClass: 'btn btn-outline-success',
      iconClass: 'fa fa-check' 
    },
    'no': {
      labelClass: 'btn btn-outline-danger',
      iconClass: 'fa fa-remove'
    },
    'either': {
      labelClass: 'btn btn-outline-secondary active',
      iconClass: 'fa fa-dot-circle-o'
    }
  };
  return (
    <div className="threeway-radio row justify-content-between" >
      <label htmlFor={attribute}>{attribute} </label>
      <div 
        className="btn-group btn-group-toggle btn-group-sm float-right" 
        id={attribute} 
        data-toggle="buttons" >
        {
          Object.entries(options).map(opt => {
            const [optionValue, params] = opt;
            const { labelClass, iconClass } = params;
            return (
              <label 
                key={optionValue} 
                className={labelClass} 
                onClick={()=>{onClick(attribute, optionValue)}}
                id={attribute} >
                <input type="radio" autoComplete="off" />
                <i className={iconClass} aria-hidden="true" />
              </label>
            )
          })
        }
      </div>
    </div>
  )
}

export default ThreewayRadioButtons