import React from 'react'
import { Link } from 'react-router-dom'
import { Tooltip,IconLinkExternal } from 'hds-react'
import { useTranslation } from 'react-i18next'

const InfoContent = props => {
  const { t } = useTranslation()
  return (
    <React.Fragment>
      <span className="content">{props.content}</span>
      {props.link && (
        <div className='link-container'>
          <Link className="link-underlined" to={{ pathname: props.link }} target="_blank">
            {t('project.more-info')}
            <IconLinkExternal size="xs" aria-hidden="true" />
          </Link>
        </div>
      )}
      {props.linked && (
        <div className='linked-fields'>
          <span className='linked-header'>{t('project.header-text')}</span>
          <ul className='linked-fields-list'>
          {props.linked.map((info) => 
            <li className='linked-list-element' key={info}>{info}</li>
            )
          }
          </ul>
        </div>
      )}
    </React.Fragment>
  )
}

const Info = props => (
  <Tooltip tooltipClassName={props.className} placement="top">
    <InfoContent content={props.content} link={props.link} linked={props.linked} />
  </Tooltip>
)

export default Info
