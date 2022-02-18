import React from 'react'
import { Link } from 'react-router-dom'
import { Tooltip } from 'hds-react'
import { useTranslation } from 'react-i18next'

const InfoContent = props => {
  const { t } = useTranslation()

  return (
    <React.Fragment>
      <span className="content">{props.content}</span>
      {props.link && (
        <div>
          <Link to={{ pathname: props.link }} target="_blank">
            {t('project.more-info')}
          </Link>
        </div>
      )}
    </React.Fragment>
  )
}

const Info = props => (
  <Tooltip tooltipClassName={props.className} placement="top">
    <InfoContent content={props.content} link={props.link} />
  </Tooltip>
)

export default Info
