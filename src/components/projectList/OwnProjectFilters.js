import React, { useState, useEffect, useRef } from 'react'
import { Grid } from 'semantic-ui-react'
import DropdownFilter from '../overview/Filters/DropdownFilter'
import CustomADUserCombobox from '../input/CustomADUserCombobox'
import { SearchInput } from 'hds-react'
import { useTranslation } from 'react-i18next'

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
        else{
            //clear button pressed if null, when undefined do nothing
            if(values === null && oldValueRef.current != ""){
                val[1] = ""
                oldValueRef.current = "";
                setFilter(val)
                buttonAction(val)
            }
        }
    }
   
    const onUserFilterChange = (values) => {
        let filterArray = filter
        let valueArray = []

        for (let index = 0; index < values.length; index++) {
            valueArray.push(values[index].id)
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
        let val = filter
        val[0] = value
        setFilter(val)
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
                        onChange={value => onSearchChange(value)}
                    />
                </Grid.Column>
            </Grid>
        </div>
    )
}

export default OwnProjectFilters
