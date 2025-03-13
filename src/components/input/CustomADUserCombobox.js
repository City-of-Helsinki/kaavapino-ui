import React, { Component } from 'react'
import { Combobox } from 'hds-react'
import axios from 'axios'
import { isArray } from 'lodash';

class CustomADUserCombobox extends Component {
  constructor() {
    super();
    this.state = {
      options: [],
      currentQuery: null,
      currentValue: null
    }
    this.timer = null;
  }

  componentDidMount() {
    this.getPerson().then(() => {}).catch(err => console.error(err));
  }

  getModifiedOption({ name, id, email, title }) {

    const option = name ? name : email
    const label = name && title ? `${name} (${title})` : option
    return { label, id }
  }

  modifyOptions = options => {
    const modifiedOptions = []

    if (options.length === 0) {
      return []
    }
    options.forEach(({ name, id, email, title }) => {
      const optionValue = name ? name : email
      const label = name && title ? `${name} (${title})` : optionValue

      if (modifiedOptions.find(option => option.label === label)) {
        modifiedOptions.push({ label: email, id, email })
      } else {
        modifiedOptions.push({ label: label, id, email })
      }
    })
    return modifiedOptions
  }
  getPerson = async () => {
    
    if ( !this.props.input.value ) {
      return null
    }
    await axios.get(`/v1/personnel/${this.props.input.value}`).then(response => {
      this.setState({
        ...this.state,
        currentValue: { label: response.data.name, id: response.data.id }
      })
    })
    .catch(error => {
      console.log(error)
    })
  }

  getOptions = async query => {
    if (!query || query === this.state.currentQuery || (query.length < 3 && query !== "*")) {
      return [];
    }
  
    try {
      const url = query === "*" ? "/v1/personnel/" : `/v1/personnel/?search=${query}`;
      const response = await axios.get(url);
      const result = response.data;
      const modifiedResults = this.modifyOptions(result); // Process data first
  
      this.setState(prevState => ({
        ...prevState,
        options: modifiedResults,
        currentQuery: query
      }));
    } catch (error) {
      console.error("Error fetching personnel:", error);
    }
  };

  render() {

    return (
      <div id="test" className="ad-combobox">
        <Combobox
          options={this.state.options}
          multiselect={this.props.multiselect}
          placeholder={this.props.placeholder}
          disabled={this.props.disabled}
          clearable={true}
          onFocus={() => {
            if (this.state.options.length === 0) {
              //Fetch all personnel at start when clicking select and filter when typing text
              this.getOptions("*").catch(err => console.error(err));
            }
          }}
          onChange={value => {
            this.setState({ ...this.state, currentValue: value, options: [] })
            if ( !isArray ( value )) {
             value && this.props.input.onChange(value.id)
            } else {
              let returnValue = []
              value.forEach( current => returnValue.push( current ))
              this.props.input.onChange( returnValue )
            }
          }}
          value={this.state.currentValue}
          onBlur={this.props.onBlur}
          aria-label={this.props.name}
        />
      </div>
    )
  }
}

export default CustomADUserCombobox
