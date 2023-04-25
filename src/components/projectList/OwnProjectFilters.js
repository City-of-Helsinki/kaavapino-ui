import React, { useState, useEffect } from 'react'
import { connect, useDispatch } from 'react-redux'
import { Grid } from 'semantic-ui-react'
import DropdownFilter from '../overview/Filters/DropdownFilter'
import CustomADUserCombobox from '../input/CustomADUserCombobox'
import { SearchInput } from 'hds-react'
import {
    projectOverviewMapFiltersSelector,
    ownProjectFiltersSelector
} from '../../selectors/projectSelector'
import {
    getProjectsOverviewMapData,
    setProjectsOverviewMapFilter,
    filterOwnProjects
} from '../../actions/projectActions'
import { isEqual } from 'lodash'
import { useTranslation } from 'react-i18next'

function OwnProjectFilters({ filters, setProjectsOverviewMapFilter, storedFilter, ...props }) {
    const dispatch = useDispatch()
    const { t } = useTranslation()
    const [filter, setFilter] = useState({})
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

     const onFilterChange = (values,currentParameter) => {
        console.log(currentParameter)
        if(values && values.value){
            dispatch(filterOwnProjects(values.value));
        }
/*         if (!values || values.length === 0) {
            const newFilter = Object.assign({}, filter)
            delete newFilter[currentParameter]
            setFilter({
                ...newFilter
            })
            return
        } */
   /*      const valueArray = []
        let parameter */
/* 
        values.forEach(value => {
            valueArray.push(value.value)
            parameter = value.parameter
        }) */

/*         setFilter({
            ...filter,
            [parameter]: valueArray
        }) */
    }
   
    const onUserFilterChange = (values, currentParameter) => {
        //users etsi email avulla user id jota voidaan verrata 
        //department tieto jota voi verrata
        const valueArray = []
        for (let index = 0; index < values.length; index++) {
            valueArray.push(values[index].email)
        }
       // const intersection = ownProjects.filter(element => ownProjectFilters.includes(element.user));
        if(valueArray.length > 0){
            dispatch(filterOwnProjects(valueArray));
        }

        if (!values || values.length === 0) {
            const newFilter = Object.assign({}, filter)
            delete newFilter[currentParameter]
            setFilter({
                ...newFilter
            })
            return
        }
        setFilter({
            ...filter,
            [currentParameter]: values
        })
    }
    /*
    const onClear = () => {
        setProjectsOverviewMapFilter({})
        setFilter({})
    } */
    const onSubmit = value => {
        const { buttonAction } = props
        buttonAction(value)
    }

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
                                onUserFilterChange(value, "henkilo")
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
                        key="Yksikkö tai tiimi"
                        name="Yksikkö tai tiimi"
                        defaultValue={null}
                        options={filterData}
                        placeholder={t('common.unit')}
                        onChange={
                            value => {
                                onFilterChange(value,'yksikkö')
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
        storedFilter: projectOverviewMapFiltersSelector(state),
        filteredOwnProjects:ownProjectFiltersSelector(state)
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(OwnProjectFilters)
