import React from 'react'
import { Link } from 'react-router-dom'
import { Popup } from 'semantic-ui-react'
import ProjectTimeline from '../ProjectTimeline/ProjectTimeline'
import { truncate } from 'lodash'
import Status from '../common/Status'
import PropTypes from 'prop-types'

const MAX_PROJECT_NAME_LENGTH = 30

const ListItem = ({
  showGraph,
  deadlines,
  onhold,
  item: {
    phaseName,
    phaseColor,
    name,
    id,
    subtype,
    modified_at,
    user,
    projectId,
    pino_number
  },
  attribute_data
}) => {
  return (
    <div className="project-list-item-container">
      <div className="project-list-item">
        <span className="project-list-item-name left field-ellipsis">
          <Popup
            trigger={
              <Link className="project-name" to={`/projects/${id}`}>
                {truncate(name, { length: MAX_PROJECT_NAME_LENGTH })}
              </Link>
            }
            on="hover"
            content={name}
          />
        </span>
        <span className="left field-ellipsis">{projectId}</span>
        <span className="project-list-item-pino field-ellipsis left">
          {pino_number}
        </span>
        <span className="left field-ellipsis">{subtype}</span>
        <Popup
          trigger={<span className="field-ellipsis left">{user}</span>}
          on="hover"
          content={user}
        />
        <span className="project-list-item-phase left field-ellipsis">
          <Status color={phaseColor} /> {phaseName}
        </span>
        <span className="left field-ellipsis">{modified_at}</span>
      </div>
      {showGraph && (
        <div className="project-list-item-graph">
          <ProjectTimeline deadlines={deadlines} projectView={true} onhold={onhold} attribute_data={attribute_data} />
        </div>
      )}
    </div>
  )
}

ListItem.propTypes = {
  showGraph : PropTypes.bool,
  deadlines: PropTypes.array,
  onhold: PropTypes.bool,
  attribute_data: PropTypes.object,
  item: PropTypes.shape({
    phaseName: PropTypes.string,
    phaseColor: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string,
    subtype: PropTypes.string,
    modified_at: PropTypes.string,
    user: PropTypes.string,
    projectId: PropTypes.string,
    pino_number: PropTypes.string
  })
}

export default ListItem
