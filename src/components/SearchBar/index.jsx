import React, { useState, useEffect } from 'react'
import './SearchBar.scss'
import { IconCross, IconSearch, SearchInput, Button, Checkbox } from 'hds-react'
import CustomADUserCombobox from '../input/CustomADUserCombobox.jsx'
import { useTranslation } from 'react-i18next';

function SearchBar(props) {
  const [personSearchToggle, setPersonSearchToggle] = useState(false)
  const {t} = useTranslation()

  useEffect(() => {
   
    return () => {
      setPersonSearchToggle(false)
    }
  }, [])
  const onSubmit = value => {
    const { buttonAction } = props
    buttonAction(value)
  }

  const onReset = () => {
    const { buttonAction, toggleSearch } = props

    toggleSearch(false)

    if (buttonAction) {
      buttonAction('')
    }
  }


  const { searchOpen, toggleSearch } = props

  return (
    <span className="search-bar">
      {!searchOpen ? (
        <Button
          variant="supplementary"
          className="search-action-icon"
          iconLeft={<IconSearch size="l" />}
          onClick={() => toggleSearch(true)}
          aria-label="Hae"
        />
      ) : (
        <>
          {!personSearchToggle && (
            <SearchInput
              clearButtonAriaLabel="Clear"
              onSubmit={value => onSubmit(value)}
              aria-label="Tyhjennä"
            />
          )}

          {personSearchToggle && (
            <div>
            <CustomADUserCombobox
              input={{
                onChange: value => {
                  onSubmit(value)
                }
              }}
              multiselect={false}
            />
            </div>
          )
          }
          <Checkbox
            id="person-toggle"
            className="person-toggle"
            label={t('projects.person-search')}
            checked={personSearchToggle}
            onChange={() => setPersonSearchToggle(personSearchToggle ? false : true)}
          />
          <Button
            variant="supplementary"
            iconLeft={<IconCross size="l" />}
            onClick={onReset}
            aria-label="Poista"
          />
        </>
      )}
    </span>
  )
}

export default SearchBar
