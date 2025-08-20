import React, { useState, useEffect } from 'react'
import { Modal, Grid } from 'semantic-ui-react'
import { Button, Accordion, Tag } from 'hds-react'
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
      <Grid columns="equal">
        <Grid.Column width={10}>{name}</Grid.Column>
        <Grid.Column textAlign="right">
          {amountSelected > 0 && <Tag size="s">{t('overview.selected', {amount: amountSelected})}</Tag>}
        </Grid.Column>
      </Grid>
    )
  }

  return (
    <Modal
      className="filter-modal"
      size="tiny"
      onClose={handleClose}
      open={open}
      closeIcon
    >
      <Modal.Header className="filter-modal-header"> {t('overview.filter-modal-title')}</Modal.Header>
      <Modal.Content className="filter-modal-content">{renderFilters()}</Modal.Content>
      <Modal.Actions className="filter-modal-actions">
        <Button type="button" variant="primary" onClick={onClose}>
          {t('common.save')}
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

export default FilterModal
