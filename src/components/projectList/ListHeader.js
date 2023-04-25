import React from 'react'
import PropTypes from 'prop-types'
import { IconAngleUp, IconAngleDown, Button } from 'hds-react'
import { useTranslation } from 'react-i18next';

const ListHeader = ({
  items,
  sort,
  selected,
  dir
  }) => {
  const getArrowIcon = () => {
    return dir === 0 ? (
      <IconAngleUp size="xs" display="none" />
    ) : (
      <IconAngleDown size="xs" />
    )
  }

  const {t} = useTranslation()
  return (
    <div className="project-list-wrapper">
      <p className="project-list-sort-text"> {t('project.sort')}</p>
      <div className="project-list-header">
        {items.map((item, index) => {
          return (
            <Button variant="supplementary" className="header-item" key={index} onClick={() => sort(index)}>
              {item}
              {selected === index && getArrowIcon()}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

ListHeader.propTypes = {
  searchOpen: PropTypes.bool,
  items: PropTypes.array.isRequired,
  sort: PropTypes.func.isRequired,
  dir: PropTypes.number.isRequired
}

export default ListHeader
