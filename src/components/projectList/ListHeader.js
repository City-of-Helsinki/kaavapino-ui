import React from 'react'
import PropTypes from 'prop-types'
import { IconSort,IconAngleUp, IconAngleDown,IconSortAscending, IconSortDescending, Button } from 'hds-react'
import { useTranslation } from 'react-i18next';

const ListHeader = ({
  items,
  sort,
  selected,
  dir
  }) => {
  const getArrowIcon = () => {
    return dir === 0 ? (
      <IconAngleUp display="none" />
    ) : (
      <IconAngleDown />
    )
  }
  const getSortIcon = () => {
    return dir === 0 ? (
      <IconSortAscending />
    ) : (
      <IconSortDescending />
    )
  }

  const {t} = useTranslation()
  return (
    <div className="project-list-wrapper">
      <p className="project-list-sort-text"> {t('project.sort')}</p>
      <div className="project-list-header">
        {items.map((item, index) => {
          return (
            <Button variant="supplementary" className="header-item" key={index} onClick={() => sort(index,item)}>
              {item}
              {selected !== index && item !== "Muokattu" && <IconSort />}
              {selected === index && item !== "Muokattu" && getArrowIcon(item)}
              {selected !== index && item === "Muokattu" && <IconSortDescending />}
              {selected === index && item === "Muokattu" && getSortIcon(item)}
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
  dir: PropTypes.number.isRequired,
  sortField: PropTypes.func
}

export default ListHeader
