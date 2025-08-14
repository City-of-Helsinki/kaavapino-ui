import React from 'react'
import { connect } from 'react-redux'
import { checkingSelector } from '../../../selectors/projectSelector'
import CustomField from '../CustomField'
import projectUtils from '../../../utils/projectUtils'
import './styles.scss'
import Info from '../../../components/input/Info'

const Matrix = ({
  field: { matrix },
  checking,
  attributeData,
  formName,
  isFloorCalculation,
  insideFieldset,
  hasEditRights
}) => {
  const { rows, columns, fields } = matrix

  const columnCount = columns.length
  const rowCount = rows.length

  const matrixStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columnCount}, 1fr`,
    gridTemplateRows: `repeat(${rowCount}, minmax(auto, auto)`
  }
  const countFieldsInRow = row => {
    let fields = 0
    row.forEach(field => {
      if (field !== 0) {
        fields++
      }
    })
    return fields
  }

  const fieldMatrix = []
  const col = Array(columnCount).fill(0)
  rows.forEach(() => fieldMatrix.push([...col]))
  fields.forEach(({ row: x, column: y, ...rest }) => {
    fieldMatrix[x][y] = { ...rest }
  })

  const renderInfo = field => {
    return <Info content={field.help_text} link={field.help_link} linked={field.linked_fields} help_img_link={field.help_img_link}/>
  }
  return (
    <div className="matrix-container" data-testid="matrix-testid" >
      <div className="matrix" style={matrixStyle}>
        {fieldMatrix.map((row, y) => {
          return (
            <React.Fragment key={`${rows[y]}-${y}`}>
              {rows[y] && (
                <span className="row-header" style={{ gridColumn: '1 / -1' }}>
                  {rows[y]}
                </span>
              )}
              {row.map((field, x) => {
                const highlighted =
                  field !== 0 &&
                  checking &&
                  projectUtils.isFieldMissing(field.name, field.required, attributeData)
                let rowColumnStyle = null
                if (countFieldsInRow(row) <= 1) {
                  rowColumnStyle = { gridColumn: `1 / ${columnCount}` }
                }
                return (
                  <React.Fragment key={`${field.name}-${y}-${x}-total`}>
                    <span style={{ display: 'contents' }}>
                      {field === 0 ? (
                        <span />
                      ) : (
                        <span
                          data-testid={field.name+"test-highligh"}
                          className={`${highlighted ? 'highlighted' : 'rowColumnStyle'}`}
                          style={rowColumnStyle}
                          key={`${field.name}-${y}-${x}`}
                        >
                          <div className="input-header">
                            <div className="input-title">{columns[x]}</div>
                            <div className="input-header-icons">{renderInfo(field)}</div>
                          </div>
                          <CustomField
                            attributeData={attributeData}
                            field={field}
                            fieldset={field.type === 'fieldset'}
                            formName={formName}
                            isFloorCalculation={isFloorCalculation}
                            insideFieldset={insideFieldset}
                            hasEditRights={hasEditRights}
                          />
                        </span>
                      )}
                    </span>
                  </React.Fragment>
                )
              })}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  checking: checkingSelector(state)
})

export default connect(mapStateToProps)(Matrix)
