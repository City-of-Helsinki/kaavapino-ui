import React, { useRef, useState, useEffect }  from 'react'
import { Button, Tag, IconTrash, Checkbox } from 'hds-react';
import DialogFocusTrap from '../common/DialogFocusTrap.jsx';
import { getOffset } from '../../hooks/getOffset';
import './ProjectEdit.scss'
import PropTypes from 'prop-types';

function FormFilter({schema,filterFields,isHighlightedTag,selectedPhase,allfields,currentlyHighlighted,showSection}) {

const openButtonRef = useRef(null);
const [tags, setTags] = useState({});
const [prevTags, setPrevTags] = useState({});
const [tagArray, setTagArray] = useState([])
const [checkedItems, setCheckedItems] = useState({});
const [selectedTag, setSelectedTag] = useState("")
const [options,setOptions] = useState([]);
const [totalFilteredFields,setTotalFilteredFields] = useState(0)
const [isVisible,setVisible] = useState(true);
const [isOpen, setIsOpen] = useState(false);

const prevTotalFilteredFields = useRef(totalFilteredFields);

useEffect(() => {
    globalThis.addEventListener("scroll",listenToScroll);
    return () => {
        globalThis.removeEventListener("scroll",listenToScroll);
    };
}, []);

useEffect(() => {
    const handleKeyDown = (event) => {
        if ((event.key === 'Escape' || event.key === 'Esc') && isOpen) {
            setIsOpen(false);
        }
    }
    if (isOpen) {
        globalThis.addEventListener("keydown", handleKeyDown);
    }
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
}, [isOpen]);

useEffect(() => {
    let tagArray = []
    for (const [key, value] of Object.entries(tags)) {
        if(value === true){
            tagArray.push(key)
        }
    }
    setTagArray(tagArray)
}, [tags])

useEffect(() => {
    const startOffForm = document.getElementById("accordion-title");
    if (startOffForm && JSON.stringify(prevTags) !== JSON.stringify(tags)) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const y = startOffForm.getBoundingClientRect().top + window.pageYOffset - 300;
                window.scrollTo({ top: y, behavior: "smooth" });
            });
        });
    }
    setPrevTags(tags);
    prevTotalFilteredFields.current = totalFilteredFields;
}, [JSON.stringify(tags)]);

useEffect(() => {
    calculateFields(allfields)
}, [selectedPhase])

useEffect(() => {
    let optionsArray = [{header:"Asiantuntija",roles:[]},{header:"Pääkäyttäjä",roles:[]},{header:"Vastuuhenkilö",roles:[]}]
    if(schema){
        let roles = schema.filters.subroles
        for (const role of roles) {
            if(role === "Projektin vastuuhenkilö" || role === "Rakennussuojelu" || role === "Suunnitteluavustaja"){
                optionsArray[2].roles.push(role);
            }
            else if(role === "Kaavoitussihteeri" || role === "Kanslian pääkäyttäjä" ||
            role === "Suunnitteluassistentti" || role === "Tontit-yksikön pääkäyttäjä" || role === "Kaavamaksut ja seuranta"){
                optionsArray[1].roles.push(role);
            }
            else{
                optionsArray[0].roles.push(role);
            }
        }
        for (const option of optionsArray) {
            option.roles.sort((a, b) => a.localeCompare(b));
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

const calculateFields = (fieldSections) => {
   let filteredFields = []
   if(typeof filterFields === 'function'){
       //Get only field keys from checboxes not the true / false value for filtering fields
       filteredFields = Object.keys(checkedItems).filter(k=>checkedItems[k]===true)

       if(filteredFields.length === 0){
           isHighlightedTag("")
       }
       
       filterFields(filteredFields)
   }

   let totalFilteredFields = 0;
   for (const section of fieldSections) {
       const fields = section.fields;
       for (const field of fields) {
           // Count direct field match
           if(fields.includes(field.field_subroles)){
				totalFilteredFields = totalFilteredFields + 1;
				continue;
			}
           // Also allow fieldsets to match if ANY of their attributes has matching subrole
           if(
           	field.categorization === 'fieldset' &&
           	Array.isArray(field.fieldset_attributes) &&
           	field.fieldset_attributes.some(attr => attr?.field_subroles && fields.includes(attr.field_subroles))
           ){
           	totalFilteredFields = totalFilteredFields + 1;
           }
       }
   }
   setTotalFilteredFields(totalFilteredFields);
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

const openModal = (event=null) => {
    if (event?.key === 'Enter' || event?.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
    }
    if (event === null) {
        setIsOpen(true);
    }
}

const closeModal = () => {
    if (isOpen) {
        setCheckedItems(tags)
        setIsOpen(false);
    }
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
    setIsOpen(false);
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
    renderedTags = (
    <div className={"filter-tag-container"}>
     {tagArray.map((tag) => (
         <Tag
         className='filter-tag'
         role="button"
         key={`checkbox-${tag}-key`}
         id={`checkbox-${tag}`}
         onClick={(event) => highlightTag(event,tag)}
         aria-label={tag + ". Ota korostus käyttöön klikkaamalla painiketta."}
         tabindex="0"
         >
         {tag}
         </Tag>
     ))}
    </div>
    );
 }
 else{
    renderedTags = <div className={"message"}>Yhtään suodatinta ei ole valittu.</div>
 }

 if(tagArray.length > 0 && selectedTag === ""){
    tagInfo = <div className='filter-tag-info'><p>{tagArray.length} suodatinta käytössä.</p> <span> | </span> <p>Näytetään {totalFilteredFields} kenttää.</p></div>
 }
 else if(tagArray.length > 0 && selectedTag !== ""){
    tagInfo = <div className='filter-tag-info'><p>{tagArray.length} suodatinta käytössä.</p> <span> | </span> <p>Näytetään {totalFilteredFields} kenttää.</p> <span> | </span> <p><b>Korostus päällä: </b> {selectedTag}.</p></div>
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
            <div className={isVisible ? "filter-title": "filter-title hidden"}>Suodattimet</div>

            {isVisible && (
                tagInfo
            )
            }
            {renderedTags}
        </div>
        <div className='right-container'>
            <Button ref={openButtonRef} onMouseDown={() => openModal()} onKeyDown={(event) => openModal(event)} className="toggle-filters" variant="secondary" size="small" disabled={!showSection}>
                Muokkaa suodattimia
            </Button>
        </div>
        {isOpen && (
            <div id="myModal" className="modal filterModal">
                <DialogFocusTrap returnFocusRef={openButtonRef}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Suodattimet</h2>
                        </div>
                    <div className="modal-body">
                <div className="filterModal__cols">
                    {options.map((opt) => (
                        <div className="filterModal__col" key={`col-${opt.header}`}>
                            <h3>{opt.header}</h3>
                            <div className="filterModal__list">
                            {opt.roles.map((role) => (
                                <Checkbox
                                key={`checkbox-${role}-filter`}
                                id={`checkbox-${role}-filter`}
                                label={role}
                                name={role}
                                checked={!!checkedItems[role]}
                                onChange={handleChange}
                                />
                            ))}
                            </div>
                        </div>
                    ))}
                </div>

                <Button onClick={removeFilters} className="remove-filters" variant="supplementary" iconLeft={<IconTrash />}>
                    Poista kaikki valinnat
                </Button>
                </div>
                <div className="modal-footer">
                    <Button className="save" size="small" onClick={() => saveSelections()}>Tallenna</Button>
                    <Button className="close" size="small" variant="secondary" onClick={() => closeModal()}>Peruuta</Button>
                </div>
                </div>
            </DialogFocusTrap>
        </div>
        )}
        </div>
)
}

FormFilter.propTypes = {
    schema: PropTypes.shape({
        deadline_sections: PropTypes.array,
        filters: PropTypes.shape({
            roles: PropTypes.array,
            subroles: PropTypes.array
        }),
        floor_area_secions: PropTypes.array,
        phases: PropTypes.array,
        subtype: PropTypes.number,
        subtype_name: PropTypes.string
    }),
    filterFields: PropTypes.func,
    isHighlightedTag: PropTypes.func,
    selectedPhase: PropTypes.string,
    allfields: PropTypes.array,
    currentlyHighlighted: PropTypes.string,
    showSection: PropTypes.bool
}

export default FormFilter;
