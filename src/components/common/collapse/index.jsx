import React from 'react'
import './styles.scss'
import { Accordion } from 'hds-react'

const Collapse = props => {
  const { children, title } = props

  return (
    <Accordion heading={title} id={title} >
        {children}
    </Accordion>
  )
}

export default Collapse
