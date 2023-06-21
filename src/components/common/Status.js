import React from 'react'

export default function Status({ color }) {
    return (
      <span
        aria-hidden="true"
        className="project-status-color"
        style={{
          backgroundColor: color,
          ...(color === '#ffffff' && { border: '1px solid' })
        }}
      />
    )
  }
  