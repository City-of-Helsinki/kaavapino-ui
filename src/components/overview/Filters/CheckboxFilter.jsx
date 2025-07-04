import React from 'react'
import { Checkbox } from 'hds-react'

export default function CheckboxFilter({ field }) {
  return <Checkbox id={field.value} key={field.value} label={field.label} />
}
