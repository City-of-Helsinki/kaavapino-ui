import React from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

function Contract({ fields }) {

    const { t } = useTranslation()

    const renderField = ( field, index ) => {
        let value = field.value

        if ( value === undefined ) {
            value = null
        }
        if ( field.choices ) {
            const choice = field.choices.find( choice => choice.value === field.value)

            if ( choice ) {
                value = choice.label
            }
        }
        return (
            <div key={field.label + index}>
                <div>{field.label}</div>
                <div><b>{value}</b></div>
            </div>
        )
    }
    const renderFields = () => {
        return (
            <div>
                <h3>{t('project.contract-title')}</h3>
                { fields && fields.map( (field, index) => {
                    return renderField(field, index )
                } )
                }
            </div>
            )
    }
    const fieldsComponent = renderFields()

    return (
        <div className="contract">
            {fieldsComponent}
        </div>
    )
}

Contract.propTypes = {
    fields: PropTypes.array
}

export default Contract

