import React from 'react'
import { Polygon, Popup } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import { withRouter } from 'react-router-dom'

const CustomMapPolygon = ({
  positions,
  children,
  project,
  isPrivileged,
  history,
  color
}) => {
  const { t } = useTranslation()

  const goToProjectCard = id => {
    if (history) {
      history.push(`/projects/${id}`)
    }
  }
  const goToProjectEdit = id => {
    if (history) {
      history.push(`/projects/${id}/edit`)
    }
  }
  const renderPopupValue = () => {
    if (!project) {
      return null
    }

    return (
      <div className="popup-grid">
        <div className="row-full">
          <div className="bold">{project.pino_number}</div>
          <div className="name">{project.name}</div>
        </div>

        <div className="label">{t('floor-area.tooltip.phase')}</div>
        <div className="value">
          <span
            className="dot"
            style={{ backgroundColor: project.phase?.color_code }}
          />
          <span>{project.phase?.name}</span>
        </div>

        <div className="label">{t('floor-area.tooltip.process-size')}</div>
        <div className="value">{project.subtype?.name}</div>

        <div className="label">{t('floor-area.tooltip.responsible-person')}</div>
        <div className="value">{project.user_name}</div>

        <div className="row-full actions">
          <button
            className="popup-button"
            onClick={() => goToProjectCard(project.pk)}
          >
            {t('floor-area.tooltip.show-project-card')}
          </button>
          {isPrivileged && (
            <button
              className="popup-button"
              onClick={() => goToProjectEdit(project.pk)}
            >
              {t('floor-area.tooltip.modify')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Polygon color={color} fillColor={color} positions={positions} fillOpacity={0.8}>
      {children}
      <Popup closeButton={false}>{renderPopupValue()}</Popup>
    </Polygon>
  )
}

export default withRouter(CustomMapPolygon)
