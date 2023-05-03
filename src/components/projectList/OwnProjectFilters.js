import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Grid } from 'semantic-ui-react'
import DropdownFilter from '../overview/Filters/DropdownFilter'
import CustomADUserCombobox from '../input/CustomADUserCombobox'
import { SearchInput } from 'hds-react'
import {
    projectOverviewMapFiltersSelector
} from '../../selectors/projectSelector'
import {
    getProjectsOverviewMapData,
    setProjectsOverviewMapFilter
} from '../../actions/projectActions'
import { isEqual } from 'lodash'
import { useTranslation } from 'react-i18next'

function OwnProjectFilters({ filters, setProjectsOverviewMapFilter, storedFilter, users, ...props }) {
    const { t } = useTranslation()
    const [filter, setFilter] = useState(["","",[]])
    const [filterData, setFilterData] = useState([])

    useEffect(() => {
        getProjectsOverviewMapData(filter)
    }, [])

    useEffect(() => {
        getProjectsOverviewMapData(filter)
    }, [filter])


    useEffect(() => {
        if(filters.length > 0){
            setFilterData(filters[2].choices)
        }
    }, [filters])
    

    useEffect(() => {
        if (!storedFilter || !isEqual(storedFilter, filter)) {
            getProjectsOverviewMapData(filter)
            setProjectsOverviewMapFilter(filter)
        }
    }, [filter])

    const onSubmit = (value) => {
        let val = filter
        val[0] = value
        setFilter(val)
        const { buttonAction } = props
        buttonAction(filter)
    }

     const onFilterChange = (values) => {
        let val = filter
        const { buttonAction } = props
        if(values){
            val[1] = values.value
            setFilter(val)
            buttonAction(filter)
        }
        else{
            val[1] = ""
            setFilter(val)
            buttonAction(filter)
        }
    }
   
    const onUserFilterChange = (values) => {
        let filterArray = filter
        let valueArray = []

        for (let index = 0; index < values.length; index++) {
            valueArray.push(values[index].email)
        }
        //get user ids by user email
        const userArray = users.filter(a => valueArray.some(b => a.email === b)).map(a => a.id); 

        filterArray[2] = userArray
        setFilter(filterArray)

        const { buttonAction } = props
        buttonAction(filter)
    }
    /*
    const onClear = () => {
        setProjectsOverviewMapFilter({})
        setFilter({})
    } */

    return (
        <div className="filters-list">
            <Grid stackable columns="equal">
                <Grid.Column key="own1">
                    <label htmlFor="person_combo">{t('common.person')}</label>
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
                    />
                </Grid.Column>
                <Grid.Column key="own2">
                    <label htmlFor="unit_combo">{t('common.unit')}</label>
                    <DropdownFilter
                        id="unit_combo"
                        key={t('common.unit')}
                        name={t('common.unit')}
                        defaultValue={null}
                        options={filterData}
                        placeholder={t('common.unit')}
                        onChange={
                            value => {
                                onFilterChange(value)
                            }
                        }
                        type="choice"
                        multiSelect={false}
                        yearSelect={false}
                    />
                </Grid.Column>
                <Grid.Column key="own3">
                    <label htmlFor="search_input">{t('common.keyword')}</label>
                    <SearchInput
                        id="search_input"
                        clearButtonAriaLabel="Clear"
                        onSubmit={value => onSubmit(value)}
                        aria-label="Tyhjennä"
                        placeholder={t('common.keyword')}
                    />
                </Grid.Column>
            </Grid>
        </div>
    )
}

const mapDispatchToProps = {
    setProjectsOverviewMapFilter
}

const mapStateToProps = state => {
    return {
        storedFilter: projectOverviewMapFiltersSelector(state)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(OwnProjectFilters)
