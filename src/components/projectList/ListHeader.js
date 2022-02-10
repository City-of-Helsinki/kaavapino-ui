import React from 'react'
import PropTypes from 'prop-types'
import { Radio } from 'semantic-ui-react'
import { IconAngleUp, IconAngleDown, Button } from 'hds-react'

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
  return (
    <div className="project-list-wrapper">
      <p className="project-list-sort-text">Lajittele</p>
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
          Aikajana
          <Radio onChange={toggleGraph} toggle checked={graphToggled} />
        </span>
      </div>
      <div className="project-list-mb-actions">
        <span className="project-timeline-toggle-mb">
          <Radio
            onChange={toggleGraph}
            toggle
            checked={graphToggled}
            label="Näytä aikajanat"
          />
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
