import React, { useState } from 'react'
import './styles.scss'
import { useTranslation } from 'react-i18next'
import { Button, IconSearch } from 'hds-react'

const RoleHighlightPicker = ({ onRoleUpdate }) => {
  const [highlightedRole, setHighlightedRole] = useState(null)
  const { t } = useTranslation()

  const roles = [t('project.admin'), t('project.expert')]

  const handleOnClick = index => {
    if (highlightedRole === index) {
      setHighlightedRole(null)
      onRoleUpdate(null)
    } else {
      setHighlightedRole(index)
      onRoleUpdate(index)
    }
  }

  return (
    <div className="role-highlight-picker">
      <h4>
        <IconSearch /> {t('project.highlight-fields')}
      </h4>

      <div className="role-buttons">
        {roles.map((role, i) => (
          <Button
            variant="supplementary"
            key={i}
            onClick={() => handleOnClick(i)}
            className={`role-button ${i === highlightedRole ? 'active' : ''}`}
          >
            {role}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default RoleHighlightPicker
