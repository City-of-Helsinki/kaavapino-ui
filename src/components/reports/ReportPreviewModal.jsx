import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog } from 'hds-react'
import ReportTable from './ReportTable'

function ReportPreviewModal({
  open,
  handleClose,
  report,
  headers,
  handleSubmit,
  noData,
  isReportLoading,
  blockColumn,
  cancelReportLoading
}) {
  const { t } = useTranslation()

  const renderReportContent = () => {
    if (!report || report.length === 0) {
      return null
    }

    return report.map(current => {
      return (
        <div key={current.date} className="report-date">
          {`${blockColumn ? blockColumn : ''} ${current.date }`}
          {current.rows && (
            <ReportTable columns={headers.slice(1, headers.length)} data={current.rows} />
          )}
        </div>
      )
    })
  }
  if (!open) {
    return <></>;
  }
  return (
    <Dialog
      className="preview-modal"
      isOpen
      close={handleClose}
      closeButtonLabelText={t('common.close')}
      scrollable
    >
      <Dialog.Header id="preview-title" title={t('reports.presentation-report.title')} />
      <div className="actions">
        <Button
          variant="secondary"
          isLoading={isReportLoading}
          className="report-create-button"
          loadingText={t('reports.create-report')}
          type="button"
          onClick={handleSubmit}
        >
          {t('reports.create-report')}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => cancelReportLoading()}
          loadingText={t('reports.cancel-report')}
          className="report-cancel-button"
          disabled={!isReportLoading}
        >
          {t('reports.cancel-report')}
        </Button>
      </div>

      <div className="content">
        <h3>{t('reports.presentation-report.title')}</h3>
        {!noData && <div>{t('reports.presentation-report.infoText')}</div>}
        {!noData && renderReportContent()}
        {noData && (
          <div className="empty-report">
            {t('reports.presentation-report.empty-report')}
          </div>
        )}
      </div>
    </Dialog>
  )
}

export default ReportPreviewModal
