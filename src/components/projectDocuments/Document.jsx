import React from 'react'
import { connect } from 'react-redux'
import { downloadDocument, downloadDocumentPreview } from '../../actions/documentActions'
import { Button } from 'hds-react'
import { Grid } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { isCurrentPhaseConfirmed } from '../../utils/projectVisibilityUtils'
import PropTypes from 'prop-types'

function Document({
  name,
  file,
  lastDownloaded,
  downloadDocument,
  downloadDocumentPreview,
  phaseEnded,
  isThePersonResponsible,
  hideButtons,
  schema,
  phaseIndex,
  attribute_data,
  project,
  disableDownloads,
  downloadingDocumentReady
}) {
  const { t } = useTranslation()


  const download = () => {
    downloadDocument({ file, name })
    if(typeof disableDownloads === 'function'){
        disableDownloads()
    }
  }

  const disablePreview = (ended,schema) => {
    return !(!ended && schema);
  }

  const disableDownload = (ended,hide,schema) => {
    let currentSchemaIndex = schema?.subtype_name === "XL" && attribute_data?.luonnos_luotu && !attribute_data?.periaatteet_luotu ? phaseIndex - 2 : phaseIndex - 1
    if(schema?.subtype_name === "XL" && !attribute_data?.luonnos_luotu && attribute_data?.periaatteet_luotu && phaseIndex === 5){
      currentSchemaIndex = 3
    }
    else if(schema?.subtype_name === "XL" && !attribute_data?.luonnos_luotu && attribute_data?.periaatteet_luotu && phaseIndex === 6){
      currentSchemaIndex = 4
    } 
    const currentSchema = schema?.phases[currentSchemaIndex]
    const phaseConfirmed = isCurrentPhaseConfirmed(attribute_data)
    return !(!ended && !hide && schema && currentSchema?.id === project?.phase && phaseConfirmed)
  }

  const preview = () => {
    downloadDocumentPreview({ file, name })
    if(typeof disableDownloads === 'function'){
      disableDownloads()
    }
  }

  return (
    <Grid columns="equal" className="document-row ">
      <Grid.Column>
        <span className="document-title document-header">{name}</span>
        <span className="document-last-loaded">
          <span>{t('project.document-last-loaded')} </span>
          <span>{lastDownloaded ? dayjs(lastDownloaded).format('DD.MM.YYYY HH:mm') : ''}</span>
        </span>
      </Grid.Column>

      <Grid.Column textAlign="right">
          <>
            <Button
              size='small'
              variant="secondary"
              onClick={() => {preview()}}
              href={file}
              className="document-button"
              disabled={disablePreview(phaseEnded,schema) || !downloadingDocumentReady}
            >
              {t('project.load-preview')}
            </Button>
            {isThePersonResponsible && (
              <Button
                size='small'
                variant="primary"
                onClick={() => download()}
                href={file}
                className="document-button"
                disabled={disableDownload(phaseEnded,hideButtons,schema) || !downloadingDocumentReady}
              >
                {t('project.load')}
              </Button>
            )}
          </>
      </Grid.Column>
    </Grid>
  )
}

Document.propTypes = {
  schema: PropTypes.object,
  attribute_data: PropTypes.object,
  phaseIndex: PropTypes.number,
  project: PropTypes.object,
  disableDownloads: PropTypes.func,
  downloadingDocumentReady: PropTypes.bool,
  name: PropTypes.string,
  file: PropTypes.string,
  lastDownloaded: PropTypes.string,
  downloadDocument: PropTypes.func,
  downloadDocumentPreview: PropTypes.func,
  phaseEnded: PropTypes.bool,
  isThePersonResponsible: PropTypes.bool,
  hideButtons: PropTypes.bool,
}

const mapDispatchToProps = {
  downloadDocument,
  downloadDocumentPreview
}

export default withRouter(connect(null, mapDispatchToProps)(Document))
