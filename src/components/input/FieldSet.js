import React, { useState } from 'react'
import { connect, useDispatch } from 'react-redux'
import { checkingSelector } from '../../selectors/projectSelector'
import CustomField from './CustomField'
import { Form, Label, Popup } from 'semantic-ui-react'
import projectUtils from '../../utils/projectUtils'
import Info from './Info'
import { showField } from '../../utils/projectVisibilityUtils'
import { has } from 'lodash'
import { IconCross, IconClock } from 'hds-react'
import { Button } from 'hds-react'
import { change } from 'redux-form'
import { get } from 'lodash'
import { useTranslation } from 'react-i18next';

const FieldSet = ({
  sets,
  fields,
  checking,
  attributeData,
  name,
  disabled,
  formName,
  formValues,
  validate,
  syncronousErrors,
  handleSave,
  onRadioChange,
  updated,
  onBlur,
  handleLockField,
  handleUnlockField,
  field: { disable_fieldset_delete_add }
}) => {

  const handleBlur = () => {
    onBlur()
  }
  
  const dispatch = useDispatch()

  const { t } = useTranslation()

  const [hiddenIndex, setHiddenIndex] = useState(-1)

  const getLastValidIndex = () => {
    let lastValidIndex = sets.length - 1

    for (let index = lastValidIndex; index >= 0; index--) {
      if (!sets.get(index)._deleted) {
        return index
      }
    }
  }

  const nulledFields =
    fields &&
    fields.map(field => {
      return { [field.name]: null, _deleted: true }
    })
  return (
    <React.Fragment>
      {sets.map((set, i) => {
        const deleted = get(formValues, set + '._deleted')
        const automatically_added = get(formValues, set + '._automatically_added')
        return (
          <React.Fragment key={`${name}-${i}`}>
            {!deleted && hiddenIndex !== i && (
              <div key={i} className="fieldset-container">
                <div className="fieldset-header">
                  <h3 className="fieldset-header-number">{i + 1}.</h3>

                  {(!disable_fieldset_delete_add && !automatically_added) && (
                    <IconCross
                      className="fieldset-remove"
                      color="red"
                      size="m"
                      onClick={() => {
                        dispatch(change(formName, set, ...nulledFields))
                        setHiddenIndex(i)
                        handleSave()
                      }}
                    />
                  )}
                </div>
                {fields.map((field, j) => {
                  const currentName = `${set}.${field.name}`
                  if (
                    !showField(field, formValues, currentName) ||
                    !field.fieldset_index
                  ) {
                    return null
                  }

                  let required = false

                  const isReadOnly = field && field.autofill_readonly
                  if (checking && !(!attributeData[name] || !attributeData[name][i])) {
                    if (
                      checking &&
                      projectUtils.isFieldMissing(
                        field.name,
                        field.required,
                        attributeData[name][i]
                      )
                    ) {
                      required = true
                    }
                  } else if (checking && field.required) {
                    required = true
                  }

                  const title = field.character_limit
                    ? t('project.fieldset-title', { label: field.label, max: field.character_limit })
                    : field.label
                  const error = syncronousErrors && syncronousErrors[field.name]

                  /* Two ways to bring errors to FormField component:
                   * 1) the missing attribute data of required fields is checked automatically.
                   * 2) error text can be given directly to the component as props.
                   * Redux form gives error information to the Field component, but that's further down the line, and we need that information
                   * here to modify the input header accordingly. */
                  const showError = required ? t('project.required-field') : error

                  const fieldUpdated =
                    updated && updated.new_value && has(updated.new_value[0], field.name)
                  return (
                    <div
                      className={`input-container ${showError ? 'error' : ''}`}
                      key={j}
                    >
                      <Form.Field required={required}>
                        <div className="input-header">
                          <Label
                            className={`input-title${required ? ' highlight' : ''} ${showError ? 'error' : ''
                              }`}
                          >
                            {title}
                          </Label>
                          <div className="input-header-icons">
                            {fieldUpdated && !isReadOnly && (
                              <Popup
                                trigger={<IconClock />}
                                inverted
                                on="hover"
                                position="top center"
                                hideOnScroll
                                content={
                                  <span className="input-history">
                                    <span>{`${projectUtils.formatDate(
                                      updated.timestamp
                                    )} ${projectUtils.formatTime(updated.timestamp)} ${updated.user_name
                                      }`}</span>
                                  </span>
                                }
                              />
                            )}
                            {field.help_text && (
                              <Info content={field.help_text} link={field.help_link} />
                            )}
                          </div>
                        </div>
                        <CustomField
                          field={{ ...field, name: currentName, disabled, automatically_added }}
                          attributeData={attributeData}
                          fieldset={field.type === 'fieldset'}
                          parentName={name}
                          formName={formName}
                          formValues={formValues}
                          handleSave={handleSave}
                          handleLockField={handleLockField}
                          handleUnlockField={handleUnlockField}
                          onRadioChange={onRadioChange}
                          handleBlurSave={() => {
                            if (onBlur) {
                              handleBlur()
                            }
                          }}
                          validate={validate}
                        />
                        {showError && <div className="error-text">{showError}</div>}
                      </Form.Field>
                    </div>
                  )
                })}
              </div>
            )}
          </React.Fragment>
        )
      })}
      {!disable_fieldset_delete_add && (
        <>
          <Button
            className={`fieldset-button-add ${checking && projectUtils.hasFieldsetErrors(name, fields, attributeData) ? 'fieldset-internal-error' : null
              }`}
            onClick={() => {
              sets.push({})
              handleBlur()
            }}
            disabled={disabled}
            variant="secondary"
          >
            {t('project.add')}
          </Button>
          <Button
            className="fieldset-button-remove"
            disabled={sets.length < 1}
            onClick={() => {
              const lastValidIndex = getLastValidIndex()
              sets.map((set, index) => {
                if (index === lastValidIndex) {
                  dispatch(change(formName, set, ...nulledFields))
                  setHiddenIndex(index)
                }
                return null
              })

              handleSave()
            }}
            variant="secondary"
          >
            {t('project.remove')}
          </Button>
        </>
      )}
    </React.Fragment>
  )
}

const mapStateToProps = state => ({
  checking: checkingSelector(state)
})

export default connect(mapStateToProps)(FieldSet)
