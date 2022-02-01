import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { reduxForm, getFormValues } from 'redux-form'
import {
  downloadReport,
  downloadReportReview,
  clearDownloadReportReview,
  cancelReportLoading,
  cancelReportPreviewLoading
} from '../../actions/reportActions'
import {
  reportsSelector,
  currentReportsSelector,
  reportPreviewLoadingSelector,
  reportLoadingSelector
} from '../../selectors/reportSelector'
import { Form } from 'semantic-ui-react'
import ReportFilters from './ReportFilters'
import { Button } from 'hds-react'
import { useTranslation } from 'react-i18next'
import { fetchReports } from '../../actions/reportActions'
import { REPORT_FORM } from '../../constants'
import { readString } from 'react-papaparse'
import ReportPreviewModal from './ReportPreviewModal'
import { parseReport } from './reportUtils'
import { findIndex } from 'lodash'
import { LoadingSpinner } from 'hds-react'

function ReportBuilder(props) {
  const [selectedReport, setSelectedReport] = useState(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReportLoading, setIsReportLoading] = useState(false)
  const [currentReportData, setCurrentReportData] = useState()

  const { t } = useTranslation()

  useEffect(() => {
    props.clearDownloadReportReview()
    props.fetchReports()
  }, [])

  const handleSubmit = () => {
    props.downloadReport({ selectedReport: selectedReport.id })
  }

  useEffect(() => {
    setCurrentReportData(props.currentReport)
  }, [props.currentReport])

  useEffect(() => {
    if (currentReportData) {
      setShowPreviewModal(true)
    }
  }, [currentReportData])

  useEffect(() => {
    setShowPreviewModal(false)
    setCurrentReportData(undefined)
    props.initialize(null)
  }, [selectedReport])

  useEffect(() => {
    setIsLoading(props.reviewLoading)
  }, [props.reviewLoading])

  useEffect(() => {
    setIsReportLoading(props.reportLoading)
  }, [props.reportLoading])

  const onShowPreviewModal = () => {
    props.downloadReportReview({ selectedReport: selectedReport.id })
  }
  const renderReportButtons = () => {
    const { reports } = props

    return reports.map(report => (
      <Button
        className="report-type-button"
        key={report.id}
        variant="secondary"
        onClick={() =>
          !selectedReport || selectedReport.id !== report.id
            ? setSelectedReport(report)
            : setSelectedReport(null)
        }
      >
        {report.name}
      </Button>
    ))
  }
  const current = currentReportData
    ? readString(currentReportData, { encoding: 'utf-8' })
    : null

  const getHeaders = () => {
    const columns = []
    const data = current && current.data

    if (!data || !data[0]) {
      return columns
    }

    const headerRow = data[0]

    headerRow.forEach(column => {
      if (column === 'Selite') {
        return columns.push({
          Header: column,
          accessor: getNonDuplicateName(column, columns),
          minWidth: 200,
          width: 200
        })
      }
      return columns.push({
        Header: column,
        accessor: getNonDuplicateName(column, columns)
      })
    })

    return columns
  }
  function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }

  const getNonDuplicateName = (column, list) => {
    if (!list || list.length === 0) {
      return column
    }
    if (
      findIndex(list, item => {
        return item.accessor === column
      }) !== -1
    ) {
      const randomNumber = getRandomInt(10000)
      return column + randomNumber
    } else {
      return column
    }
  }

  const headers = getHeaders()

  const getContent = () => {
    const data = current && current.data

    if (!data || data.length < 2) {
      return null
    }

    const returnValue = []

    const content = data.slice(1, data.length - 1)

    content.forEach(row => {
      const rowValues = {}

      row.forEach((column, index) => {
        const header = headers[index].accessor
        rowValues[header] = column
      })
      returnValue.push(rowValues)
    })
    return returnValue
  }

  const hidePreview = () => {
    setShowPreviewModal(false)
    setIsLoading(false)
    setCurrentReportData(undefined)
    props.clearDownloadReportReview()
  }

  const content = getContent()

  if (!props.reports) {
    return <LoadingSpinner />
  }

  const noData = !headers || headers.length === 0 || !content || content.length === 0

  return (
    <>
      <div className="select-report-container">
        <h2>{t('reports.choose-report')}</h2>
        {renderReportButtons()}
      </div>
      <Form onSubmit={handleSubmit} className="report-builder-container">
        {selectedReport && (
          <div className="report-filter-container">
            <h2>{selectedReport.name}</h2>
            <h3>{t('reports.filters')}</h3>
            <ReportFilters filters={selectedReport.filters} />
          </div>
        )}
        {selectedReport && selectedReport.previewable === false && (
          <>
            <Button
              type="submit"
              variant="primary"
              loadingText={t('reports.create-report')}
              className="report-create-button"
              isLoading={isReportLoading}
            >
              {t('reports.create-report')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => props.cancelReportLoading()}
              loadingText={t('reports.cancel-report')}
              className="report-cancel-button"
              disabled={!isReportLoading}
            >
              {t('reports.cancel-report')}
            </Button>
          </>
        )}

        {selectedReport && selectedReport.previewable === true && (
          <>
            <Button
              type="button"
              onClick={onShowPreviewModal}
              variant="primary"
              className="report-create-button"
              loadingText={t('reports.create-preview')}
              isLoading={isLoading}
            >
              {t('reports.create-preview')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => props.cancelReportPreviewLoading()}
              loadingText={t('reports.create-report')}
              className="report-cancel-button"
              disabled={!isLoading}
            >
              {t('reports.cancel-preview')}
            </Button>
          </>
        )}
      </Form>
      <ReportPreviewModal
        open={showPreviewModal}
        noData={noData}
        isReportLoading={isReportLoading}
        handleSubmit={handleSubmit}
        handleClose={hidePreview}
        headers={headers}
        cancelReportLoading={props.cancelReportLoading}
        report={parseReport(
          headers,
          content,
          selectedReport && selectedReport.preview_title_column,
          props.formValues && props.formValues.aikavali
        )}
        blockColumn={selectedReport && selectedReport.preview_title_column}
      />
    </>
  )
}

const mapStateToProps = state => ({
  reports: reportsSelector(state),
  currentReport: currentReportsSelector(state),
  reviewLoading: reportPreviewLoadingSelector(state),
  reportLoading: reportLoadingSelector(state),
  formValues: getFormValues(REPORT_FORM)(state)
})

const mapDispatchToProps = {
  downloadReport,
  downloadReportReview,
  fetchReports,
  clearDownloadReportReview,
  cancelReportLoading,
  cancelReportPreviewLoading
}

export default reduxForm({
  form: REPORT_FORM,
  enableReinitialize: true
})(connect(mapStateToProps, mapDispatchToProps)(ReportBuilder))
