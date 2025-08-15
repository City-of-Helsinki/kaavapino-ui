import React from 'react'
import { Link } from 'react-router-dom'
import ProjectTimeline from '../ProjectTimeline/ProjectTimeline'
import { truncate } from 'lodash'
import Status from '../common/Status'

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
    pino_number,
    prio
  },
  attribute_data
}) => {
  return (
    <div className="project-list-item-container">
      <div className="project-list-item">
        <span className="project-list-item-name field-ellipsis left">
            {prio}
        </span>
        <span className="project-list-item-name left field-ellipsis tooltip-wrapper">
          <Link className="project-name" to={`/projects/${id}`}>
            {truncate(name, { length: MAX_PROJECT_NAME_LENGTH })}
          </Link>
          <span className="tooltip-text">{name}</span>
        </span>
        <span className="left field-ellipsis">{projectId}</span>
        <span className="project-list-item-pino field-ellipsis left">
          {pino_number}
        </span>
        <span className="left field-ellipsis">{subtype}</span>
        <span className="field-ellipsis left tooltip-wrapper">
          {user}
          <span className="tooltip-text">{user}</span>
        </span>
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

export default ListItem
