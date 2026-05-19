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
import PropTypes from 'prop-types'

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
    infoOptions?.[0] &&
    t('nav-header.latest-update', { latestUpdate: infoOptions[0].text })

  const getFormattedValue = (value, name, schema, type) => {
    if (value === null || value === 'undefined') {
      return t('no-value')
    }

    switch(type) {
      case 'personnel': { 
        const foundPerson = personnel?.find(person => person.id === value)
        return foundPerson?.name || t('no-value')
      }
      case 'short_string':
        return schema[value]?.label || value
      case 'fieldset': {
        const fieldSetContent = getFieldSetContent(value, name, schema)
        const hasContent = fieldSetContent[0] && fieldSetContent[0].length > 0
        return fieldSetContent && hasContent ? fieldSetContent : t('no-value')
      }
      case 'rich_text_short':
      case 'rich_text_long':
      case 'rich_text':
        return getRichTextContent(value.ops)
      case 'boolean':
        return value ? t('yes') : t('no')
      case 'date':
        return projectUtils.formatDate(value)
      case 'image': {
        const returnValue = []
        const keys = Object.keys(value)

        keys.forEach(key => {
          returnValue.push(
            <div key={key}> <b>{key}</b> </div>,
            <div key={key + value}>{value[key]}</div>
          )
        })
        return returnValue
      }
      default:
        break;
    }

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

    if (schema && Object.keys(schema).length > 0) {
      const foundValue = schema[value]?.label
      return foundValue?.toString() || value
    }

    return value?.toString() || t('no-value')
  }

  const getRichTextContent = value => {
    const cfg = { encodeHtml: false }
    const converter = new QuillDeltaToHtmlConverter(value, cfg)

    return parse(converter.convert())
  }

  const getFieldSetContent = (value, name, schema) => {
    const returnValues = [];
    value?.forEach(current => {
      if (isObject(current)) {
        returnValues.push(getFieldsetValues(current, name, schema));
      } else {
        returnValues.push(
          current
            ? getFormattedValue(current, name, schema, schema[name]?.type)
            : t('empty')
        );
      }
    });
    return returnValues;
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

        if (key === '_deleted') {
          const value = getFormattedValue(
            fieldset[key],
            key,
            schema,
            schema[key]?.type
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
        } else {
          let value = getFormattedValue(fieldset[key], key, schema, schema[key] ? schema[key].type : null)

          const date = dayjs(value).format(t('dateformat'))

          component = (
            <div key={key + index} className="log-item">
              {deleted && <IconTrash />}
                {schema[key] && schema[key]?.type !== 'fieldset' && schema[key]?.label}
              <div>{date === 'Invalid Date' ? value : date}</div>
            </div>
          )

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
      <Card role={undefined} border aria-label="Loki" className="log-card" {...contentProps}>
        <Grid stackable columns="equal" as="ul">
          {infoOptions?.map((option, index) => {
            const listKey = option.key || option.text;
            if (option.type === "fieldset") {
              //Filter fieldset values from new and old that have not changed from last edit. 
              //Before this all values on fieldset that had been modified at somepoint were shown as changed every time
              filterFieldsetValues(option.newValue, option.oldValue);
            }
            return (
              <Grid.Row key={listKey} as="li">
                <Grid.Column width={14}>
                  <div className="show-value">{option.text}</div>
                </Grid.Column>
                <Grid.Column>
                  <Popup
                    hideOnScroll={false}
                    offset={[50, 50]}
                    key={listKey + "-popup"}
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
            );
          })}
        </Grid>
      </Card>
    </div>
  )
}

LoggingComponent.propTypes = {
  infoOptions: PropTypes.array
}

export default LoggingComponent
