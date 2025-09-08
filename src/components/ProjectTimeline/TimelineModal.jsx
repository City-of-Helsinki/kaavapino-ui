import React from 'react';
import { Modal } from 'semantic-ui-react'
import { Button,Tabs,IconCross } from 'hds-react'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import FormField from '../input/FormField'
import { isArray } from 'lodash'
import { showField } from '../../utils/projectVisibilityUtils'
import textUtil from '../../utils/textUtil'
import objectUtil from '../../utils/objectUtil';
import PropTypes from 'prop-types'
import './VisTimeline.scss'

const TimelineModal = ({ open,group,content,deadlinegroup,deadlines, onClose,visValues,deadlineSections,formSubmitErrors,projectPhaseIndex,phaseList,archived,allowedToEdit,disabledDates,lomapaivat,dateTypes,groups, items, sectionAttributes,isAdmin,initialTab }) => {

  const getAttributeValues = (attributes) => {
    return Object.values(attributes).flatMap((v) => Object.values(v));
  };
  
  const findLabel = (fieldName, attributeValues) => {
    const field = attributeValues.find((value) => value?.name === fieldName);
    return field ? field.label : null;
  };
  
  const getErrorLabel = (fieldName) => {
    const attributeValues = deadlineSections.flatMap((deadline_section) =>
      deadline_section.sections.flatMap((section) => getAttributeValues(section.attributes))
    );
  
    const label = findLabel(fieldName, attributeValues);
    return <span>{label}: </span>;
  };

    const renderSubmitErrors = () => {
      const keys = formSubmitErrors ? Object.keys(formSubmitErrors) : []
      return keys.map(key => {
        const errors = formSubmitErrors[key]
        if (Array.isArray(errors)) {
          return (
            <div key={key} className="submit-error">
              {getErrorLabel(key)}
              {errors?.map(error => (
                <span key={error}>{error} </span>
              ))}
            </div>
          )
        }
      })
    }

    let currentSubmitErrors = Object.keys(formSubmitErrors).length > 0

    const getFormField = (fieldProps, key, disabled, deadlineSection, maxMoveGroup, maxDateToMove, title, confirmedValue, type, tooltip, lautakuntaInPast) => {
      if (!showField(fieldProps.field, visValues)) {
        return null
      }
      //Hide ehdotus_nahtaville_aineiston_maaraaika if kaavaprosessin_kokoluokka is L or XL 
      // TODO: should be fixed in backend or Excel, remove this when mistake is found there
      if(fieldProps.field.name.includes("ehdotus_nahtaville_aineiston_maaraaika") && (visValues['kaavaprosessin_kokoluokka'] === 'L' || visValues['kaavaprosessin_kokoluokka'] === 'XL')){
        return null
      }

      const error = formSubmitErrors?.[fieldProps?.field?.name];
      let className = '';
  
      if (error !== undefined) {
        className = 'modal-field error-border'
      } else {
        className = 'modal-field'
      }
      // Special case since label is used.
      if (fieldProps.field.display === 'checkbox') {
        className = error ? 'error-border' : ''
      }
  
      let modifiedError = ''
      if (isArray(error)) {
        error.forEach(current => {
          modifiedError = modifiedError + ' ' + current
        })
      } else {
        modifiedError = error
      }

      return (
        <>
          <FormField
            {...fieldProps}
            key={key}
            formName={EDIT_PROJECT_TIMETABLE_FORM}
            deadlines={deadlines}
            error={modifiedError}
            formValues={visValues}
            className={className}
            isProjectTimetableEdit={true}
            disabled={type === 'date'
              ? (disabled?.disabled || !allowedToEdit)
              : disabled?.disabled}
            lautakuntaInPast={lautakuntaInPast}
            tooltip={tooltip}
            attributeData={visValues}
            disabledDates={disabledDates && type === 'date'}
            lomapaivat={lomapaivat}
            dateTypes={dateTypes}
            deadlineSection={deadlineSection}
            maxMoveGroup={maxMoveGroup}
            maxDateToMove={maxDateToMove}
            groupName={title}
            visGroups={groups}
            visItems={items}
            deadlineSections={deadlineSections}
            confirmedValue={confirmedValue}
            sectionAttributes={sectionAttributes}
            isAdmin={isAdmin}
            timetable_editable={fieldProps?.field?.timetable_editable}
          />
          {modifiedError && <div className="field-error">{modifiedError}</div>}
        </>
      )
    }
    const getFormFields = (sections, sectionIndex, disabled, deadlineSection, maxMoveGroup, maxDateToMove, title, confirmedValue, tooltip, lautakuntaInPast) => {
      // Separate the section with the label "Mielipiteet viimeistään"
      const filteredSections = sections.filter(section => section.label !== "Mielipiteet viimeistään");
      const lastSection = sections.find(section => section.label === "Mielipiteet viimeistään");

      // If the section exists, push it to the end of the filteredSections array
      if (lastSection) {
        filteredSections.push(lastSection);
      }

      const formFields = []
      filteredSections.forEach((field, fieldIndex) => {
          formFields.push(getFormField({ field }, `${sectionIndex} - ${fieldIndex}`, {disabled}, {deadlineSection}, maxMoveGroup, maxDateToMove, title, confirmedValue, field?.type, tooltip, lautakuntaInPast))
      })
      return formFields
    }

    const getMaxiumDateToMove = (attr) => {
      const foundGroups = groups.filter(g => g.nestedInGroup === group);
      const esillaolo = foundGroups.filter(obj => obj.content.startsWith('Esilläolo-'));
      const nahtavillaolo = foundGroups.filter(obj => obj.content.startsWith('Nahtavillaolo-'));
      const lautakunta = foundGroups.filter(obj => obj.content.startsWith('Lautakunta-'));

      let latestGroup
      let latestObject
      let miniumObject

      const phaseObject = lautakunta.length != 0 && lautakunta.length >= esillaolo.length || lautakunta.length != 0 && lautakunta.length >= nahtavillaolo.length ? lautakunta : esillaolo.length > 0 ? esillaolo : nahtavillaolo
      latestGroup = objectUtil.getHighestNumberedObject(phaseObject,groups);
      latestObject = attr[latestGroup?.deadlinegroup]
      if(latestObject){
        miniumObject = objectUtil.getMinObject(latestObject)
        if(visValues[miniumObject]){
          return [visValues[miniumObject], latestGroup.content]
        }
      }
      return [null,null]
    }

    const isPhaseClosed = (phase) => {
      const idx = phaseList.indexOf(phase);
      return idx > -1 && idx < projectPhaseIndex;
    };

    // Helper to check if lautakunta date is in the past
    const isLautakuntaDateInPast = (group, title, visValues) => {
      // Parse phase and lautakunta index from group/title
      let phaseKey = '';
      let lautakuntaIndex = '';
      if (group === "Ehdotus") {
        phaseKey = 'kaavaehdotus';
      } else if (group === "Tarkistettu ehdotus") {
        phaseKey = 'tarkistettu_ehdotus';
      } else if (group === "Luonnos") {
        phaseKey = 'kaavaluonnos';
      } else {
        // fallback, use group as lowercased and underscored
        phaseKey = group.toLowerCase().replace(/\s+/g, '_');
      }

      // Try to extract index from title, e.g. "Lautakunta-2"
      const match = title.match(/lautakunta-?(\d*)/i);
      if (match) {
        lautakuntaIndex = match[1] ? `_${match[1]}` : '';
      }

      // Build the key for visValues
      let dateKey = '';
      if (phaseKey === 'kaavaehdotus') {
        dateKey = `milloin_kaavaehdotus_lautakunnassa${lautakuntaIndex}`;
      } else if (phaseKey === 'tarkistettu_ehdotus') {
        dateKey = `milloin_tarkistettu_ehdotus_lautakunnassa${lautakuntaIndex}`;
      } else if (phaseKey === 'kaavaluonnos') {
        dateKey = `milloin_kaavaluonnos_lautakunnassa${lautakuntaIndex}`;
      } else {
        dateKey = `milloin_${phaseKey}_lautakunnassa${lautakuntaIndex}`;
      }

      const lautakuntaDateStr = visValues[dateKey];
      if (!lautakuntaDateStr) return false;

      const lautakuntaDate = new Date(lautakuntaDateStr);
      const now = new Date();
      return lautakuntaDate < now;
    };

    const _normalize = s =>
      s?.toLowerCase()
      .replace(/[äå]/gi, 'a')
      .replace(/ö/gi, 'o')
      .replace(/\s+/g, '');

    const _lastByPrefixes = (groups, group, prefixes) => {
      const list = groups
        .filter(g => g.nestedInGroup === group && prefixes.some(p => g.content.toLowerCase().startsWith(p)))
        .sort((a, b) => {
          const na = parseInt(a.content.split('-')[1] || '0', 10);
          const nb = parseInt(b.content.split('-')[1] || '0', 10);
          return na - nb;
        });
      return list[list.length - 1]?.content;
    };

    const getConfirmedValue = (group, title) => {
      const splitTitle = title.split('-').map(part => part.toLowerCase());
      splitTitle[1] = splitTitle[1]?.trim() === "1" ? "" : "_" + splitTitle[1]?.trim();

      let confirmedValue;

      if (group === "Ehdotus" && splitTitle[0].trim() === "nähtävilläolo") {
        splitTitle[0] = "esillaolo";
        confirmedValue = "vahvista_" + group.toLowerCase() + "_" + splitTitle[0] + splitTitle[1];
      }
      else if (group === "Tarkistettu ehdotus" && splitTitle[0].trim() === "lautakunta") {
        confirmedValue = "vahvista_" + "tarkistettu_ehdotus_" + "lautakunnassa" + splitTitle[1];
      }
      else if (group !== "Tarkistettu ehdotus" && splitTitle[0].trim() === "lautakunta") {
        if (group === "Luonnos" || group === "Ehdotus") {
          confirmedValue = "vahvista_" + "kaava" + group.toLowerCase() + "_" + splitTitle[0] + splitTitle[1];
        } else {
          confirmedValue = "vahvista_" + group.toLowerCase() + "_" + splitTitle[0] + splitTitle[1];
        }
        // Replace 'lautakunta' with 'lautakunnassa'
        confirmedValue = confirmedValue.replace('lautakunta', 'lautakunnassa');
      }
      else {
        confirmedValue = "vahvista_" + group.toLowerCase() + "_" + splitTitle[0] + "_alkaa" + splitTitle[1];
        confirmedValue = textUtil.replaceScandics(confirmedValue);
      }

      return confirmedValue.replace(/\s+/g, '');
    };

    const getSectionRestrictions = ({
      group,
      title,
      sectionIndex,
      groups,
      visValues,
      archived,
      projectPhaseIndex
    }) => {
      const nTitle = _normalize(title);

      const isLautakunta = nTitle.includes('lautakunta');
      const isEsillaolo = nTitle.includes('esilläolo') || nTitle.includes('esillaolo');
      const isNahtavillaolo = nTitle.includes('nähtävilläolo') || nTitle.includes('nahtavillaolo');

      const lastLautakunta = _lastByPrefixes(groups, group, ['lautakunta-']);
      const lastEsillaolo = _lastByPrefixes(groups, group, ['esilläolo-', 'esillaolo-']);
      const lastNahtavillaolo = _lastByPrefixes(groups, group, ['nähtävilläolo-', 'nahtavillaolo-']);

      const isLastLautakunta = isLautakunta && (_normalize(title) === _normalize(lastLautakunta));
      const isLastEsillaolo = isEsillaolo && (_normalize(title) === _normalize(lastEsillaolo));
      const isLastNahtavillaolo = isNahtavillaolo && (_normalize(title) === _normalize(lastNahtavillaolo));

      const lautakuntaInPast = isLautakunta && isLautakuntaDateInPast(group, title, visValues);
      const phaseClosed = isPhaseClosed(group);

      const disableConfirmButton = phaseClosed
        ? true
        : (
            (isLautakunta && !isLastLautakunta) ||
            (isEsillaolo && !isLastEsillaolo) ||
            (isNahtavillaolo && !isLastNahtavillaolo)
          );

      const disabled =
        archived ||
        disableConfirmButton
          ? true
          : sectionIndex < projectPhaseIndex;

      const nextGroupWord =
        isLautakunta ? 'lautakunta'
        : isEsillaolo ? 'esilläolo'
        : isNahtavillaolo ? 'nähtävilläolo'
        : 'elementtijoukko';

      const tooltip =
        phaseClosed
          ? 'Vahvistusta ei voi perua, koska vaihe on lopetettu.'
          : lautakuntaInPast
            ? 'Vahvistusta ei voi perua, koska lautakunta sijaitsee menneessä ajanhetkessä.'
            : disableConfirmButton
              ? `Vahvistusta ei voi perua, koska seuraava ${nextGroupWord} on jo lisätty.`
              : null;

      return { lautakuntaInPast, tooltip, disabled };
    };
  
    const renderSection = (section,sectionIndex,title) => {

      //grouped_sections specific to timeline with groups and subgroups
      const sections = section?.grouped_sections
      const confirmedValue = getConfirmedValue(group, title);

      const renderedSections = []

      const { lautakuntaInPast, tooltip, disabled } = getSectionRestrictions({
        group,
        title,
        sectionIndex,
        groups,
        visValues,
        archived,
        projectPhaseIndex
      });

      sections.forEach(subsection => {
        const attr = subsection?.attributes
        const [maxDateToMove,maxMoveGroup] = getMaxiumDateToMove(attr)
        if(attr[deadlinegroup]){
          renderedSections.push(
            <Tabs key={"tab" + sectionIndex} initiallyActiveTab={initialTab}>
              <Tabs.TabList className='tab-header' style={{ marginBottom: 'var(--spacing-m)' }}>
                {Object.keys(attr[deadlinegroup]).map((key) => {
                  let tabContent = key === "default" ? content : key
                  if (key === "Esille") tabContent = "Päivämäärät"
                  return <Tabs.Tab key={key}>{tabContent}</Tabs.Tab>
                })}
              </Tabs.TabList>
              {Object.values(attr[deadlinegroup]).map((subsection, index) => {
                return <Tabs.TabPanel style={{ marginBottom: 'var(--spacing-m)' }} key={`tabPanel-${index}-${subsection}`}>
                    {getFormFields(subsection, sectionIndex, disabled, attr[deadlinegroup], maxMoveGroup, maxDateToMove, title, confirmedValue, tooltip, lautakuntaInPast)}
                  </Tabs.TabPanel>
              })}
            </Tabs>
          )
        }
      })
      return renderedSections
    }

    return (
      <Modal open={open} size={'large'} className='timeline-edit-right'>
        <div className="timeline-edit-container">
          {open && <div className="timeline-edit-shadow"></div>}
          <div className="timeline-edit-content">
            <Modal.Header>
              <ul className="breadcrumb">
                <li><a href="#" role="button">{group}</a></li>
                <li><a href="#" role="button">{content}</a></li>
                <Button variant="supplementary" onClick={onClose}><IconCross /></Button>
              </ul>
            </Modal.Header>
            <Modal.Content>
              <div className='date-content'>
                {deadlineSections.map((section, i) => {
                  if (section.title === group) {
                    return renderSection(section, i, content);
                  }
                })}
              </div>
            </Modal.Content>
          </div>
        </div>
      </Modal>
    );
  }

  TimelineModal.propTypes = {
    open: PropTypes.bool,
    group: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    content: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    deadlinegroup: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    deadlines: PropTypes.array,
    onClose: PropTypes.func,
    visValues: PropTypes.object,
    deadlineSections: PropTypes.array,
    formSubmitErrors: PropTypes.object,
    projectPhaseIndex: PropTypes.number,
    phaseList: PropTypes.array,
    archived: PropTypes.bool,
    allowedToEdit: PropTypes.bool,
    disabledDates: PropTypes.array,
    lomapaivat: PropTypes.array,
    dateTypes: PropTypes.object,
    groups: PropTypes.array,
    items: PropTypes.array,
    sectionAttributes: PropTypes.array
  };
  
  export default TimelineModal