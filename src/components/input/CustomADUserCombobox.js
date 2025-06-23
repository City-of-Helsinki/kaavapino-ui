import React, { Component } from 'react';
import Select from 'react-select';
import CustomMenuList from './CustomMenuList';
import CustomDropdownIndicator from './CustomDropdownIndicator';
import axios from 'axios';

const hdsLikeStyles = {
  control: (provided, state) => ({
    ...provided,
    border: '2px solid #808080',
    borderRadius: '0',
    minHeight: '56px',
    paddingLeft: '8px',
    paddingRight: '8px',
    backgroundColor: state.isDisabled ? '#f2f2f2' : '#fff',
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      borderColor: '#000',
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#d1d1d1',
    fontSize: '16px',
    lineHeight: '24px',
    whiteSpace: 'nowrap',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#1a1a1a',
    fontSize: '16px',
    lineHeight: '24px',
  }),
  input: (provided) => ({
    ...provided,
    fontSize: '16px',
    color: '#1a1a1a',
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    padding: '8px',
    color: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    border: '1px solid #ccc',
    borderRadius: '2px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
    boxSizing: 'border-box'
  }),
  menuList: (provided) => ({
    ...provided,
    overflowX: 'hidden',
    paddingRight: 0,
    boxSizing: 'border-box',
    wordBreak: 'break-word',
  }),
};

class CustomADUserCombobox extends Component {
  constructor() {
    super();
    this.state = {
      options: [],
      currentQuery: "",
      currentValue: null,
      page: 1,
      hasMore: true,
      loadingMore: false
    };
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

      const option = {
        label,
        value: id,  // required for react-select to work
        id,
        email
      };

      // avoid duplicates
      if (!modifiedOptions.find(o => o.label === label)) {
        modifiedOptions.push(option);
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
        hasMore
      }));
    } catch (err) {
      console.error("Error fetching personnel:", err);
    }
  }

  handleInputChange = (newValue) => {
    const inputValue = newValue.replace(/\W/g, '');
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(inputValue);

    // If UUID, fetch directly
    if (isUUID) {
      this.setState({ currentQuery: inputValue }, () => {
        this.getPersonById(inputValue); // new helper
      });
    }
    else if (inputValue.length >= 3 || inputValue === '*') { // Otherwise: search if long enough
      this.setState(
        { currentQuery: inputValue, page: 1, hasMore: true },
        () => {
          this.getOptions(inputValue, 1);
        }
      );
    }

    return newValue;
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
    this.setState({ ...this.state, currentValue: value, options: [] });
    // Multiselect case
    if (Array.isArray(value)) {
      console.log("array")
      const returnValue = value.map(item => ({
        id: item.value,
        label: item.label,
        email: item.email
      }));
      this.props.input.onChange(returnValue);
    }
    else if (value && typeof value === 'object') {// Single-select mode
      const stringValue = value.id || value.label || '';
      this.props.input.onChange(stringValue);
      return;
    }
    else{
      // Cleared or invalid selection
      this.props.input.onChange('');
    }
  };

  
  handleMenuOpen = () => {
    if (this.state.options.length === 0) {
      this.getOptions("*", 1);
    }
  };

  render() {
    return (
      <div id="test" className="ad-combobox">
        <Select
          components={{ MenuList: CustomMenuList, DropdownIndicator: CustomDropdownIndicator }}
          value={this.state.currentValue || ""}
          options={this.state.options}
          page={this.state.page}
          hasMore={this.state.hasMore}
          loadMoreOptions={this.loadMoreOptions}
          loadingMore={this.state.loadingMore}
          onMenuOpen={this.handleMenuOpen}
          onInputChange={this.handleInputChange}
          onChange={this.handleChange}
          isDisabled={this.props.disabled}
          isMulti={this.props.multiselect}
          placeholder={this.props.placeholder}
          isClearable={true}
          onBlur={this.props.onBlur}
          inputId={this.props.name}
          styles={hdsLikeStyles}
        />
      </div>
    );
  }
}

export default CustomADUserCombobox;