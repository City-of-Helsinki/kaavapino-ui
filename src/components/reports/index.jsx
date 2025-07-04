import React from 'react'
import { NavHeader } from '../common/NavHeader'
import ReportBuilder from './ReportBuilder'
import { useTranslation } from 'react-i18next'
import Header from '../common/Header'

function Reports() {
  const { t } = useTranslation()

  return (
    <>
      <Header />
      <div className="reports-page">
        <NavHeader
          routeItems={[
            { value: t('projects.title'), path: '/projects' },
            { value: t('reports.title'), path: '/reports' }
          ]}
          title={t('reports.title')}
        />
        <ReportBuilder />
      </div>
    </>
  )
}

export default Reports
