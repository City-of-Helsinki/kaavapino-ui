import React, { Component } from 'react'
import { connect } from 'react-redux'
import { projectFileUpload, projectFileRemove } from '../../actions/projectActions'
import { downloadFile } from '../../actions/apiActions'
import { Progress } from 'semantic-ui-react'
import 'core-js/features/array/at';
import { Document, Page, pdfjs } from 'react-pdf'
import { showField } from '../../utils/projectVisibilityUtils'
import { withTranslation } from 'react-i18next'
import { Button, IconDownload, IconCrossCircle, IconUpload } from 'hds-react'

class File extends Component {
  constructor(props) {
    super(props)
    let current = null
    if (props.src) {
      const { src } = props
      const urlParts = src.split('/')
      current = urlParts[urlParts.length - 1]
    }
    this.state = {
      percentCompleted: 0,
      current,
      uploading: false,
      reading: false
    }
    this.inputRef = React.createRef()
    if (props.image) {
      this.imageRef = React.createRef()
    }
    if (this.imageRef) {
      this.imageRef.current = {}
    }
  }
  componentDidUpdate(prevProps) {
    if (prevProps.src !== this.props.src && !prevProps.uploading) {
      const { src, image } = this.props
      if (!src) {
        this.inputRef.current.value = ''
        if (image) {
          this.imageRef.current.src = ''
        }
        this.setState({ current: null })
        return
      }
      const urlParts = src.split('/')
      this.setState({ current: urlParts[urlParts.length - 1] })
      if (image && this.imageRef.current) {
        this.imageRef.current.src = src
      }
    }
  }

  componentDidMount() {
    const { src, image } = this.props
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js'

    if (src && image) {
      this.imageRef.current.src = src
    }
  }

  handleClick = e => {
    e.preventDefault()
    this.inputRef.current.click()
  }

  reset = () => {
    const {
      projectFileRemove,
      field: { name },
      onBlur,
      t
    } = this.props
    const { current } = this.state

    const confirmText = t('file.remove-question', { current: current })
    const confirm = window.confirm(confirmText)
    if (confirm) {
      this.inputRef.current.value = ''
      this.setState({ current: null })
      projectFileRemove(name)
      onBlur()
    }
  }

  download = () => {
    const { src } = this.props
    const { current } = this.state
    this.props.downloadFile({ src, name: current })
  }

  cancel = () => {
    if (this.cancelToken) {
      this.cancelToken.cancel()
    }
    this.inputRef.current.value = ''
    this.setState({ percentCompleted: 0, uploading: false, reading: false })
  }

  callback = (progressEvent, onCompleted) => {
    let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total)
    this.setState({ percentCompleted })
    if (percentCompleted === 100) {
      setTimeout(() => {
        this.setState({ uploading: false })
        onCompleted()
      }, 300)
    }
  }

  onChangeFile = e => {
    const { field, image, projectFileUpload, t } = this.props
    const file = this.inputRef.current.files[0]
    if (!file) {
      return
    }
    const path = e.target.value.split('\\')
    let description = prompt(t('file.description'))
    if (!description) description = ''
    const onCompleted = () => {
      this.setState({ current: path[path.length - 1], reading: true })
      try {
        const reader = new FileReader()
        if (image) {
          reader.onloadend = () => {
            if (this.imageRef.current) {
              this.imageRef.current.src = reader.result
              this.inputRef.current.value = ''
              this.setState({ reading: false })
            }
          }
        }
        reader.readAsDataURL(file)
      } catch (e) {
        return
      }
    }
    projectFileUpload({
      attribute: field.name,
      file,
      description,
      callback: e => this.callback(e, onCompleted),
      setCancelToken: token => (this.cancelToken = token)
    })
    this.setState({ uploading: true, percentCompleted: 0 })
  }

  render() {
    const { current, uploading, percentCompleted } = this.state
    const { field, image, description, src, formValues, t } = this.props
    const disabled = field.disabled
    if (!showField(field, formValues)) {
      return null
    }

    let filePreview = (
      <img
        style={{
          display: `${current && image ? 'block' : 'none'}`,
          marginBottom: '10px'
        }}
        className="image-preview"
        ref={this.imageRef}
        aria-label="image"
        alt={current ? current : ''}
      />
    )

    if (current) {
      if (current.includes('.pdf') && src) {
        filePreview = (
          <Document
            style={{
              display: `${current && image ? 'block' : 'none'}`,
              marginBottom: '10px'
            }}
            className="image-preview"
            file={src}
            alt={current ? current : ''}
          >
            <Page pageNumber={1} />
          </Document>
        )
      }
    }

    return (
      <div>
        <div className="file-input-container">
          <Button
            disabled={uploading || disabled}
            iconLeft={<IconUpload />}
            variant="secondary"
            onClick={this.handleClick}
            ref={this.inputButtonRef}
            className="upload-button"
          >
            {uploading && t('file.loading')}
            {this.state.current && !uploading && t('file.change-file')}
            {this.state.current === null && !uploading && t('file.choose-file')}
          </Button>
          <div className="file-action-buttons">
            {!uploading && current && (
              <Button
                iconLeft={<IconDownload />}
                onClick={this.download}
                disabled={disabled}
                variant="secondary"
                className="download-button"
              >{t('file.preview')} </Button>
            )}
            {!uploading && current && (
              <Button
                iconLeft={<IconCrossCircle />}
                variant="secondary"
                className="remove-button remove"
                disabled={disabled}
                onClick={this.reset}
              >{t('file.remove')} </Button>
            )}
          </div>
          {uploading && (
            <Button
              variant="supplementary"
              icon="cancel"
              onClick={this.cancel}
              content={t('file.cancel')}
            >{t('file.cancel')}</Button>
          )}
        </div>
        <input
          ref={this.inputRef}
          hidden
          id={field.name}
          multiple
          type="file"
          onChange={this.onChangeFile}
          disabled={disabled}
        />
        {uploading && <Progress percent={percentCompleted} progress indicating />}
        {current && description && (
          <div className='assistive'>{t('file.confirmed-files')}</div>
        )}
        {filePreview}
        {current && description && (
          <>
          <div><b>{t('file.file-name')} </b>{this.state.current}</div>
          <span className="file-description">
            <b>{t('file.description')} </b>
            {description}
          </span>
          </>
        )}
      </div>
    )
  }
}

const mapDispatchToProps = {
  projectFileUpload,
  projectFileRemove,
  downloadFile
}

export default connect(null, mapDispatchToProps)(withTranslation()(File))
