import React from 'react'
import { isObject, isArray } from 'lodash'
import { Popup, Grid } from 'semantic-ui-react'
import { useTranslation } from 'react-i18next'
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html'
import parse from 'html-react-parser'
import {
  IconTrash,
  Button,
  Card,
  useAccordion,
  IconAngleUp,
  IconAngleDown,
  IconInfoCircle
} from 'hds-react'
import dayjs from 'dayjs'
import projectUtils from '../../utils/projectUtils'
import { personnelSelector } from '../../selectors/projectSelector'

import { useSelector } from 'react-redux'
import {
  schemaSelector,
  deadlineSectionsSelector,
  floorAreaSectionsSelector
} from '../../selectors/schemaSelector'
import schemaUtils from '../../utils/schemaUtils'

function LoggingComponent(props) {
  const { t } = useTranslation()

  const personnel = useSelector(personnelSelector)
  const schema = useSelector(schemaSelector)
  const deadlineSections = useSelector(deadlineSectionsSelector)
  const floorAreaSections = useSelector(floorAreaSectionsSelector)

  const referenceFields = schemaUtils.getAllFields(
    schema ? schema.phases : [],
    deadlineSections,
    floorAreaSections,
    true
  )

  const findLabel = currentName => {
    const found = referenceFields.find(current => current.name === currentName)
    return found ? found.label : currentName
  }

  const { isOpen, buttonProps, contentProps } = useAccordion({ initiallyOpen: false })
  const icon = isOpen ? <IconAngleUp aria-hidden /> : <IconAngleDown aria-hidden />

  const { infoOptions } = props

  const latestUpdate =
    infoOptions &&
    infoOptions[0] &&
    t('nav-header.latest-update', { latestUpdate: infoOptions[0].text })

  const isFieldset = value => value && value.search && value.search('fieldset') !== -1

  const isName = value => value && value.search && value.search('nimi') !== -1

  const getFormattedValue = (value, isFieldSet, name, labels, type) => {
    if (isName(name)) {
      const foundPerson = personnel && personnel.find(person => person.id === value)

      return foundPerson ? foundPerson.name : t('no-value')
    }
    // Fieldset
    if (isFieldSet) {
      const fieldSetContent = getFieldSetContent(value, name, type)

      const hasContent =
        fieldSetContent.length > 0 && fieldSetContent[0] && fieldSetContent[0].length > 0
      return fieldSetContent && hasContent ? fieldSetContent : t('no-value')
    }

    // Normal rich text
    if (value && value.ops) {
      return getRichTextContent(value.ops)
    }
    // Boolean
    if (type === 'boolean') {
      return value ? t('yes') : t('no')
    }

    // Date
    if (type === 'date') {
      if (!value) {
        return t('no-value')
      }

      return projectUtils.formatDate(value)
    }
    // Object which is not fieldset
    if (isObject(value)) {
      const returnValue = []

      // Array
      if (isArray(value)) {
        value.forEach(current => {
          if (labels && Object.keys(labels).length > 0) {
            returnValue.push(labels[current])
          } else {
            returnValue.push(current)
          }
        })
        return returnValue.toString()
      }
      // Image
      if (value && value.link) {
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
      // General
      return value.toString()
    }

    if (labels && Object.keys(labels).length > 0) {
      const foundValue = labels[value]

      return foundValue ? foundValue.toString() : t('no-value')
    }
    return value ? value.toString() : t('no-value')
  }

  const getRichTextContent = value => {
    const cfg = { encodeHtml: false }
    const converter = new QuillDeltaToHtmlConverter(value, cfg)

    return parse(converter.convert())
  }

  const getFieldSetContent = (value, name, type) => {
    // If value is not fieldset
    if (!isObject(value) || value.ops || value.link) {
      return getFormattedValue(value, false, name, null, type)
    }
    const returnValues = []

    const valueKeys = Object.keys(value)

    valueKeys &&
      valueKeys.map(currentIndex => {
        const currentValue = value[currentIndex]

        if (isObject(currentValue)) {
          returnValues.push(
            getFieldsetValues(currentValue, currentIndex, name, isFieldset(name), type)
          )
        } else {
          returnValues.push(
            currentValue
              ? getFormattedValue(currentValue, isFieldset, name, null, type)
              : t('empty')
          )
        }
        return null
      })
    return returnValues
  }
  const findAttribute = key =>
    props &&
    props.attributes &&
    props.attributes.find(attribute => attribute.name === key)

  // Check from field names
  const isValidDate = name =>
    name.lastIndexOf('pvm') !== -1 || name.lastIndexOf('paivamaara') !== -1

  const getFieldsetValues = (fieldset, currentIndex, name, type) => {
    let deleted = false
    if (fieldset['_deleted']) {
      deleted = true
    }
    const returnValues = []

    const keys = Object.keys(fieldset)

    const foundValue = findAttribute(name)
    const current = foundValue !== undefined ? foundValue.label : findLabel(name)

    returnValues.push(
      <div key={0} className="log-item">
        {deleted && <IconTrash size="s" />}
        <b>
          {findLabel(current)}
        </b>
        <br />
      </div>
    )

    if (keys.length === 0) {
      returnValues.push('Tyhjä')
    } else {
      keys.forEach((key, index) => {
        let component
        let deleted = false

        if (key !== '_deleted') {
          let value = getFormattedValue(fieldset[key], isFieldset(key), key, null, type)

          const date = dayjs(value).format(t('dateformat'))
          const foundValue = findAttribute(key)

          const current = foundValue !== undefined ? foundValue.label : key

          component = (
            <div key={key + index} className="log-item">
              <>
                {deleted && <IconTrash />}
                {!isFieldset(key) && findLabel(current)}
              </>
              <div>
                {isValidDate(key)
                  ? date !== 'Invalid Date'
                    ? date
                    : t('deleted')
                  : value}
              </div>
            </div>
          )

          returnValues.push(component)
        } else {
          const value = getFormattedValue(fieldset[key], isFieldset(key), key, null, type)

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
                  {option.editable && (
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
                              isFieldset(option.name),
                              option.name,
                              option.labels,
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
                              isFieldset(option.name),
                              option.name,
                              option.labels,
                              option.type
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Grid.Column>
                  )}
                </Grid.Row>
              )
            })}
        </Grid>
      </Card>
    </div>
  )
}

export default LoggingComponent
