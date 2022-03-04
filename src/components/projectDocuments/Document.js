import React, { useState } from 'react'
import { connect } from 'react-redux'
import { downloadDocument, downloadDocumentPreview } from '../../actions/documentActions'
import { Button, IconPhoto } from 'hds-react'
import { Grid } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import DocumentConfirmationModal from './DocumentConfirmationModal'

// Special case for checking that in "Käynnistysvaihe" documents stays downloadable
export const STARTING_PHASE_INDEX = 1

function Document({
  name,
  file,
  lastDownloaded,
  downloadDocument,
  downloadDocumentPreview,
  phaseEnded,
  image_template,
  phaseIndex,
  isUserResponsible
}) {
  const { t } = useTranslation()

  const [showConfirmation, setShowConfirmation] = useState(false)

  const confirmationCallback = confirmed => {
    setShowConfirmation(false)

    if (confirmed) {
      downloadDocument({ file, name })
    }
  }

  const renderConfirmationDialog = () => {
    return (
      <DocumentConfirmationModal
        open={showConfirmation}
        callback={confirmationCallback}
      />
    )
  }

  const openConfirmationDialog = () => setShowConfirmation(true)
  return (
    <>
      {renderConfirmationDialog()}
      <Grid columns="equal" className="document-row ">
        <Grid.Column>
          {image_template && <IconPhoto className="image-template-icon" />}
          <span className="document-title">{name}</span>
        </Grid.Column>
        <Grid.Column>
          <span className="document-title">
            <span>{t('project.document-last-loaded')} </span>
            {lastDownloaded ? dayjs(lastDownloaded).format('DD.MM.YYYY HH:mm') : ''}
          </span>
        </Grid.Column>

        <Grid.Column textAlign="right">
          {(!phaseEnded || phaseIndex === STARTING_PHASE_INDEX) && (
            <>
              <Button
                variant="supplementary"
                onClick={() => downloadDocumentPreview({ file, name })}
                href={file}
                className="document"
              >
                {t('project.load-preview')}
              </Button>
              {isUserResponsible && (
                <Button
                  variant="supplementary"
                  onClick={openConfirmationDialog}
                  href={file}
                  className="document"
                >
                  {t('project.load')}
                </Button>
              )}
            </>
          )}
        </Grid.Column>
      </Grid>
    </>
  )
}

const mapDispatchToProps = {
  downloadDocument,
  downloadDocumentPreview
}

export default withRouter(connect(null, mapDispatchToProps)(Document))
