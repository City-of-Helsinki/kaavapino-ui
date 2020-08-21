import React, { Component } from 'react'
import { connect } from 'react-redux'
import { projectFileUpload, projectFileRemove } from '../../actions/projectActions'
import { downloadFile } from '../../actions/apiActions'
import { Button, Progress } from 'semantic-ui-react'

class File extends Component {
  constructor(props) {
    super(props)
    let current = null
    if (props.src) {
      const { src } = props
      const urlParts = src.split('/')
      current = urlParts[urlParts.length - 1]
    }
    this.state = { percentCompleted: 0, current, uploading: false, reading: false }
    this.inputRef = React.createRef()
    if (props.image) {
      this.imageRef = React.createRef()
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
      if (image) {
        this.imageRef.current.src = src
      }
    }
  }

  componentDidMount() {
    const { src, image } = this.props
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
      field: { name }
    } = this.props
    const { current } = this.state
    const confirm = window.confirm(
      `Oletko varma, että haluat poistaa tiedoston ${current}?`
    )
    if (confirm) {
      this.inputRef.current.value = ''
      this.setState({ current: null })
      projectFileRemove(name)
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
    const { field, image, projectFileUpload } = this.props
    const file = this.inputRef.current.files[0]
    if (!file) {
      return
    }
    const path = e.target.value.split('\\')
    let description = prompt('Tiedoston kuvaus')
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
    const { field, image, description } = this.props
    const disabled = field.disabled

    return (
      <div>
        <div className="file-input-container">
          <Button.Group>
            <Button
              disabled={uploading || disabled}
              as="label"
              htmlFor={field.name}
              label={{
                basic: true,
                content: `${
                  this.state.current || (uploading && 'Ladataan...') || 'Valitse tiedosto'
                }`
              }}
              onClick={this.handleClick}
              ref={this.inputButtonRef}
              style={{ overflow: 'auto' }}
              className="upload-button"
            />
            <div className="file-action-buttons">
              {!uploading && current && (
                <Button
                  icon="download"
                  className="file-action-button"
                  onClick={this.download}
                  content="Lataa"
                  disabled={disabled}
                />
              )}
              {!uploading && current && (
                <Button
                  icon="cancel"
                  className="file-action-button"
                  color="red"
                  disabled={disabled}
                  onClick={this.reset}
                />
              )}
            </div>
            {uploading && (
              <Button icon="cancel" color="red" onClick={this.cancel} content="Peruuta" />
            )}
          </Button.Group>
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
        {
          <img
            style={{
              display: `${current && image ? 'block' : 'none'}`,
              marginBottom: '10px'
            }}
            className="image-preview"
            ref={this.imageRef}
            alt={current ? current : ''}
          />
        }
        {current && description && (
          <span className="file-description">
            <b>Kuvaus: </b>
            {description}
          </span>
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

export default connect(null, mapDispatchToProps)(File)
