import React, { useRef, useState, useEffect }  from 'react'
import { Button, Tag, IconTrash, Checkbox } from 'hds-react';

function FormFilter({schema,filterFields,isHighlightedTag,sectionIndex}) {

const openButtonRef = useRef(null);
const modal = document.getElementById("myModal");
const [tags, setTags] = useState({})
const [tagArray, setTagArray] = useState([])
const [checkedItems, setCheckedItems] = useState({});
const [selectedTag, setSelectedTag] = useState("")
const [options,setOptions] = useState([]);
const [fieldCount,setFieldCount] = useState(0);

useEffect(() => {
    let tagArray = []
    for (const [key, value] of Object.entries(tags)) {
        if(value === true){
            tagArray.push(key)
        }
    }
    setTagArray(tagArray)
    calculateFields()
}, [tags])

useEffect(() => {
    calculateFields()
}, [sectionIndex])

useEffect(() => {
    let optionsArray = [{header:"Asiantuntija",roles:[]},{header:"Pääkäyttäjä",roles:[]},{header:"Vastuuhenkilö",roles:[]}]
    if(schema){
        let roles = schema.filters.subroles

        for (let x = 0; x < roles.length; x++) {
            if(roles[x] === "Projektin vastuuhenkilö"){
                optionsArray[2].roles.push(roles[x]);
            }
            else if(roles[x] === "Kaavoitussihteeri" || roles[x] === "Kanslian pääkäyttäjä" ||
            roles[x] === "Suunnitteluassistentti" || roles[x] === "Tontit-yksikön pääkäyttäjä"){
                optionsArray[1].roles.push(roles[x]);
            }
            else{
                optionsArray[0].roles.push(roles[x]);
            }
        }

        for (let i = 0; i < optionsArray.length; i++) {
            optionsArray[i].roles.sort((a, b) => (a - b));
        }

        setOptions(optionsArray)
    }
}, [schema])

const calculateFields = () => {
    let numberOfFields = document.querySelectorAll(':not(.fieldset-container) > .input-container').length
    setFieldCount(numberOfFields)
}

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
    let fields = []
    if(typeof filterFields === 'function'){
        //Get only field keys from checboxes not the true / false value for filtering fields
        fields = Object.keys(checkedItems).filter(k=>checkedItems[k]===true)

        if(fields.length === 0){
            isHighlightedTag("")
        }
        
        filterFields(fields)
    }
}

const removeFilters = () => {
    setCheckedItems({})
}

const highlightTag = (e,tag) => {
    if(e.target.closest(".filter-tag").classList.contains("yellow")){
        e.target.closest(".filter-tag").classList.remove("yellow");
        setSelectedTag("")
        isHighlightedTag("")
    }
    else{
        if(document.getElementsByClassName("yellow").length > 0){
            document.getElementsByClassName("yellow")[0].classList.remove("yellow");
        }
        e.target.closest(".filter-tag").classList.add("yellow");
        setSelectedTag(tag)
        isHighlightedTag(tag)
    }
}

let renderedTags;
let tagInfo;
let tagText;

if(tagArray.length > 0){
    renderedTags = <>
     {tagArray.map((tag) => (
         <Tag
         className='filter-tag'
         role="button"
         key={`checkbox-${tag}`}
         id={`checkbox-${tag}`}
         onClick={() => highlightTag(event,tag)}
         aria-label={tag + ". Ota korostus käyttöön klikkaamalla painiketta."}
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
    tagText = <div><b tabIndex="0">Suodattimet</b></div>
    tagInfo = <div tabIndex="0" className='filter-tag-info'><p>{tagArray.length} suodatinta käytössä.</p> <span> | </span> <p>Näytetään {fieldCount} kenttää.</p></div>
 }
 else if(tagArray.length > 0 && selectedTag !== ""){
    tagText = <div><b tabIndex="0">Suodattimet</b></div>
    tagInfo = <div tabIndex="0" className='filter-tag-info'><p>{tagArray.length} suodatinta käytössä.</p> <span> | </span> <p>Näytetään {fieldCount} kenttää.</p> <span> | </span> <p><b>Korostus päällä: </b> {selectedTag}.</p></div>
 }

return (
    <div className='project-edit-form-filter'>
        <div className='left-container'>
            {tagText}
            {tagInfo}
            {renderedTags}
        </div>
        <div className='right-container'>
            <Button ref={openButtonRef} onClick={() => openModal()} className="toggle-filters" variant="secondary" size="small">
                Muokkaa suodattimia
            </Button>
        </div>
        <div id="myModal" className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Suodattimet</h2>
                </div>
                <div className="modal-body">
                    {(() => {
                    let row = []
                        for (let i = 0; i < options.length; i++) {
                            let header = options[i].header
                            let roles = options[i].roles
                            row.push(<h3>{header}</h3>)
                            for (let x = 0; x < roles.length; x++) {
                                row.push(<Checkbox
                                    key={`checkbox-${roles[x]}-filter`}
                                    id={`checkbox-${roles[x]}-filter`}
                                    label={roles[x]}
                                    name={roles[x]}
                                    checked={checkedItems[roles[x]]}
                                    onChange={handleChange}
                                />)
                            }
                        }
                        return row
                    })()}
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