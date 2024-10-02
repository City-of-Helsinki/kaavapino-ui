import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import inputUtils from '../../utils/inputUtils'
import { useTranslation } from 'react-i18next'
import { TextInput, DateInput, IconAlertCircle } from 'hds-react'
import { getFieldAutofillValue } from '../../utils/projectAutofillUtils'
import textUtil from '../../utils/textUtil'
import timeUtil from '../../utils/timeUtil'
import objectUtil from '../../utils/objectUtil'
import { useSelector,useDispatch } from 'react-redux'
import { getFormValues } from 'redux-form'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
//import { useValidateDate } from '../../utils/dateUtils';
import { updateDateTimeline } from '../../actions/projectActions';
import { validatedSelector } from '../../selectors/projectSelector';

const DeadLineInput = ({
  input,
  error,
  attributeData,
  currentDeadline,
  editable,
  type,
  disabled,
  placeholder,
  className,
  autofillRule,
  timeTableDisabled,
  dateTypes,
  deadlineSection,
  maxMoveGroup,
  maxDateToMove,
  groupName,
  visGroups, 
  visItems,
  deadlineSections,
  confirmedValue
}) => {

  const dispatch = useDispatch();
  const { t } = useTranslation()
  const validated = useSelector(validatedSelector);
  const formValues = useSelector(getFormValues(EDIT_PROJECT_TIMETABLE_FORM))
  const [currentValue, setCurrentValue] = useState("")
  const [disabledState, setDisabledState] = useState(true)


  let currentError
  const generated = currentDeadline && currentDeadline.generated

  const [valueGenerated, setValueGenerated] = useState(generated)

  if (currentDeadline && currentDeadline.is_under_min_distance_previous) {
    currentError = t('messages.min-distance')

    if (
      currentDeadline.deadline &&
      currentDeadline.deadline.error_min_distance_previous
    ) {
      currentError = currentDeadline.deadline.error_min_distance_previous
    }
  }
  if (currentDeadline && currentDeadline.is_under_min_distance_next) {
    currentError = t('messages.max-distance')

    if (currentDeadline.deadline && currentDeadline.warning_min_distance_next) {
      currentError = currentDeadline.warning_min_distance_next
    }
  }

  let currentClassName =
    generated && valueGenerated && editable
      ? `${className} deadline-estimated`
      : className

  const hasError =
    editable && (inputUtils.hasError(error) || inputUtils.hasError(currentError))
  if (hasError) {
    currentClassName = `${currentClassName} error-border`
  }

  useEffect(() => {
    let inputValue = input.value
    if (autofillRule) {
      
      if (autofillRule && autofillRule.length > 0) {
        inputValue = getFieldAutofillValue(
          autofillRule,
          formValues,
          input.name,
          EDIT_PROJECT_TIMETABLE_FORM
        )
      }
    }

    if ( inputValue === null ) {
      inputValue = ''
    }
    let currentDeadlineDate = ''
    const index = input.name.match(/\d+/);
    const indexString = index ? "_"+index[0] : '';
  
    if(currentDeadline?.deadline?.attribute && attributeData[currentDeadline.deadline.attribute]){
      currentDeadlineDate = attributeData[currentDeadline.deadline.attribute]
    }
    else if(input.name === 'luonnosaineiston_maaraaika'+indexString && attributeData['kaavaluonnos_kylk_aineiston_maaraaika'+indexString]){
      inputValue = attributeData['kaavaluonnos_kylk_aineiston_maaraaika'+indexString]
    }
    else if (currentDeadline?.date) {
      currentDeadlineDate = currentDeadline.date
    }
  
    setCurrentValue(currentDeadline ? currentDeadlineDate : inputValue ); 
    setDisabledState(typeof timeTableDisabled !== "undefined" ? timeTableDisabled : disabled)
  },[])

  useEffect(() => {
    //Update calendar values when value has changed
    if(currentValue !== input.value){
      setCurrentValue(input.value); 
    }
  }, [input.value])

  useEffect(() => {
    setDisabledState(formValues[confirmedValue])
  },[formValues[confirmedValue]])

  const getInitialMonth = (dateString) => {
    let date;
    if (dateString) {
        date = new Date(dateString);
    }
    else if(input.name === "tullut_osittain_voimaan_pvm" || input.name === "voimaantulo_pvm" || input.name === "kumottu_pvm" || input.name === "rauennut"){
      date = new Date(attributeData['voimaantulovaihe_paattyy_pvm']);
    }
    else if(input.name === "hyvaksymispaatos_pvm"){
      date = new Date(attributeData['hyvaksyminenvaihe_paattyy_pvm']);
    }
    else {
        date = new Date(); // Use current date if no date string is provided
    }
    return date;
  }

  const formatDate = (date) => {
    const year = date.getFullYear();
    // Pad the month and day with leading zeros if needed
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  const isDisabledDate = (date) => {
    //20 years is the calendars range to check work days, holidays etc from current date
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    const twentyYearsLater = new Date();
    twentyYearsLater.setFullYear(twentyYearsLater.getFullYear() + 20);
    const ehdotusNahtavillaolo = currentDeadline?.deadline?.phase_name === "Ehdotus" && currentDeadline?.deadline?.deadlinegroup?.includes('nahtavillaolo')
    let datesToDisable
    if (ehdotusNahtavillaolo && (attributeData?.kaavaprosessin_kokoluokka === 'L' || attributeData?.kaavaprosessin_kokoluokka === 'XL') ) {
        //TODO move all of these checks to some util file
        if(input.name.includes("_alkaa") || input.name.includes("_paattyy")){
          //Disable dates when editing dates from calendar start and end and min start date and max end date
          let endingDateKey = textUtil.replacePattern(input.name,"_alkaa","_paattyy")
          const dynamicKey = Object.keys(deadlineSection.deadlineSection)[0];
          const deadlineSectionValues = deadlineSection.deadlineSection[dynamicKey]
          const distanceTo = input.name.includes("_paattyy") ? deadlineSectionValues.find(({ name }) => name === input.name).distance_from_previous : deadlineSectionValues.find(({ name }) => name === input.name).distance_to_next
          let newDisabledDates = dateTypes?.arkipäivät?.dates
          const lastPossibleDateToSelect = timeUtil.subtractDays("esilläolo",attributeData[endingDateKey],distanceTo,dateTypes?.arkipäivät?.dates,false)
          newDisabledDates = input.name.includes("_paattyy") ? newDisabledDates.filter(date => date >= lastPossibleDateToSelect) : newDisabledDates.filter(date => date <= lastPossibleDateToSelect);
          return !newDisabledDates.includes(formatDate(date));
        }
        else if (currentDeadline?.deadline?.attribute?.includes('maaraaika')) {
          datesToDisable = !dateTypes?.työpäivät?.dates?.includes(formatDate(date));
        } 
        else {
          datesToDisable = !dateTypes?.arkipäivät?.dates?.includes(formatDate(date));
        }
    }
    else {
      let dateType;
      //currentDeadline?.deadline?.deadlinegroup.includes("kaynnistys")
      if (currentDeadline?.deadline?.deadlinegroup?.includes('esillaolo') || ehdotusNahtavillaolo) {
        if(ehdotusNahtavillaolo){
          dateType = 'arkipäivät';
        }
        else{
          dateType = currentDeadline?.deadline?.attribute?.includes('maaraaika') ? 'työpäivät' : 'esilläolopäivät';
        }
        //TODO move all of these checks to some util file
        if(groupName !== maxMoveGroup && input.name.includes("_maaraaika")){
          //Disable maaraika dates when editing it from calendar when group IS NOT THE LAST ONE OF PHASE possible group of phase.
          //Disable to max next date taking inconsideration the lenghts of start and end dates before next phase
          //and min to next possible phase minium. If maaraaika is in lastly added group then it's date can be editet freely.
          const splitInputName = input.name.split("_");
          const firstElements = splitInputName.slice(0, 2); // Get the first two elements
          const dynamicKey = Object.keys(deadlineSection.deadlineSection)[0];
          const deadlineSectionValues = deadlineSection.deadlineSection[dynamicKey]
          const endingKeyName = objectUtil.findValuesWithStrings(deadlineSectionValues,firstElements[0],firstElements[1],"_alkaa","milloin")
          const distanceTo = endingKeyName?.distance_from_previous + endingKeyName?.distance_to_next
          const lastPossibleDateToSelect = timeUtil.subtractDays("esilläolo",maxDateToMove,distanceTo,dateTypes?.[dateType]?.dates,true)
          let newDisabledDates = dateTypes?.[dateType]?.dates
          if(currentDeadline?.deadline?.phase_name === "Periaatteet"){
            //Add check to previous phase end date + minium length
            const dataToCompate = attributeData["kaynnistys_paattyy_pvm"]
            const minEndDate = timeUtil.addDays("esilläolo",dataToCompate,5,dateTypes?.[dateType]?.dates,true)
            newDisabledDates = newDisabledDates.filter(date => date >= minEndDate)
          }
          else if(currentDeadline?.deadline?.phase_name === "Luonnos"){
            const attributeValue = objectUtil.findLargestSuffix(attributeData,/^milloin_oas_esillaolo_paattyy(?:_(\d+))?/)
            if(attributeData){
              const minEndDate = timeUtil.addDays("esilläolo",attributeValue,5,dateTypes?.[dateType]?.dates,true)
              newDisabledDates = newDisabledDates.filter(date => date >= minEndDate)
            }
          }
          newDisabledDates = newDisabledDates.filter(date => date <= lastPossibleDateToSelect);
          return !newDisabledDates.includes(formatDate(date));
        }
        else if(input.name.includes("_maaraaika") && (attributeData?.kaavaprosessin_kokoluokka === 'XS' || attributeData?.kaavaprosessin_kokoluokka === 'S' || attributeData?.kaavaprosessin_kokoluokka === 'M')){
          let newDisabledDates = dateTypes?.[dateType]?.dates
          if(currentDeadline?.deadline?.phase_name === "OAS"){
            //Add check to previous phase end date + minium length
            const dataToCompate = attributeData["kaynnistys_paattyy_pvm"]
            const minEndDate = timeUtil.addDays("arkipäivät",dataToCompate,5,dateTypes?.[dateType]?.dates,true)
            newDisabledDates = newDisabledDates.filter(date => date >= minEndDate)
            return !newDisabledDates.includes(formatDate(date));
          }
          if(currentDeadline?.deadline?.phase_name === "Ehdotus"){
            const attributeValue = objectUtil.findLargestSuffix(attributeData,/^milloin_oas_esillaolo_paattyy(?:_(\d+))?/)
            if(attributeData){
              const minEndDate = timeUtil.addDays("arkipäivät",attributeValue,5,dateTypes?.[dateType]?.dates,true)
              newDisabledDates = newDisabledDates.filter(date => date >= minEndDate)
              return !newDisabledDates.includes(formatDate(date));
            }
          }
        }
        else if(input.name.includes("_alkaa") || input.name.includes("_paattyy")){
          //TODO move all of these checks to some util file and refactor
          //Disable dates when editing dates from calendar start and end and min start date and max end date
          const endingDateKey = textUtil.replacePattern(input.name,"_alkaa","_paattyy")
          const dynamicKey = Object.keys(deadlineSection.deadlineSection)[0];
          const deadlineSectionValues = deadlineSection.deadlineSection[dynamicKey]
          const distanceTo = input.name.includes("_paattyy") ? deadlineSectionValues.find(({ name }) => name === input.name).distance_from_previous : deadlineSectionValues.find(({ name }) => name === input.name).distance_to_next
          let newDisabledDates = dateTypes?.[dateType]?.dates
          const lastPossibleDateToSelect = dateType === "arkipäivät" ? timeUtil.subtractDays("arkipäivät",attributeData[endingDateKey],distanceTo,dateTypes?.[dateType]?.dates,true) : timeUtil.subtractDays("esilläolo",attributeData[endingDateKey],distanceTo,dateTypes?.[dateType]?.dates,true)
          newDisabledDates = input.name.includes("_paattyy") ? newDisabledDates.filter(date => date >= lastPossibleDateToSelect) : newDisabledDates.filter(date => date <= lastPossibleDateToSelect);
          if(input.name.includes("_alkaa")){
            //include phase start date + minium and make dates after that unselectable, take määräaika and its length to alkaa inconsideration too.
            const currentPhase = objectUtil.getObjectByName(visGroups,currentDeadline?.deadline?.phase_name)
            let visItemsFiltered = visItems.filter(info => info.type !== "background")
            let phaseToCheck = visItemsFiltered.find(({group}) => group === currentPhase.id)
            let phaseStartDate = phaseToCheck.start
            const minEndDate = timeUtil.addDays("arkipäivät",phaseStartDate,distanceTo+5,dateTypes?.[dateType]?.dates,false)
            newDisabledDates = newDisabledDates.filter(date => date >= minEndDate)
          }
          return !newDisabledDates.includes(formatDate(date));
        }
      } 
      else if (currentDeadline?.deadline?.deadlinegroup?.includes('lautakunta')) {
        const dynamicKey = Object.keys(deadlineSection.deadlineSection)[0];
        const deadlineSectionValues = deadlineSection.deadlineSection[dynamicKey]
        //const distanceTo = input.name.includes("maaraaika") ? deadlineSectionValues.find(({ name }) => name === input.name).distance_from_previous : deadlineSectionValues.find(({ name }) => name === input.name).distance_to_next
        //Ei tuu minimejä backend, ota yllä oleva käyttöön kun tulee? Alla väliaikanen kovakoodaus.
        const regex = /_(\d+)$/;  // Regex to match underscore followed by a number at the end of the string
        const match = input.name.match(regex) //true if is lautakunta 2 or later
        const distanceTo = match ? 5 : input.name.includes("maaraaika") ? 5 : 22 //distance to is 5 when not first lautakunta
        const constDistance = deadlineSectionValues.find(({ name }) => name.includes("_lautakunnassa"))?.initial_distance?.distance
        const currentPhase = objectUtil.getPreviousObjectByGroup(visGroups,currentDeadline?.deadline?.deadlinegroup)
        let visItemsFiltered = visItems.filter(info => info.type !== "background")
        let phaseToCheck = visItemsFiltered.filter(({group}) => group === currentPhase.id)
        let lastElement = phaseToCheck.at(-1);
        let previousGroupEndDate = lastElement?.end ? lastElement?.end : lastElement?.start
        dateType = currentDeadline?.deadline?.attribute?.includes('maaraaika') ? 'työpäivät' : 'lautakunnan_kokouspäivät';
        const minEndDate = timeUtil.addDays("lautakunta",previousGroupEndDate,distanceTo,dateTypes?.[dateType]?.dates,true,false,false,constDistance)
        let newDisabledDates = dateTypes?.[dateType]?.dates
        newDisabledDates = newDisabledDates.filter(date => date >= minEndDate)
        return !newDisabledDates.includes(formatDate(date));
      }
      else if(input.name.includes("projektin_kaynnistys_pvm") || input.name.includes("kaynnistys_paattyy_pvm")){
        const endingDateKey = "kaynnistys_paattyy_pvm"
        const dynamicKey = Object.keys(deadlineSection.deadlineSection)[0];
        const deadlineSectionValues = deadlineSection.deadlineSection[dynamicKey]
        const distanceTo = deadlineSectionValues.find(({ name }) => name === endingDateKey).distance_from_previous
        let newDisabledDates = dateTypes?.["arkipäivät"]?.dates
        const lastPossibleDateToSelect = input.name.includes("projektin_kaynnistys_pvm") ? timeUtil.subtractDays("arkipäivät",attributeData[endingDateKey],distanceTo,dateTypes?.["arkipäivät"]?.dates,true) : timeUtil.addDays("arkipäivät",attributeData["projektin_kaynnistys_pvm"],distanceTo,dateTypes?.["arkipäivät"]?.dates,true)
        newDisabledDates = input.name.includes("projektin_kaynnistys_pvm") ? newDisabledDates.filter(date => date <= lastPossibleDateToSelect) : newDisabledDates.filter(date => date >= lastPossibleDateToSelect)
        return !newDisabledDates.includes(formatDate(date));
      }
      else {
        dateType = 'arkipäivät';
      }
      datesToDisable = !dateTypes?.[dateType]?.dates?.includes(formatDate(date));
    }

    if (date < twentyYearsAgo || date > twentyYearsLater) {
      return false;
    }
  
    const day = date.getDay();
    return day === 0 || day === 6 || datesToDisable;
  }

  const formatDateToYYYYMMDD = (date) => {
    if(typeof date !== 'object' && date?.includes('.')){
      const dateParts = date.split(".");
      const eventDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      const year = eventDate.getFullYear();
      const month = ("0" + (eventDate.getMonth() + 1)).slice(-2); // Months are 0-based, so add 1 and pad with 0 if necessary
      const day = ("0" + eventDate.getDate()).slice(-2); // Pad with 0 if necessary
      return `${year}-${month}-${day}`;
    }
     else {
      return date;
    }
  };

  const handleDateChange = (formattedDate) => {
    try {
      let field = input.name;
      //Get date type objects and send them to reducer to be moved according to input date changed
      const dynamicKey = Object.keys(deadlineSection.deadlineSection)[0];
      let deadlineSectionValues
      if(currentDeadline?.deadline?.phase_name === "Ehdotus" && (attributeData?.kaavaprosessin_kokoluokka === 'L' || attributeData?.kaavaprosessin_kokoluokka === 'XL')){
        //for some reason määräaika is on data when L XL nahtavillaolo even though it should never be, filter it out because it cannot be saved if not existing in backend
        deadlineSectionValues = deadlineSection.deadlineSection[dynamicKey].filter(section => section.type === "date" && section.display !== "readonly" && section.name !== "ehdotus_nahtaville_aineiston_maaraaika");
      }
      else{
        deadlineSectionValues = deadlineSection.deadlineSection[dynamicKey].filter(section => section.type === "date" && section.display !== "readonly");
      }

      if(field === "tullut_osittain_voimaan_pvm" || field === "voimaantulo_pvm" || field === "kumottu_pvm" || field === "rauennut"){
        field = "voimaantulovaihe_paattyy_pvm"
        deadlineSectionValues = false
      }

      if(field === "hyvaksymispaatos_pvm"){
        field = "hyvaksyminenvaihe_paattyy_pvm"
        deadlineSectionValues = false
      }
      setCurrentValue(formattedDate)
      dispatch(updateDateTimeline(field,formattedDate,deadlineSectionValues,false,false,deadlineSections));

    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  return (
    <>
      <div className='deadline-input'>
        {type === 'date' ?
        !validated ?
        <DateInput
          readOnly
          language='fi'
          initialMonth={getInitialMonth(currentValue ? currentValue : input.value)}
          isDateDisabledBy={isDisabledDate}
          value={formatDateToYYYYMMDD(currentValue)}
          name={input.name}
          type={type}
          disabled={disabledState}
          placeholder={placeholder}
          error={error}
          aria-label={input.name}
          onChange={(event) => {
            let formattedDate
            const dateString = event;
            if (dateString.includes('.')) {
              formattedDate = formatDateToYYYYMMDD(dateString);
            } else {
              formattedDate = dateString;
            }
            handleDateChange(formattedDate);
          }}
          className={currentClassName}
          onBlur={() => {
            if (input.value !== input.defaultValue) {
              setValueGenerated(false)
            } else {
              setValueGenerated(true)
            }
          }}
        /> : "Ladataan..."
        :
          <TextInput
            value={currentValue}
            name={input.name}
            type={type}
            disabled={typeof timeTableDisabled !== "undefined" ? timeTableDisabled : disabled}
            placeholder={placeholder}
            error={error}
            aria-label={input.name}
            onChange={event => {
              const value = event.target.value
              setCurrentValue(value)
              input.onChange(value)
            }}
            className={currentClassName}
            onBlur={() => {
              if (input.value !== input.defaultValue) {
                setValueGenerated(false)
              } else {
                setValueGenerated(true)
              }
            }}
          />
        }
      </div>
      {editable && valueGenerated ? (
        <span className="deadline-estimated">{t('deadlines.estimated')}</span>
      ) : (
        ''
      )}
      {editable && hasError && (
        <div className="error-text">
          <IconAlertCircle size="xs" /> {currentError}{' '}
        </div>
      )}
{/*       {warning.warning && (
        <Notification label={warning.response.reason} type="alert" style={{marginTop: 'var(--spacing-s)'}}>
        Seuraavien päivämäärien siirtäminen ei ole mahdollista, koska minimietäisyys viereisiin etappeihin on täyttynyt.
        {warning.response.conflicting_deadline}. Asetettu seuraava kelvollinen päivä {warning.response.suggested_date}</Notification>
      )} */}
    </>
  )
}

DeadLineInput.propTypes = {
  input: PropTypes.object.isRequired,
  error: PropTypes.string,
  attributeData: PropTypes.object,
  currentDeadline: PropTypes.object,
  editable: PropTypes.bool,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  autofillRule: PropTypes.array,
  timeTableDisabled: PropTypes.bool,
  dateTypes: PropTypes.object,
  deadlineSection: PropTypes.object,
  maxMoveGroup: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  maxDateToMove: PropTypes.string,
  groupName: PropTypes.string,
  visGroups: PropTypes.array,
  visItems: PropTypes.array,
  deadlineSections: PropTypes.array,
  confirmedValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ])
}

export default DeadLineInput
