import React from 'react'
import { isArray, isObject } from 'lodash'
import { Popup, Grid } from 'semantic-ui-react'
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
  IconTrash
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
          let value = getFormattedValue(fieldset[key], key, schema, schema[key].type)

          const date = dayjs(value).format(t('dateformat'))

          component = (
            <div key={key + index} className="log-item">
              <>
                {deleted && <IconTrash />}
                {schema[key].type !== 'fieldset' && schema[key].label}
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

  return (
    <div className="nav-header-info">
      {latestUpdate && (
        <Button
          className="latest-update"
          variant="supplementary"
          iconLeft={icon}
          {...buttonProps}
        >
          {latestUpdate}
        </Button>
      )}
      <Card border aria-label="Loki" className="log-card" {...contentProps}>
        <Grid stackable columns="equal">
          {infoOptions &&
            infoOptions.map((option, index) => {
              return (
                <Grid.Row key={option + index}>
                  <Grid.Column width={14}>
                    <div className="show-value">{option.text}</div>
                  </Grid.Column>
                  <Grid.Column>
                    <Popup
                      hideOnScroll={false}
                      offset={[50, 50]}
                      key={index}
                      on="click"
                      className="popup-logger"
                      position="right center"
                      wide="very"
                      trigger={
                        <Grid.Column>
                          <IconInfoCircle className="info-icon" />
                        </Grid.Column>
                      }
                    >
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
                    </Popup>
                  </Grid.Column>
                </Grid.Row>
              )
            })}
        </Grid>
      </Card>
    </div>
  )
}

export default LoggingComponent
