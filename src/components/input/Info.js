import React from 'react'
import { Link } from 'react-router-dom'
import { Tooltip,IconLinkExternal } from 'hds-react'
import { useTranslation } from 'react-i18next'

const InfoContent = props => {
  const { t } = useTranslation()

  const createInfoLinks = () => {
    if (!props.link){
      return null;
    }
    const linkComponents = [];
    let count = 1;
    for (const link of props.link.split(';')){
      linkComponents.push(
        <div className='link-container' key={count}>
          <Link className="link-underlined" to={{pathname:link}} target="_blank">
            {t('project.more-info') + (count>1 ? ` ${count}` : '')}
            <IconLinkExternal size="xs" aria-hidden="true" />
          </Link>
        </div>
        );
      count++;
    }
    return <>{linkComponents}</>;
  };

  return (
    <React.Fragment>
      <span className="content">{props.content}</span>
      {props.link && createInfoLinks()}
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
  <Tooltip tooltipClassName={"tooltip"} placement="auto">
    <InfoContent content={props.content} link={props.link} linked={props.linked} />
  </Tooltip>
)

export default Info
