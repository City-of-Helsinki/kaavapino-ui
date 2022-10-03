import React from 'react'
import PropTypes from 'prop-types'
import { split } from 'lodash'
import { useTranslation } from 'react-i18next'

function StrategyConnection({ fields, hideTitle }) {
    const { t } = useTranslation()
    let missingData = true

    const renderField = ( field ) => {
        let value = field.value

        const values = split(value, ',')

        if ( !values ) {
            return null
        }
        values.sort()

        const elements = values.map( (value, index ) => {
            if ( field.choices ) {
                const choice = field.choices.find( choice => choice.value === value)

                if ( choice ) {
                    value = choice.label
                }
            }
            if(missingData) missingData = (value == null || value.length == 0)
            return value && <div className="project-card-field" key={value + index} >{value}</div>
        })

        return (
            <div key={field.name}>
                {elements}
            </div>
        )
    }
   
    const renderFields = () => {
        missingData = true
        return (
            <div>
                {!hideTitle && <h3>{t('project.strategy-connection-title')}</h3>}
                {fields && fields.map( field => {
                    return renderField(field )
                })
                }
                {missingData && <label className="missing-data">{t('project.missing-data')}</label>}
            </div>
            )
    }
    const fieldsComponent = renderFields()

    return (
        <div className="strategy-connection">
            {fieldsComponent}
        </div>
    )
}

StrategyConnection.propTypes = {
    fields: PropTypes.array
}

export default StrategyConnection

