import React from 'react'
import { connect } from 'react-redux'
import { downloadDocument, downloadDocumentPreview } from '../../actions/documentActions'
import { Button } from 'hds-react'
import { Grid } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { isCurrentPhaseConfirmed } from '../../utils/projectVisibilityUtils'
//import DocumentConfirmationModal from './DocumentConfirmationModal.jsx'
import PropTypes from 'prop-types'

function Document({
  name,
  file,
  lastDownloaded,
  downloadDocument,
  downloadDocumentPreview,
  phaseEnded,
  isUserResponsible,
  hideButtons,
  schema,
  phaseIndex,
  attribute_data,
  project,
  disableDownloads,
  downloadingDocumentReady
}) {
  const { t } = useTranslation()

  /* Usage of confirmation dialog is commented out due KAAV-2776 */

  //const [showConfirmation, setShowConfirmation] = useState(false)

  /* const confirmationCallback = confirmed => {
    setShowConfirmation(false)

    if (confirmed) {
      downloadDocument({ file, name })
      if(typeof disableDownloads === 'function'){
        disableDownloads()
      }
    }
  } */

  const download = () => {
    downloadDocument({ file, name })
    if(typeof disableDownloads === 'function'){
        disableDownloads()
    }
  }

  /* const renderConfirmationDialog = () => {
    return (
      <DocumentConfirmationModal
        open={showConfirmation}
        callback={confirmationCallback}
      />
    )
  } */

  const disablePreview = (ended,schema) => {
    if(!ended && schema){
      return false
    }
    else{
      return true
    }
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
    return !ended && !hide && schema && currentSchema?.id === project?.phase && phaseConfirmed ? false : true
  }

  const preview = () => {
    downloadDocumentPreview({ file, name })
    if(typeof disableDownloads === 'function'){
      disableDownloads()
    }
  }

  //const openConfirmationDialog = () => setShowConfirmation(true)
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
            {isUserResponsible && (
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
  downloadingDocumentReady: PropTypes.bool
}

const mapDispatchToProps = {
  downloadDocument,
  downloadDocumentPreview
}

export default withRouter(connect(null, mapDispatchToProps)(Document))
