import React, { Component } from 'react'
import { Combobox } from 'hds-react'
import axios from 'axios'
import { isArray } from 'lodash';

class CustomADUserCombobox extends Component {
  state = {
    options: [],
    currentQuery: null,
    currentValue: null
  }

  componentDidMount() {
    this.getPerson()
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
        modifiedOptions.push({ label: email, id })
      } else {
        modifiedOptions.push({ label: label, id })
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
  }

  getOptions = async query => {
    if (!query || query === this.state.currentQuery || query.length < 3) {
      return []
    }
    await axios.get(`/v1/personnel/?search=${query}`).then(response => {
      const result = response.data

      this.setState({
        ...this.state,
        options: this.modifyOptions(result),
        currentQuery: query
      })
    })
  }
  handleFilter = (items, search) => {   
    setTimeout(() => {
      this.getOptions(search)
    }, 300)

    return items
  }

  render() {

    return (
      <div id="test" className="ad-combobox">
        <Combobox
          options={this.state.options}
          multiselect={this.props.multiselect}
          filter={this.handleFilter}
          placeholder={this.props.placeholder}
          disabled={this.props.disabled}
          clearable={true}
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
        />
      </div>
    )
  }
}

export default CustomADUserCombobox
