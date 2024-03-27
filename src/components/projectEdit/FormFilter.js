import React, { useRef, useState, useEffect }  from 'react'
import { Button, Tag, IconTrash, Checkbox } from 'hds-react';
import { getOffset } from '../../hooks/getOffset';

function FormFilter({schema,filterFields,isHighlightedTag,selectedPhase,allfields,currentlyHighlighted}) {

const openButtonRef = useRef(null);
const modal = document.getElementById("myModal");
const [tags, setTags] = useState({})
const [tagArray, setTagArray] = useState([])
const [checkedItems, setCheckedItems] = useState({});
const [selectedTag, setSelectedTag] = useState("")
const [options,setOptions] = useState([]);
const [totalFilteredFields,setTotalFilteredFields] = useState(0)
const [isVisible,setVisible] = useState(true);

useEffect(() => {
    window.addEventListener("scroll",listenToScroll);
    return () => window.removeEventListener("scroll",listenToScroll);
}, [])

useEffect(() => {
    let tagArray = []
    for (const [key, value] of Object.entries(tags)) {
        if(value === true){
            tagArray.push(key)
        }
    }
    setTagArray(tagArray)

    //If no filters and leghty form +2000px etc and user has scrolled a lot and sets filter with only few result,
    //scroll back to top off form instead of leaving scroll position near the footer and hiding results of filtering.
    const formHeight = document.getElementsByClassName("form-container")[0]
    const windowHeight = window.innerHeight

    if(windowHeight > formHeight.offsetHeight){
        const startOffForm = document.getElementById("accordion-title")
        if(startOffForm){
            startOffForm.scrollIntoView()
        }
    }
}, [tags])

useEffect(() => {
    calculateFields(allfields)
}, [selectedPhase])

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
            optionsArray[i].roles.sort((a, b) => a.localeCompare(b));
        }
        setOptions(optionsArray)
    }
}, [schema])

const listenToScroll = () => {
    const heightToHide = getOffset(
        document.getElementsByClassName("quicknav-content")[0]
    )

    const windowScrollHeight = document.body.scrollTop || document.documentElement.scrollTop

    if(windowScrollHeight > heightToHide + 120){
        setVisible(false)
    }
    else{
        setVisible(true)
    }
}

const calculateFields = (all) => {
   let fields = []
   if(typeof filterFields === 'function'){
       //Get only field keys from checboxes not the true / false value for filtering fields
       fields = Object.keys(checkedItems).filter(k=>checkedItems[k]===true)

       if(fields.length === 0){
           isHighlightedTag("")
       }
       
       filterFields(fields)
   }
   
   let totalFilteredFields = 0;
   for (let i = 0; i < all.length; i++) {
       let field = all[i].fields
       for (let x = 0; x < field.length; x++) {
           if(fields.includes(field[x].field_subroles)){
            totalFilteredFields = totalFilteredFields + 1
           }
       }
   }
   setTotalFilteredFields(totalFilteredFields)
}

const handleChange = (e) => {
    const item = e.target.name;
    const isChecked = e.target.checked;

    if(item === selectedTag && isChecked === false){
        isHighlightedTag("")
        setSelectedTag("")
    }
    else if(item === selectedTag && isChecked === true){
        isHighlightedTag(item)
        setSelectedTag(item)
    }
    
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

    for (const [key, value] of Object.entries(checkedItems)) {
        if(key === currentlyHighlighted && value === false){
            //If highlighted and tag is checked away from menu, remove highlight styles
            isHighlightedTag("")
        }
    }
    
    setTags(checkedItems)
    if(!checkedItems){
        isHighlightedTag("")
    }
    modal.style.display = "none";
    calculateFields(allfields)
}

const removeFilters = () => {
    setSelectedTag("")
    isHighlightedTag("")
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

if(tagArray.length > 0){
    renderedTags = <>
     <div className={"filter-tag-container"}>
     {tagArray.map((tag) => (
         <Tag
         className='filter-tag'
         role="button"
         key={`checkbox-${tag}-key`}
         id={`checkbox-${tag}`}
         onClick={() => highlightTag(event,tag)}
         aria-label={tag + ". Ota korostus käyttöön klikkaamalla painiketta."}
         >
         {tag}
         </Tag>
     ))}
     </div>
     </>
 }
 else{
    renderedTags = <div className={"message"}>Yhtään suodatinta ei ole valittu.</div>
 }

 if(tagArray.length > 0 && selectedTag === ""){
    tagInfo = <><div tabIndex="0" className='filter-tag-info'><p>{tagArray.length} suodatinta käytössä.</p> <span> | </span> <p>Näytetään {totalFilteredFields} kenttää.</p></div></>
 }
 else if(tagArray.length > 0 && selectedTag !== ""){
    tagInfo = <><div tabIndex="0" className='filter-tag-info'><p>{tagArray.length} suodatinta käytössä.</p> <span> | </span> <p>Näytetään {totalFilteredFields} kenttää.</p> <span> | </span> <p><b>Korostus päällä: </b> {selectedTag}.</p></div></>
 }

 let stickyClass = "";
 let noFiltersClass = "";

 if(!isVisible) {
     stickyClass = " sticky";
 }
 if(tagArray.length === 0) {
     noFiltersClass = " no-filters-selected"
 }

let containerClasses = "project-edit-form-filter" + stickyClass + noFiltersClass;

return (
    <div className={containerClasses}>
        <div className='left-container'>
            <div className={isVisible ? "filter-title": "filter-title hidden"} tabIndex="0">Suodattimet</div>

            {isVisible && (
                tagInfo
            )
            }
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
                            row.push(<h3 key={header + i}>{header}</h3>)
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
                    <Button className="save" size="small" onClick={() => saveSelections()}>Tallenna</Button>
                    <Button className="close" size="small" variant="secondary" onClick={() => closeModal()}>Peruuta</Button>
                </div>
            </div>
        </div>

        </div>
)
}

export default FormFilter
