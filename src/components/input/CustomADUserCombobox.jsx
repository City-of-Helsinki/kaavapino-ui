import React, { Component } from 'react'
import { Combobox } from 'hds-react'
import PropTypes from 'prop-types'
import axios from 'axios'

class CustomADUserCombobox extends Component {
  constructor() {
    super();
    this.loadingPlaceholder = { label: "Ladataan...", value: null };
    this.state = {
      options: [ this.loadingPlaceholder ],
      currentQuery: "*",
      currentValue: null,
      page: 1,
      hasMore: true,
      loadingInitial: true,
      loadingMore: false,
    };
    this.timer = null;
  }

  componentDidMount() {
    this.getPerson().catch(err => console.error(err));
  }

  getModifiedOption = ({ name, id, email, title }) => {
    const option = name || email;
    const label = name && title ? `${name} (${title})` : option;
    return { label, value: id, email };
  }

  modifyOptions = (options) => {
    const modifiedOptions = [];

    if (options.length === 0) return [];

    options.forEach(({ name, id, email, title }) => {
      if (!id) return;

      const optionValue = name || email;
      const label = name && title ? `${name} (${title})` : optionValue;

      if (!modifiedOptions.some(option => option.label === label)) {
        modifiedOptions.push({ label, id, value:id, email });
      }
    });

    return modifiedOptions;
  };

  getPerson = async () => {
    if (!this.props.input.value) return;

    try {
      const response = await axios.get(`/v1/personnel/${this.props.input.value}`);
      const person = response.data;
      this.setState({
        currentValue: {
          label: person.name,
          value: person.id
        }
      });
    } catch (err) {
      console.error(err);
    }
  }

  getPersonById = async (id) => {
    try {
      const response = await axios.get(`/v1/personnel/${id}`);
      const person = response.data;

      this.setState({
        currentValue: {
          label: person.name,
          value: person.id
        },
        options: [{ label: person.name, value: person.id, email: person.email }]
      });
    } catch (err) {
      console.error("getPersonById failed:", err);
    }
  };

  getOptions = async (query = "*", page = 1) => {
    const limit = 100;
    const offset = (page - 1) * limit;

    try {
      const url =
        query === "*"
          ? `/v1/personnel/?limit=${limit}&offset=${offset}`
          : `/v1/personnel/?search=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
      const response = await axios.get(url);
      const result = response.data;

      const modifiedResults = this.modifyOptions(result);
      const hasMore = result.length === limit;

      this.setState(prev => ({
        options: page === 1 ? modifiedResults : [...prev.options, ...modifiedResults],
        currentQuery: query,
        page,
        hasMore,
        loadingInitial: false,
      }));
    } catch (err) {
      console.error("Error fetching personnel:", err);
    }
  }

  handleInputChange = (newValue) => {
    if (newValue === this.state.currentQuery) return;
    
    const inputValue = newValue.replaceAll(/[^0-9a-zA-ZåäöÅÄÖ'\s-]/g, '');
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(inputValue);

    // Prevents inf loop when newValue has special characters (and currentQuery was sanitized)
    // Also handles case when "" is changed to "*"
    if (inputValue === this.state.currentQuery) return;

    if (isUUID) {
      this.setState({ currentQuery: inputValue }, () => {
        this.getPersonById(inputValue);
      });
    }
    else if (inputValue.length >= 2 || newValue === '*') {
      this.setState(
        { currentQuery: inputValue, page: 1, hasMore: true, loadingInitial: true, options: [this.loadingPlaceholder] },
        () => {
          // Prevent too many requests as user types
          clearTimeout(this.timer);
          this.timer = setTimeout(() => this.getOptions(inputValue, 1), 200);
        }
      );
    }
  };

  loadMoreOptions = async (nextPage) => {
    if (this.state.loadingMore) return;

    this.setState({ loadingMore: true });

    const { currentQuery } = this.state;
    const limit = 100;
    const offset = (nextPage - 1) * limit;

    try {
      const url =
        currentQuery && currentQuery !== "*"
          ? `/v1/personnel/?search=${encodeURIComponent(currentQuery)}&limit=${limit}&offset=${offset}`
          : `/v1/personnel/?limit=${limit}&offset=${offset}`;

      const response = await axios.get(url);
      const result = response.data;
      const modifiedResults = this.modifyOptions(result);
      const hasMore = result.length === limit;

      this.setState(prev => ({
        options: [...prev.options, ...modifiedResults],
        page: nextPage,
        hasMore,
        loadingMore: false
      }));
    } catch (err) {
      console.error("loadMoreOptions failed:", err);
      this.setState({ loadingMore: false });
    }
  };

  handleChange = (value) => {
    if (value === undefined || Object.is(value, this.loadingPlaceholder))
      return;
    if (Array.isArray(value) && value.some(v => (v === undefined) || Object.is(v, this.loadingPlaceholder))){
      return;
    }
    this.setState(prevState => ({ ...prevState, currentValue: value, options: []}));
    // Multiselect case
    if (Array.isArray(value)) {
      const returnValue = [];
      value.forEach(current => returnValue.push(current));
      this.props.input.onChange(returnValue);
    }
    // Single-select mode
    else if (value && typeof value === 'object') {
      const stringValue = value.id || value.label || '';
      this.props.input.onChange(stringValue);
      return;
    }
    else{
      // Cleared or invalid selection
      this.props.input.onChange('');
    }
  }

  
  handleMenuOpen = () => {
    if (this.state.options.length === 0 || Object.is(this.state.options[0], this.loadingPlaceholder)) {
      this.getOptions("*", 1);
    }
  };

  render() {
    return (
      <div id="test" className={`ad-combobox${this.state.loadingInitial ? ' loading' : ''}`}>
        <Combobox
          options={this.state.options}
          multiselect={this.props.multiselect}
          placeholder={this.props.placeholder}
          disabled={this.props.disabled}
          clearable={true}
          onChange={this.handleChange}
          filter={(_, query) => {
            this.handleInputChange(query === "" ? "*" : query);
            return this.state.options;
            }
          }
          onFocus={() => {
            this.handleMenuOpen()
          }}
          value={this.state.currentValue}
          onBlur={this.props.onBlur}
          aria-label={this.props.name}
          clearButtonAriaLabel="Tyhjennä valinta"
          selectedItemRemoveButtonAriaLabel="Poista valinta {value}"
          toggleButtonAriaLabel="Avaa valikko"
        />
      </div>
    );
  }
}

CustomADUserCombobox.propTypes = {
  multiselect: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  name: PropTypes.string,
}

export default CustomADUserCombobox;