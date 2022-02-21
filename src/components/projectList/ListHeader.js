import React from 'react'
import PropTypes from 'prop-types'
import { Radio } from 'semantic-ui-react'
import { IconAngleUp, IconAngleDown, Button } from 'hds-react'
import { useTranslation } from 'react-i18next';

const ListHeader = ({
  items,
  sort,
  selected,
  dir,
  toggleGraph,
  graphToggled}) => {
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
        <span className="timeline-header-item  project-timeline-toggle">
          {t('project.timeline')}
          <Radio onChange={toggleGraph} aria-label={t('project.show-timelines')} toggle checked={graphToggled} />
        </span>
      </div>
    </div>
  )
}

ListHeader.propTypes = {
  toggleSearch: PropTypes.func,
  searchOpen: PropTypes.bool,
  toggleGraph: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
  sort: PropTypes.func.isRequired,
  dir: PropTypes.number.isRequired
}

export default ListHeader
