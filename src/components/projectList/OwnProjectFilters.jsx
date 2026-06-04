import React, { useState, useEffect, useRef } from 'react'
import { Grid } from 'semantic-ui-react'
import DropdownFilter from '../overview/Filters/DropdownFilter.jsx'
import CustomADUserCombobox from '../input/CustomADUserCombobox.jsx'
import { SearchInput } from 'hds-react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

function OwnProjectFilters({ filters, ...props }) {
    const { t } = useTranslation()
    const oldValueRef = useRef('');
    const [filter, setFilter] = useState(["","",[]])
    const [filterData, setFilterData] = useState([])

    useEffect(() => {
        if(filters.length > 0){
            setFilterData(filters[2].choices)
        }
    }, [filters])

    const onSubmit = (value) => {
        let val = filter
        val[0] = value
        setFilter(val)
        const { buttonAction } = props
        buttonAction(val)
    }

     const onFilterChange = (values) => {
        let val = filter
        const { buttonAction } = props
        if(values && values.value !== oldValueRef.current){
            val[1] = values.value
            oldValueRef.current = values.value;
            setFilter(val)
            buttonAction(val)
        }
        else if (values === null && oldValueRef.current != ""){
            val[1] = ""
            oldValueRef.current = "";
            setFilter(val)
            buttonAction(val)
        }
    }
   
    const onUserFilterChange = (values) => {
        let filterArray = filter
        let valueArray = []

        for (const value of values) {
            valueArray.push(value.id)
        }
        filterArray[2] = valueArray
        setFilter(filterArray)

        const { buttonAction } = props
        buttonAction(filterArray)
    }

    const onSearchChange = (value) => {
        //State need to be up to date if changing other filters, 
        //pressing clear buton only removes value from hds input but does not change it otherwise
        //control is not reachable for buttons clear property
        const previousValue = filter[0];
        if (previousValue === value) {
            return;
        }
        const newFilter = [...filter];
        newFilter[0] = value
        setFilter(newFilter);
        if (value === "") {
            onSubmit(value)
        }
    }

    return (
        <search className="filters-list projects-filters">
            <Grid stackable columns="equal">
                <Grid.Column key="own1">
                    <label id="person_combo-label" htmlFor="person_combo-input">{t('common.person')}</label>
                    <CustomADUserCombobox
                        id="person_combo"
                        label={t('common.person')}
                        input={{
                            onChange: value => {
                                onUserFilterChange(value)
                            }
                        }}
                        multiselect={true}
                        placeholder={t('common.person')}
                        name={t('common.person')}
                    />
                </Grid.Column>
                <Grid.Column key="own2">
                    <label id="unit_combo-label" htmlFor="unit_combo-toggle-button">{t('common.unit')}</label>
                    <DropdownFilter
                        id="unit_combo"
                        key={t('common.unit')}
                        name={t('common.unit')}
                        defaultValue={null}
                        options={filterData}
                        placeholder={t('common.unit')}
                        onChange={ value => onFilterChange(value) }
                        multiSelect={false}
                        yearSelect={false}
                    />
                </Grid.Column>
                <Grid.Column key="own3">
                    {/* Fix the id's and htmlfor after HDS update */}
                    <label id="downshift-1-label" htmlFor="downshift-0-input">{t('common.keyword')}</label>
                    <SearchInput
                        clearButtonAriaLabel="Clear"
                        onSubmit={value => onSubmit(value)}
                        aria-label="Tyhjennä"
                        placeholder={t('common.keyword')}
                        onChange={value => onSearchChange(value)}
                    />
                </Grid.Column>
            </Grid>
        </search>
    )
}

OwnProjectFilters.propTypes = {
    filters: PropTypes.array,
    buttonAction: PropTypes.func
}

export default OwnProjectFilters
