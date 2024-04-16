import React from 'react'

function ItemRange() {
  //const [value, setValue] = useState(7);
/*   const handleChange = (e) => {
    
    setValue(e.target.value)
  } */
  return (
    <div className='rangeItem'>
      <input 
        type="range"  
        name="itemRange" 
        step={1}
        min={0} 
        max={11}
      />
    </div>
  )
}

export default ItemRange