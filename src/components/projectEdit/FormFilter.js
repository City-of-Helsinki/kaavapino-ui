import React, { useRef, useState, useEffect }  from 'react'
import { Button, Tag, IconTrash, Checkbox } from 'hds-react';

function FormFilter() {

const openButtonRef = useRef(null);
const modal = document.getElementById("myModal");
const [tags, setTags] = useState({})
const [tagArray, setTagArray] = useState([])
const [checkedItems, setCheckedItems] = useState({});
const [selectedTag, setSelectedTag] = useState("")
const options = ['Option 1', 'Option 2', 'Option 3'];

useEffect(() => {
    let tagArray = []
    for (const [key, value] of Object.entries(tags)) {
        if(value === true){
            tagArray.push(key)
        }
    }
    setTagArray(tagArray)
}, [tags]) 

const handleChange = (e) => {
    const item = e.target.name;
    const isChecked = e.target.checked;
    setCheckedItems({ ...checkedItems, [item]: isChecked });
};

const openModal = () => {
    modal.style.display = "block";
}

const closeModal = () => {
    setCheckedItems(tags);
    modal.style.display = "none";
}

const saveSelections = () => {
    setTags(checkedItems)
    modal.style.display = "none";
}

const removeFilters = () => {
    setCheckedItems({})
}

const highlightTag = (e,tag) => {
    if(e.target.closest(".filter-tag").classList.contains("yellow")){
        e.target.closest(".filter-tag").classList.remove("yellow");
        setSelectedTag("")
    }
    else{
        if(document.getElementsByClassName("yellow").length > 0){
            document.getElementsByClassName("yellow")[0].classList.remove("yellow");
        }
        e.target.closest(".filter-tag").classList.add("yellow");
        setSelectedTag(tag)
    }
}

let renderedTags;
let tagInfo;

if(tagArray.length > 0){
    renderedTags = <>
     {tagArray.map((tag) => (
         <Tag
         className='filter-tag'
         role="link"
         key={`checkbox-${tag}`}
         id={`checkbox-${tag}`}
         aria-label={tag}
         onClick={() => highlightTag(event,tag)}
         >
         {tag}
         </Tag>
     ))}
     </>
 }
 else{
    renderedTags = <p>Yhtään suodatinta ei ole valittu.</p>
 }

 if(tagArray.length > 0 && selectedTag === ""){
    tagInfo = <div className='filter-tag-info'><p>{tagArray.length} suodatinta käytössä | Näytetään x kenttää</p></div>
 }
 else if(tagArray.length > 0 && selectedTag !== ""){
    tagInfo = <div className='filter-tag-info'><p>{tagArray.length} suodatinta käytössä | Näytetään x kenttää | <b>Korostus päällä: </b> {selectedTag}.</p></div>
 }

return (
    <div className='project-edit-form-filter'>
        {renderedTags}
        <Button ref={openButtonRef} onClick={() => openModal()} className="toggle-filters" variant="secondary" size="small">
            Muokkaa suodattimia
        </Button>
        {tagInfo}
        <div id="myModal" className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Suodattimet</h2>
                </div>
                <div className="modal-body">
                    <h3>Ryhmä</h3>
                    {options.map((item) => (
                        <Checkbox
                        key={`checkbox-${item}`}
                        id={`checkbox-${item}`}
                        label={item}
                        name={item}
                        checked={checkedItems[item]}
                        onChange={handleChange}
                        />
                    ))}
                    <Button onClick={() => removeFilters()} className="remove-filters" variant="supplementary" iconLeft={<IconTrash />}>
                        Poista kaikki valinnat
                    </Button>
                </div>
                <div className="modal-footer">
                    <Button className="save" onClick={() => saveSelections()}>Tallenna</Button>
                    <Button className="close" variant="secondary" onClick={() => closeModal()}>Peruuta</Button>
                </div>
            </div>
        </div>

        </div>
)
}

export default FormFilter