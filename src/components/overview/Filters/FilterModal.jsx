import React, { useState, useEffect } from 'react'
import { Dialog, Button, Accordion, Tag } from 'hds-react'
import { useTranslation } from 'react-i18next'
import MobileFilterList from './MobileFilterList'

function FilterModal({ filterList, handleClose, open, setFilter, currentFilter }) {
  const { t } = useTranslation()

  const [selectedFilters, setSelectedFilters] = useState(currentFilter)

  const onFilterChange = (value, name) => {
    setSelectedFilters({ ...selectedFilters, [name]: value })
  }

  useEffect(() => {
    setSelectedFilters(currentFilter)
  }, [currentFilter])

  const onClose = () => {
    setFilter(selectedFilters)
    handleClose()
  }

  const renderFilters = () => {
    return filterList.map(filter => {
      let amountSelected = 0

      if (selectedFilters && selectedFilters[filter.parameter]) {
        const currentFilters = Object.keys(selectedFilters[filter.parameter])
        if (currentFilters) {
          amountSelected = currentFilters.length
        }
      }

      return (
        <Accordion
          theme={{
            '--background-color': 'var(--color-white)',
            '--button-border-color-hover': 'var(--color-coat-of-arms)',
            '--button-size': '28px',
            '--content-font-color': 'var(--color-black-90)',
            '--content-font-size': 'var(--fontsize-body-xs)',
            '--content-line-height': 'var(--lineheight-xs)',
            '--header-font-color': 'var(--color-black-90)',
            '--header-font-size': 'var(--fontsize-heading-xs)',
            '--header-line-height': 'var(--lineheight-xs)',
            '--padding-horizontal': 'var(--spacing-xs)',
            '--padding-vertical': 'var(--spacing-xs)'
          }}
          style={{ fontSize: '14px' }}
          headingLevel={5}
          key={filter.name}
          heading={getHeader(filter.name, amountSelected)}
        >
          <MobileFilterList
            filter={filter}
            onChange={onFilterChange}
            selectedFilters={selectedFilters[filter.parameter]}
            onUserFilterChange={onFilterChange}
            filterValues={currentFilter}
          />
        </Accordion>
      )
    })
  }

  const getHeader = (name, amountSelected) => {
    return (
      <div className="filter-header-row">
        <div className="filter-header-name">{name}</div>
        <div className="filter-header-tag">
          {amountSelected > 0 && (
            <Tag size="s">{t('overview.selected', { amount: amountSelected })}</Tag>
          )}
        </div>
      </div>
    )
  }
  if (!open) return <></>; 
  return (
    <Dialog
      id="filter-dialog"
      isOpen
      close={() => onClose()}
      aria-labelledby="filter-dialog-title"
      className="filter-modal"
    >
      <Dialog.Header id="filter-dialog-title" title={t('overview.filter-modal-title')} />

      <Dialog.Content className="filter-modal-content">
        {renderFilters()}
      </Dialog.Content>

      <Dialog.ActionButtons>
        <Button type="button" variant="primary" onClick={() => {onClose()}}>
          {t('common.save')}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  )
}

export default FilterModal
