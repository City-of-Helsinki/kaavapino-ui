import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import DropdownFilter from './DropdownFilter'
import projectUtils from '../../../utils/projectUtils'
import { Grid } from 'semantic-ui-react'
import CustomADUserCombobox from '../../input/CustomADUserCombobox'
function FilterList({ filterList, currentFilter, onChange, defaultYear, onUserChange }) {
  const [filters, setFilters] = useState(currentFilter)

  useEffect(() => {
    setFilters(currentFilter)
  }, [currentFilter])

  const formatOptions = field => {
    let options = field.choices
    if (field.accepts_year) {
      options = projectUtils.generateArrayOfYearsForChart(field.parameter)
    }

    return options.map(option => {
      return {
        key: option.value,
        value: option.value,
        label: option.label,
        parameter: field.parameter
      }
    })
  }

  const getDefaultValue = field => {
    if (field && field.accepts_year) {
      return defaultYear
    }
    return filters && filters[field.parameter] ? filters[field.parameter] : null
  }

  const getFiltersList = () => {
    if (!filterList) {
      return null
    }
    return filterList.map((field, index) => {
      if (field.value_type === 'user') {
        return (
          <Grid.Column key={index}>
            <CustomADUserCombobox
              label={field.name}
              input={{
                onChange: value => {
                  onUserChange(value, field.parameter)
                }
              }}
              multiselect={true}
              placeholder={field.name}
            />
          </Grid.Column>
        )
      }
      return (
        <Grid.Column key={index}>
          <DropdownFilter
            key={field + index}
            name={field.name}
            defaultValue={getDefaultValue(field)}
            options={formatOptions(field)}
            placeholder={field.name}
            onChange={onChange}
            type={field.type}
            multiSelect={!field.accepts_year}
            yearSelect={field.accepts_year}
          />
        </Grid.Column>
      )
    })
  }

  return (
    <div className="filters-list">
      <Grid stackable columns="equal">
        {getFiltersList()}
        {/*
          TODO: Problems with HDS component. Needs to follow when there are updates.
        showClearButton && !isEmpty(filterList) && (
          <Grid.Column>
            <Button variant="secondary" onClick={onClear} className="filter-button">
              {t('overview.clear-selections')}
            </Button>
          </Grid.Column>
        )*/}
      </Grid>

      <span></span>
    </div>
  )
}

FilterList.propTypes = {
  filterList: PropTypes.array
}

export default FilterList
