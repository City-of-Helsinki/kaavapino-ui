import React from 'react'
import { Link } from 'react-router-dom'
import { Popup } from 'semantic-ui-react'
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
  }
}) => {
  return (
    <div className="project-list-item-container">
      <div className="project-list-item">
        <span className="project-list-item-name field-ellipsis left">
            {prio}
        </span>
        <span className="project-list-item-name left field-ellipsis">
          <Popup
            trigger={
              <Link className="project-name" to={`/${id}`}>
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
          <ProjectTimeline deadlines={deadlines} projectView={true} onhold={onhold} />
        </div>
      )}
    </div>
  )
}

export default ListItem
