import React, { useState } from 'react'
import {
  Navigation,
  IconSignout,
  IconPlus,
  IconPen,
  IconDownload,
  IconRefresh
} from 'hds-react'
import { ReactComponent as HistogramMobileIcon } from '../../assets/histogram-mobile.svg'
import { ReactComponent as ChecklistMobile } from '../../assets/checklist-mobile.svg'
import { ReactComponent as PagesMobile } from '../../assets/pages-mobile.svg'
import { ReactComponent as HistogramMobileIconDev } from '../../assets/histogram-mobile-dev.svg'
import { ReactComponent as ChecklistMobileDev } from '../../assets/checklist-mobile-dev.svg'
import { ReactComponent as PagesMobileDev } from '../../assets/pages-mobile-dev.svg'
import { withRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from './ConfirmationModal'
import "hds-core";

const Header = props => {
  const [showConfirm, setShowConfirm] = useState(false)

  const currentEnv = process.env.NODE_ENV

  const navigateToProjects = () => {
    props.history.push('/projects')
  }

  const navigateToHome = () => {
    props.history.push('/')
  }

  const navigateToReports = () => {
    props.history.push('/reports')
  }

  const logout = () => {
    props.history.push('/Logout')
  }
  const { user, userRole } = props

  const { t } = useTranslation()

  const label = userRole
    ? `${user && user.profile.name} (${userRole})`
    : user && user.profile.name

  const renderConfirmationDialog = () => {
    return <ConfirmationModal callback={callback} open={showConfirm} />
  }

  const callback = value => {
    setShowConfirm(false)
    if (value) {
      props.resetProjectDeadlines()
    }
  }
  
  const backgroundColor = currentEnv === 'production' ?  'var(--color-fog-light)' : 'var(--color-brick-light)'
  return (
    <>
      {renderConfirmationDialog()}

      <Navigation
      label="navigation"
        logoLanguage="fi"
        menuToggleAriaLabel={t('header.choices-label')}
        title={currentEnv === 'production' ? t('title'): t('title') + '(' + currentEnv + ')'}
        titleAriaLabel={ t('title')}
        titleUrl="./"
        className="header"
        theme={{
          '--header-background-color': backgroundColor,
          '--header-color': 'var(--color-black-90)',
          '--header-divider-color': 'var(--color-black-20)',
          '--header-focus-outline-color': 'var(--color-black)',
          '--mobile-menu-background-color': 'var(--color-white)',
          '--mobile-menu-color': 'var(--color-black-90)',
          '--navigation-row-background-color': 'var(--color-white)',
          '--navigation-row-color': 'var(--color-black-90)',
          '--navigation-row-focus-outline-color': 'var(--color-coat-of-arms)'
        }}
      >
        <Navigation.Row variant="inline">
          <Navigation.Item
            as="a"
            label={t('header.overview')}
            onClick={navigateToHome}
            icon={currentEnv === 'production' ? <HistogramMobileIcon /> : <HistogramMobileIconDev/>}
          />
          <Navigation.Item
            as="a"
            label={t('header.projects')}
            onClick={navigateToProjects}
            icon={currentEnv === 'production' ? <ChecklistMobile />: <ChecklistMobileDev/>}
          />
          <Navigation.Item
            as="a"
            label={t('header.reports')}
            icon={currentEnv === 'production' ? <PagesMobile /> : <PagesMobileDev/>}
            onClick={navigateToReports}
          />
        </Navigation.Row>
        <Navigation.Actions>
          <Navigation.User authenticated={true}>
            <Navigation.Item label={label} href="/" target="_blank" variant="primary" />
            {props.createProject && props.showCreate && (
              <Navigation.Item
                label={t('projects.createNewProject')}
                className="pointer"
                onClick={props.openCreateProject}
                icon={<IconPlus aria-hidden />}
                variant="primary"
              />
            )}
            {props.modifyProject && props.showCreate && (
              <Navigation.Item
                label={t('project.modify-project')}
                className="pointer"
                onClick={props.openModifyProject}
                variant="primary"
                icon={<IconPen />}
              />
            )}
            {props.showPrintProjectData && (
              <Navigation.Item
                label={t('project.print-project-data')}
                className="pointer"
                onClick={props.openPrintProjectData}
                variant="primary"
                icon={<IconDownload />}
              />
            )}
            {props.resetDeadlines && props.showCreate && <Navigation.Item
              label={t('deadlines.reset-project-deadlines')}
              className="pointer"
              onClick={() => setShowConfirm(true)}
              variant="primary"
              icon={<IconRefresh />}
            />
            }

            <Navigation.Item
              href="#"
              icon={<IconSignout aria-hidden />}
              label={t('header.sign-out')}
              onClick={logout}
              variant="supplementary"
            />
          </Navigation.User>
        </Navigation.Actions>
      </Navigation>
    </>
  )
}

export default withRouter(Header)
