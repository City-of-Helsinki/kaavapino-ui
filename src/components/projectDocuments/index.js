import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { fetchDocuments, downloadDocumentPreview } from '../../actions/documentActions'
import { fetchSchemas} from '../../actions/schemaActions'
import { schemaSelector} from '../../selectors/schemaSelector'
import {
  documentsSelector,
  documentsLoadingSelector,
  documentPreviewSelector
} from '../../selectors/documentSelector'
import { currentProjectIdSelector } from '../../selectors/projectSelector'
import { LoadingSpinner } from 'hds-react'
import DocumentGroup from './DocumentGroup'
import { useTranslation } from 'react-i18next'
import authUtils from '../../utils/authUtils'


function ProjectDocumentsPage(props) {
  const {currentProjectId, currentUserId, users, fetchDocuments, documents, documentsLoading,project,fetchSchemas,schema,selectedPhase, search} = props
  useEffect(() => {
      fetchDocuments(currentProjectId)
      fetchSchemas(project.id, project.subtype)
  }, [])

  const {t} = useTranslation()

  const isUserResponsible = authUtils.isResponsible(currentUserId, users)

  const groupDocuments = documents => {
    const result = {}
    documents.forEach(doc => {
      if (!doc.phases) {
        return null
      }

      doc.phases.forEach(phase => {
        if (!result[phase.phase_index]) {
          result[phase.phase_index] = {
            title: phase.phase_name,
            documents: [],
            phaseEnded: phase.phase_ended,
            phaseIndex: phase.phase_index
          }
        }
        result[phase.phase_index].documents.push(doc)
      })
      
    })
    return result
  }
  
  const groupedDocuments = groupDocuments(documents)
  const getTitle = key => {
    const current = groupedDocuments[key]

    return (
      <>
        <span>
          {current.title}
        </span>
      </>
    )
  }

  const renderDocumentList = () => (
    <div className="documents-page-container">
      {documentsLoading && <LoadingSpinner className="loader-icon" />}
      {!documentsLoading && Object.keys(groupedDocuments).length === 0 && (
        <p className="no-documents">{t('project.no-documents')}</p>
      )}
      {Object.keys(groupedDocuments).map(key => (
        <DocumentGroup
          key={key}
          title={getTitle(key)}
          phaseEnded={groupedDocuments[key].phaseEnded}
          documents={groupedDocuments[key].documents}
          projectId={currentProjectId}
          phase={groupedDocuments[key]}
          isUserResponsible={isUserResponsible}
          schema={schema}
          attribute_data={project.attribute_data}
          selectedPhase={selectedPhase}
          search={search}
          project={project}
        />
      ))}
    </div>
  )

  if(schema){
    return renderDocumentList()
  }
}

const mapStateToProps = state => {
  return {
    documents: documentsSelector(state),
    documentsLoading: documentsLoadingSelector(state),
    currentProjectId: currentProjectIdSelector(state),
    documentPreview: documentPreviewSelector(state),
    schema: schemaSelector(state),
  }
}

const mapDispatchToProps = {
  fetchDocuments,
  downloadDocumentPreview,
  fetchSchemas
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectDocumentsPage)
