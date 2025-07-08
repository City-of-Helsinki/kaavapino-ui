import { IconLock } from 'hds-react'
import React from 'react'

export default function InfoComponent({ children }) {
  return (
    <span className="info-box">
      <span width="15" className="content">
        <span className="icon-area">
          <IconLock size="s" className="icon" />
        </span>
        <span className="text">
        {children}
        </span>
      </span>
    </span>
  )
}
