import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigation, Button, IconAngleLeft } from 'hds-react'
import { useHistory } from 'react-router-dom'

const DocumentsPageHeader = () => {
  const { t } = useTranslation()
  const history = useHistory();

  useEffect(() => {
    document.getElementById('document-page-header-nav').setAttribute('role', 'none')
  });

  const navigateBackToEdit = () => {
    let path = history.location.pathname
    path = path.replace('documents','edit');
    history.push(path)
  }
  
  return (
    <div className='document-page-header'>
      <Navigation
          id="document-page-header-nav"
          label="navigation"
          skipTo='#main'
          skipToContentLabel={t('header.skip-to-content')}
      >
        <Navigation.Row variant="inline">
          <Button onClick={() => navigateBackToEdit()} role="link" variant="supplementary" size="small" iconLeft={<IconAngleLeft />}>{t('header.documents-menu-back')}</Button>
        </Navigation.Row>
      </Navigation>
    </div>
)
}

export default DocumentsPageHeader