import React from 'react'
import { isArray, isObject } from 'lodash'
import { useTranslation } from 'react-i18next'
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html'
import parse from 'html-react-parser'
import {
  Button,
  Card,
  useAccordion,
  IconAngleUp,
  IconAngleDown,
  IconInfoCircle,
  IconTrash,
  Tooltip
} from 'hds-react'

import dayjs from 'dayjs'

import projectUtils from '../../utils/projectUtils'
import { personnelSelector } from '../../selectors/projectSelector'

import { useSelector } from 'react-redux'

function LoggingComponent(props) {
  const { t } = useTranslation()

  const personnel = useSelector(personnelSelector)

  const { isOpen, buttonProps, contentProps } = useAccordion({ initiallyOpen: false })
  const icon = isOpen ? <IconAngleUp aria-hidden /> : <IconAngleDown aria-hidden />

  const { infoOptions } = props

  const latestUpdate =
    infoOptions &&
    infoOptions[0] &&
    t('nav-header.latest-update', { latestUpdate: infoOptions[0].text })

  const getFormattedValue = (value, name, schema, type) => {
    if (value === null || value === 'undefined') {
      return t('no-value')
    }

    if (type === 'personnel') {
      const foundPerson = personnel && personnel.find(person => person.id === value)

      return foundPerson ? foundPerson.name : t('no-value')
    }

    if (type === 'short_string') {
      return schema[value] ? schema[value] : value
    }

    // Fieldset
    if (type === 'fieldset') {
      const fieldSetContent = getFieldSetContent(value, name, schema)

      const hasContent =
        fieldSetContent.length > 0 && fieldSetContent[0] && fieldSetContent[0].length > 0
      return fieldSetContent && hasContent ? fieldSetContent : t('no-value')
    }

    // Normal rich text
    if (type === 'rich_text_short' || type === 'rich_text_long' || type === 'rich_text') {
      return getRichTextContent(value.ops)
    }
    // Boolean
    if (type === 'boolean') {
      if (value === null || value === undefined) {
        return t('no-value')
      }
      return value ? t('yes') : t('no')
    }

    // Date
    if (type === 'date') {
      if (!value) {
        return t('no-value')
      }
      return projectUtils.formatDate(value)
    }
    // Image
    if (type === 'image') {
      const returnValue = []
      const keys = Object.keys(value)

      keys.forEach(key => {
        returnValue.push(
          <div key={key}>
            <b>{key}</b>
          </div>
        )
        returnValue.push(<div key={key + value}>{value[key]}</div>)
      })
      return returnValue
    }

    // Array
    if (isArray(value)) {
      const returnValue = []
      value.forEach(current => {
        if (schema && Object.keys(schema).length > 0) {
          returnValue.push(schema[current] ? schema[current].label : current)
        } else {
          returnValue.push(current)
        }
      })
      return returnValue.toString()
    }
    // General
    if (schema && Object.keys(schema).length > 0) {
      const foundValue = schema[value] && schema[value].label

      return foundValue ? foundValue.toString() : value
    }

    return value ? value.toString() : t('no-value')
  }

  const getRichTextContent = value => {
    const cfg = { encodeHtml: false }
    const converter = new QuillDeltaToHtmlConverter(value, cfg)

    return parse(converter.convert())
  }

  const getFieldSetContent = (value, name, schema) => {
    const returnValues = []
    value &&
      value.forEach(current => {
        if (isObject(current)) {
          returnValues.push(getFieldsetValues(current, name, schema))
        } else {
          returnValues.push(
            current
              ? getFormattedValue(current, name, schema, schema[name].type)
              : t('empty')
          )
        }
        return null
      })
    return returnValues
  }

  const getFieldsetValues = (fieldset, name, schema) => {
    let deleted = false
    if (fieldset['_deleted']) {
      deleted = true
    }
    const returnValues = []

    const keys = Object.keys(fieldset)

    returnValues.push(
      <div key={0} className="log-item">
        {deleted && <IconTrash size="s" />}
        <b>{schema[name].label}</b>
        <br />
      </div>
    )

    if (keys.length === 0) {
      returnValues.push(t('empty'))
    } else {
      keys.forEach((key, index) => {
        let component
        let deleted = false

        if (key !== '_deleted') {
          let value = getFormattedValue(fieldset[key], key, schema, schema[key] ? schema[key].type : null)

          const date = dayjs(value).format(t('dateformat'))

          component = (
            <div key={key + index} className="log-item">
              <>
                {deleted && <IconTrash />}
                {schema[key] && schema[key].type !== 'fieldset' && schema[key].label}
              </>
              <div>{date !== 'Invalid Date' ? date : value}</div>
            </div>
          )

          returnValues.push(component)
        } else {
          const value = getFormattedValue(
            fieldset[key],
            key,
            schema,
            schema[key] && schema[key].type
          )

          if (value === true) {
            component = (
              <div key={key + index} className="log-item">
                <div>{deleted && <IconTrash />}</div>
                <div>{value}</div>
              </div>
            )
          }
          returnValues.push(component)
        }
      })
    }
    return returnValues.length === 0 ? null : returnValues
  }

  const filterFieldsetValues = (newValuesArray, oldValuesArray) => {
    //Make array for both sets of values and compare the objects
    const combineArrays = newValuesArray.concat(oldValuesArray);
    const [changedValuesOnly, ...others] = combineArrays;
    for (let [key, value] of Object.entries(changedValuesOnly)) {
      for (let object of others) {
        //Modify string values to be similar so they can be compared reliably
        if (object && value && typeof object[key] === 'string') {
          object[key] = object[key].split('_').join(' ').split('-').join(' ');
          object[key] = object[key].toUpperCase();
          value = value.split('_').join(' ').split('-').join(' ');
          value = value.toUpperCase();
        }
        if (object && value && object[key] === value) {
          //delete values that have not been changed, we want to show only values that have changed
          delete changedValuesOnly[key];
          delete object[key];
        }
      }
    }
    const changesOnlyArray = [];
    changesOnlyArray.push(changedValuesOnly);
    return [changesOnlyArray, others];
  }

  return (
    <div className="nav-header-info">
      {latestUpdate && (
        <Button
          size="small"
          className="latest-update"
          variant="secondary"
          iconRight={icon}
          {...buttonProps}
        >
          {t('nav-header.latest-changes')}
        </Button>
      )}
      <Card border aria-label="Loki" className="log-card" {...contentProps}>
        <div className="log-grid">
          {infoOptions &&
            infoOptions.map((option, index) => {
              if (option.type === "fieldset") {
                //Filter fieldset values from new and old that have not changed from last edit. 
                //Before this all values on fieldset that had been modified at somepoint were shown as changed every time
                filterFieldsetValues(option.newValue, option.oldValue);
              }
              return (
                <div key={option + index} className="log-row">
                  <div className="log-column-main">
                    <div className="show-value">{option.text}</div>
                  </div>
                  <div className="log-column-info">
                    <Tooltip
                      key={index}
                      placement="auto"
                      className="popup-logger"
                      buttonLabel="Show logging details"
                    >
                      <div>
                        <div className="show-value">
                          <div>
                            <b>{t('projects.logging.modified')}</b>
                          </div>
                          <div className="field-value">
                            {getFormattedValue(
                              option.newValue,
                              option.name,
                              option.schema,
                              option.type
                            )}
                          </div>
                        </div>
                        <div>
                          <div>
                            <b>{t('projects.logging.old')}</b>
                          </div>
                          <div className="field-value">
                            {getFormattedValue(
                              option.oldValue,
                              option.name,
                              option.schema,
                              option.type
                            )}
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              )
            })}
        </div>
      </Card>
    </div>
  )
}

export default LoggingComponent
