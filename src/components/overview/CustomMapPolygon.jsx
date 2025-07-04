import React from 'react'
import { Polygon, Popup } from 'react-leaflet'
import { Grid } from 'semantic-ui-react'
import { Button } from 'hds-react'
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
      <Grid columns="equal" className="tooltip">
        <Grid.Row>
          <Grid.Column>{project.pino_number}</Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column className="header">{project.name}</Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>{t('floor-area.tooltip.phase')}</Grid.Column>
          <Grid.Column textAlign="right">
            <span
              style={{ backgroundColor: project.phase && project.phase.color_code }}
              className="dot"
            ></span>
            <span className="value">{project.phase && project.phase.name}</span>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>{t('floor-area.tooltip.process-size')}</Grid.Column>
          <Grid.Column className="value" textAlign="right">
            {project.subtype && project.subtype.name}
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>{t('floor-area.tooltip.responsible-person')}</Grid.Column>
          <Grid.Column className="value" textAlign="right">
            {project.user_name}
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column className="button-area">
            <Button
              onClick={() => goToProjectCard(project.pk)}
              className="tooltip-button"
              variant="supplementary"
            >
              {t('floor-area.tooltip.show-project-card')}
            </Button>
          </Grid.Column>
          <Grid.Column className="button-area" textAlign="right">
            {isPrivileged && (
              <Button
                onClick={() => goToProjectEdit(project.pk)}
                className="tooltip-button"
                variant="supplementary"
              >
                {t('floor-area.tooltip.modify')}
              </Button>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
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
