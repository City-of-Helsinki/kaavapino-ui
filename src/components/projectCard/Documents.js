import React from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

function Documents({ documentFields, hideTitle }) {

  const { t } = useTranslation()
  const renderSection = section => {
    if (!section.documents || section.documents.length === 0) {
      return null
    }
    return (
      <div key={section.section_name} className="section">
        <div className="values">
          <h4>{section.section_name}</h4>
          <div>{renderDocuments(section.documents)}</div>
        </div>
      </div>
    )
  }
  const renderDocuments = documents => {
    return documents.map((document, id) => {
      return (
        <div key={document.link + id}>
          <Link key={document.link + id} to={{ pathname: document.link }} target="_blank">
            {document.document_name ? document.document_name : document.link}
          </Link>
        </div>
      )
    })
  }
  const renderFields = () => {
    return (
      <div>
        {documentFields &&
            documentFields.sections &&
            documentFields.sections.map(section => {
            return renderSection(section)
          })}
      </div>
    )
  }
  const fieldsComponent = renderFields()

  return (
    <div className="documents">
      {!hideTitle && <h3>{t('project.documents-title')}</h3>}
      <div>{fieldsComponent}</div>
    </div>
  )
}

Documents.propTypes = {
    documentFields: PropTypes.object
}

export default Documents
