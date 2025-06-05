import React, { Component } from 'react';
import Select from 'react-select';
import CustomMenuList from './CustomMenuList';
import axios from 'axios';
import { isArray } from 'lodash';

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
    options.forEach(({ name, id, email, title }) => {
      const optionValue = name || email;
      const label = name && title ? `${name} (${title})` : optionValue;
      if (!modifiedOptions.find(option => option.label === label)) {
        modifiedOptions.push({ label, value: id, email });
      } else {
        modifiedOptions.push({ label: email, value: id, email });
      }
    });
    return modifiedOptions;
  }

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
    this.setState({ currentQuery: inputValue, page: 1, options: [], hasMore: true }, () => {
      this.getOptions(inputValue, 1);
    });
    return newValue;
  }

/*   handleMenuScrollToBottom = () => {
    const { hasMore, page, currentQuery, options } = this.state;
    const currentOptionCount = options.length;

    // Define your page size (should match backend `limit`)
    const pageSize = 100;

    // If we already have enough options for the next page, don't fetch again
    const expectedLoadedCount = page * pageSize;
    if (currentOptionCount < expectedLoadedCount) {
      console.log("Already prefetched page", page + 1);
      return;
    }

    if (hasMore) {
      const nextPage = page + 1;
      console.log(`Prefetching page ${nextPage}...`);
      this.getOptions(currentQuery || "*", nextPage).catch(console.error);
    }
  } */

  loadMoreOptions = async (nextPage) => {
    if (this.state.loadingMore) return;

    this.setState({ loadingMore: true });

    console.log("Loading more options for page:", nextPage);

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
        loadingMore: false  // ✅ release after loading
      }));
    } catch (err) {
      console.error("loadMoreOptions failed:", err);
      this.setState({ loadingMore: false }); // ✅ also release on error
    }
  };

  handleChange = (value) => {
    this.setState({ currentValue: value });

    if (!isArray(value)) {
      value && this.props.input.onChange(value.value);
    } else {
      const returnValue = value.map(item => item.value);
      this.props.input.onChange(returnValue);
    }
  }

  render() {
    return (
      <div id="test" className="ad-combobox">
        <Select
          components={{ MenuList: CustomMenuList }}
          value={this.state.currentValue}
          options={this.state.options}
          page={this.state.page}
          hasMore={this.state.hasMore}
          loadMoreOptions={this.loadMoreOptions}
          loadingMore={this.state.loadingMore}
          onInputChange={this.handleInputChange}
          //onMenuScrollToBottom={this.handleMenuScrollToBottom}
          onChange={this.handleChange}
          isDisabled={this.props.disabled}
          isMulti={this.props.multiselect}
          placeholder={this.props.placeholder}
          isClearable={true}
          onBlur={this.props.onBlur}
          inputId={this.props.name}
          styles={{
            menu: (provided) => ({ ...provided, zIndex: 9999 }) // Ensure it stays above modals
          }}
        />
      </div>
    );
  }
}

export default CustomADUserCombobox;