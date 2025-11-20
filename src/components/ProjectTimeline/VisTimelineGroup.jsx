import React, {useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { change } from 'redux-form'
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next'
import { EDIT_PROJECT_TIMETABLE_FORM } from '../../constants'
import Moment from 'moment'
import 'moment/locale/fi';
import {extendMoment} from 'moment-range'
import { LoadingSpinner } from 'hds-react'
import * as vis from 'vis-timeline'
import 'vis-timeline/dist/vis-timeline-graph2d.min.css'
import TimelineModal from './TimelineModal'
import VisTimelineMenu from './VisTimelineMenu'
import AddGroupModal from './AddGroupModal';
import ConfirmModal from '../common/ConfirmModal'
import PropTypes from 'prop-types';
import { getVisibilityBoolName, getVisBoolsByPhaseName, isDeadlineConfirmed } from '../../utils/projectVisibilityUtils';
import { useTimelineTooltip } from '../../hooks/useTimelineTooltip';
import './VisTimeline.scss'
Moment.locale('fi');

const VisTimelineGroup = forwardRef(({ groups, items, deadlines, visValues, deadlineSections, formSubmitErrors, projectPhaseIndex, phaseList, currentPhaseIndex, archived, allowedToEdit, isAdmin, disabledDates, lomapaivat, dateTypes, trackExpandedGroups, sectionAttributes, showTimetableForm}, ref) => {
    const dispatch = useDispatch();
    const moment = extendMoment(Moment);

    const { t, i18n } = useTranslation()
    const timelineRef = useRef(null);
    const observerRef = useRef(null); // Store the MutationObserver
    const timelineInstanceRef = useRef(null);
    const visValuesRef = useRef(visValues);

    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const selectedGroupIdRef = useRef(selectedGroupId);

    const [toggleTimelineModal, setToggleTimelineModal] = useState({open: false, highlight: false, deadlinegroup: false});
    const [timelineData, setTimelineData] = useState({group: false, content: false});
    const [timeline, setTimeline] = useState(false);
    const [addDialogStyle, setAddDialogStyle] = useState({ left: 0, top: 0 });
    const [addDialogData, setAddDialogData] = useState({group:false,deadlineSections:false,showPresence:false,showBoard:false,nextEsillaolo:false,nextLautakunta:false,esillaoloReason:"",lautakuntaReason:"",hidePresence:false,hideBoard:false});
    const [toggleOpenAddDialog, setToggleOpenAddDialog] = useState(false)
    const [currentFormat, setCurrentFormat] = useState("showYears");
    const currentFormatRef = useRef("showYears");
    const weekAxisListenerRef = useRef(null);
    // Week range floating tooltip
    const weekTooltipRef = useRef(null);
    const weekTooltipActiveRef = useRef(false);
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [dataToRemove, setDataToRemove] = useState({});
    const [timelineAddButton, setTimelineAddButton] = useState();
    //const [lock, setLock] = useState({group:false,id:false,locked:false,abbreviation:false});
    // Track whether weekend alignment shift has been applied (3-month view only)
    const weekendShiftAppliedRef = useRef(false);

    const { showTooltip, hideTooltip } = useTimelineTooltip();

    // Store original month names so we can temporarily swap in quarter range labels
    const originalMonthsRef = useRef(null);

    useImperativeHandle(ref, () => ({
      getTimelineInstance: () => timelineInstanceRef.current,
    }));

    // Locale enforcement helper
    const ensureFinnishLocale = () => {
      // Always make sure global locale is fi
      if (Moment.locale() !== 'fi') {
        Moment.locale('fi');
      }
      const ld = Moment.localeData('fi');
      // Patch if missing OR still lowercase (Moment fi default uses lowercase) OR not capitalized as requested
      const needsPatch = !ld ||
        !ld.monthsShort ||
        (ld.monthsShort() && (ld.monthsShort()[0] !== 'Tammi' || ld.monthsShort()[4] === 'touko')) ||
        (ld.weekdays && ld.weekdays()[0] !== 'Sunnuntai');
      if (needsPatch) {
        Moment.updateLocale('fi', {
          months: ['Tammikuu','Helmikuu','Maaliskuu','Huhtikuu','Toukokuu','Kesäkuu','Heinäkuu','Elokuu','Syyskuu','Lokakuu','Marraskuu','Joulukuu'],
          monthsShort: ['Tammi','Helmi','Maalis','Huhti','Touko','Kesä','Heinä','Elo','Syys','Loka','Marras','Joulu'],
          weekdays: ['Sunnuntai','Maanantai','Tiistai','Keskiviikko','Torstai','Perjantai','Lauantai'],
          weekdaysShort: ['Su','Ma','Ti','Ke','To','Pe','La'],
          weekdaysMin: ['Su','Ma','Ti','Ke','To','Pe','La'],
        });
      }
    };

    const groupDragged = (id) => {
      console.log('onChange:', id)
    }

    const preventDefaultAndStopPropagation = (event) => {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const updateGroupShowNested = (groups, groupId, showNested) => {
      if (groupId) {
        let group = groups.get(groupId);
        if (group) {
          group.showNested = showNested;
          groups.update(group);
        }
      }
    }
    
    const timelineGroupClick = (properties, groups) => {
      if (properties.group) {
        let clickedElement = properties.event.target;
    
        preventDefaultAndStopPropagation(properties.event);
    
        if(clickedElement.classList.contains('timeline-add-button')){
          updateGroupShowNested(groups, properties.group, true);
        } else {
          let groupId = properties.group;
          if (groupId) {
            let group = groups.get(groupId);
            if (group) {
              updateGroupShowNested(groups, properties.group, !group.showNested);
            }
          }
        }
      }
    }

    const trackExpanded = (event) => {
      trackExpandedGroups(event)
    }

    const getLargestIndex = (keys, visValRef) => {
      let largestIndex = 1;
      keys.forEach(key => {
        const match = /_(\d+)$/.exec(key);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > largestIndex && visValRef[key]) {
            largestIndex = number;
          } else if (number === 1 && visValRef[key] === false) {
            // If first element group explicitly set to false, it has been deleted
            // By default it may just be undefined (even if present)
            largestIndex = 0;
          }
        }
      });
      return largestIndex;
    }

    const getNextGroupString = (confirmed, count, maxCount, keys) => {
      if (confirmed) {
        const canAdd = count <= maxCount;
        return canAdd ? keys[count - 1] : false;
      }
      return false;
    }

    function getGroupStatus({
      confirmed,
      phase,
      largestIndex,
      count,
      deadlineCount,
      attributeKeys,
      canAdd,
      specialPhases,
      specialKeyFn,
      reasonLabel
    }) {
      let reason = !confirmed ? "noconfirmation" : "";
      let nextStr = getNextGroupString(confirmed, count, deadlineCount, attributeKeys);

      if (count - 1 === deadlineCount) {
        reason = "max";
      }

      if (!confirmed && specialPhases.includes(phase) && largestIndex === 0) {
        canAdd = true;
        nextStr = specialKeyFn ? specialKeyFn(phase, attributeKeys) : (attributeKeys[0] || false);
        reason = "";
      } else {
        canAdd = confirmed ? count <= deadlineCount : canAdd;
      }

      return [canAdd, nextStr, reason];
    }

    const checkConfirmedGroups = (
      esillaoloConfirmed,
      lautakuntaConfirmed,
      visValRef,
      phase,
      canAddEsillaolo,
      canAddLautakunta,
      data
    ) => {
      // Esilläolo
      const deadlineEsillaolokertaKeys = data.maxEsillaolo;
      const attributeEsillaoloKeys = getVisBoolsByPhaseName(phase).filter(
        (bool_name) => bool_name.includes('esillaolo') || bool_name.includes('nahtaville')
      );
      const largestIndex = getLargestIndex(attributeEsillaoloKeys, visValRef);
      const esillaoloCount = largestIndex + 1;

      const [canAddEsillaoloRes, nextEsillaoloStr, esillaoloReason] = getGroupStatus({
        confirmed: esillaoloConfirmed,
        phase,
        largestIndex,
        count: esillaoloCount,
        deadlineCount: deadlineEsillaolokertaKeys,
        attributeKeys: attributeEsillaoloKeys,
        canAdd: canAddEsillaolo,
        specialPhases: ["luonnos", "periaatteet"],
        specialKeyFn: null,
        reasonLabel: "esillaolo"
      });

      // Lautakunta
      const deadlineLautakuntakertaKeys = data.maxLautakunta;
      const attributeLautakuntaanKeys = getVisBoolsByPhaseName(phase).filter((bool_name) =>
        bool_name.includes("lautakunta")
      );
      const largestIndexLautakunta = getLargestIndex(attributeLautakuntaanKeys, visValRef);
      const lautakuntaCount = largestIndexLautakunta + 1;

      const [canAddLautakuntaRes, nextLautakuntaStr, lautakuntaReason] = getGroupStatus({
        confirmed: lautakuntaConfirmed,
        phase,
        largestIndex: largestIndexLautakunta,
        count: lautakuntaCount,
        deadlineCount: deadlineLautakuntakertaKeys,
        attributeKeys: attributeLautakuntaanKeys,
        canAdd: canAddLautakunta,
        specialPhases: ["luonnos", "periaatteet", "ehdotus"],
        specialKeyFn: (phase, attributeKeys) =>
          phase === "luonnos" || phase === "ehdotus"
            ? `kaava${phase}_lautakuntaan_1`
            : `${phase}_lautakuntaan_1`,
        reasonLabel: "lautakunta"
      });

      return [
        canAddEsillaoloRes,
        nextEsillaoloStr,
        canAddLautakuntaRes,
        nextLautakuntaStr,
        esillaoloReason,
        lautakuntaReason,
      ];
    };

    const hideSelection = (phase,data) => {
      //hide add options for certain phases
      if(phase === "Tarkistettu ehdotus"){
        return [true,false]
      }
      else if(phase === "Ehdotus" && (data?.kaavaprosessin_kokoluokka === "XS" || data?.kaavaprosessin_kokoluokka === "S" || data?.kaavaprosessin_kokoluokka === "M")){
        return [false,true]
      }
      else if(phase === "OAS"){
        return [false,true]
      }

      return [false,false]
    }

    const getPhaseKey = (data) => {
      return data.content.toLowerCase().replace(/\s+/g, '_');
    }

    const getLautakuntaCount = (groups, data) => {
      const matchingGroups = groups.get().filter(group => data.nestedGroups.includes(group.id));
      return matchingGroups.filter(group => group.content.includes('Lautakunta')).length;
    }

    function getConfirmationKeyForEsillaoloKey(phase, esillaoloKey) {
      const match = esillaoloKey.match(/_(\d+)$/);
      const idx = match ? match[1] : "1";

      // Normalize phase name for key
      let normalizedPhase = phase;
      if (normalizedPhase === "kaavaehdotus") normalizedPhase = "ehdotus";
      if (normalizedPhase === "kaavaluonnos") normalizedPhase = "luonnos";
      if (normalizedPhase === "tarkistettu_ehdotus") normalizedPhase = "tarkistettu_ehdotus";
      if (normalizedPhase === "periaatteet") normalizedPhase = "periaatteet";
      if (normalizedPhase === "oas") normalizedPhase = "oas";

      // Special case for ehdotus-phase: no _alkaa in the key!
      if (normalizedPhase === "ehdotus") {
        if (idx === "1") {
          return `vahvista_ehdotus_esillaolo`;
        } else {
          return `vahvista_ehdotus_esillaolo_${idx}`;
        }
      }

      // All other phases use _esillaolo_alkaa
      if (idx === "1") {
        return `vahvista_${normalizedPhase}_esillaolo_alkaa`;
      } else {
        return `vahvista_${normalizedPhase}_esillaolo_alkaa_${idx}`;
      }
    }

    function getConfirmationKeyForLautakuntaKey(phase, lautakuntaKey) {
      const match = lautakuntaKey.match(/_(\d+)$/);
      const idx = match ? match[1] : "1";
      let normalizedPhase = phase;
      if (normalizedPhase === "kaavaehdotus") normalizedPhase = "ehdotus";
      if (normalizedPhase === "kaavaluonnos") normalizedPhase = "luonnos";
      // periaatteet & tarkistettu_ehdotus stay as-is
      return idx === "1"
        ? `vahvista_${normalizedPhase}_lautakunnassa`
        : `vahvista_${normalizedPhase}_lautakunnassa_${idx}`;
    }

    const getEsillaoloConfirmed = (visValRef, phase, attributeEsillaoloKeys, nextIndex, hasFirstLautakunta) => {
      // Prevent adding if first lautakunta already added
      if (hasFirstLautakunta) return false;
      // Allow adding first occurrence
      if (nextIndex <= 1) return true;

      const prevKey = attributeEsillaoloKeys[nextIndex - 2];
      if (!prevKey) return false;

      // Legacy auto‑allow when first luonnos/periaatteet key not present at all
      if ((phase === 'luonnos' || phase === 'periaatteet') &&
          !("jarjestetaan_" + phase + "_esillaolo_1" in visValRef)) {
          return true;
      }

      const confirmKey = getConfirmationKeyForEsillaoloKey(phase, prevKey);
      if (Array.isArray(confirmKey)) {
          return visValRef[prevKey] === true && confirmKey.some(k => visValRef[k] === true);
      }
      return visValRef[prevKey] === true && visValRef[confirmKey] === true;
    };

    const getLautakuntaConfirmed = (visValRef, phase, lautakuntaCount) => {
      const projectSize = visValRef?.kaavaprosessin_kokoluokka;
      //L AND XL has phase order reversed on ehdotus phase and it is not allowed for lautakunta to be added after nahtavillaolo
      if (
          phase === "ehdotus" &&
          (projectSize === "XL" || projectSize === "L") &&
          visValRef?.vahvista_ehdotus_esillaolo === true
      ) {
          return false;
      }

      if (phase === "luonnos") {
        if(visValRef["luonnos_luotu"] === true && visValRef["kaavaluonnos_lautakuntaan_1"] === false){
          //Luonnos and periaatteet phase can be deleted or added later
          return true
        }
        return lautakuntaCount === 1
          ? visValRef["vahvista_kaavaluonnos_lautakunnassa"] === true
          : visValRef[`vahvista_kaavaluonnos_lautakunnassa_${lautakuntaCount}`] === true;
      } else if (phase === "ehdotus") {
        return lautakuntaCount === 1
          ? visValRef["vahvista_kaavaehdotus_lautakunnassa"] === true
          : visValRef[`vahvista_kaavaehdotus_lautakunnassa_${lautakuntaCount}`] === true;
      } else if (phase === "periaatteet") {
        if(visValRef["periaatteet_luotu"] === true && visValRef["periaatteet_lautakuntaan_1"] === false){
          //Luonnos and periaatteet phase can be deleted or added later
          return true
        }
        return lautakuntaCount === 1
          ? visValRef["vahvista_periaatteet_lautakunnassa"] === true
          : visValRef[`vahvista_periaatteet_lautakunnassa_${lautakuntaCount}`] === true;
      } else if (phase === "tarkistettu_ehdotus") {
        return lautakuntaCount === 1
          ? visValRef["vahvista_tarkistettu_ehdotus_lautakunnassa"] === true
          : visValRef[`vahvista_tarkistettu_ehdotus_lautakunnassa_${lautakuntaCount}`] === true;
      }
      return false;
    };

    const getLautakuntaAndPaatosBase = (phase) => {
      return {
        lautakuntaBase:
          phase === "luonnos"
            ? "kaavaluonnos_lautakuntaan"
            : phase === "ehdotus"
            ? "kaavaehdotus_lautakuntaan"
            : phase === "periaatteet"
            ? "periaatteet_lautakuntaan"
            : phase === "tarkistettu_ehdotus"
            ? "tarkistettu_ehdotus_lautakuntaan"
            : null,
        paatosBase:
          phase === "luonnos"
            ? "lautakunta_paatti_luonnos"
            : phase === "ehdotus"
            ? "lautakunta_paatti_ehdotus"
            : phase === "periaatteet"
            ? "lautakunta_paatti_periaatteet"
            : phase === "tarkistettu_ehdotus"
            ? "lautakunta_paatti_tarkistettu_ehdotus"
            : null
      };
    }

    const getLatestLautakuntaIndex = (visValRef, lautakuntaBase, lautakuntaCount) => {
      let latestIndex = 1;
      for (let i = 1; i <= lautakuntaCount + 2; i++) {
        if (visValRef[`${lautakuntaBase}_${i}`] === true) {
          latestIndex = i;
        }
      }
      return latestIndex;
    }

    const canGroupBeAdded = (visValRef, data) => {
      const phase = getPhaseKey(data);
      const lautakuntaCount = getLautakuntaCount(groups, data);
      // Prevent adding esillaolo/nahtavillaolo if lautakunta has been added and confirmed
      // Exception for XL/L ehdotus phase where lautakunta comes before esillaolo
      const firstLautakuntaKey = 
        phase === 'ehdotus'
        ? 'kaavaehdotus_lautakuntaan_1'
        : `${phase}_lautakuntaan_1`;
      const projectSize = visValRef?.kaavaprosessin_kokoluokka;
      const skipFirstCheck = phase === 'ehdotus' && (projectSize === 'XL' || projectSize === 'L') ? true : false;
      const hasFirstLautakunta = skipFirstCheck ? false : phase === 'ehdotus' ? visValRef[firstLautakuntaKey] === true : false;
      // Esilläolo confirmation
      const attributeEsillaoloKeys = getVisBoolsByPhaseName(phase).filter(
        (bool_name) => bool_name.includes('esillaolo') || bool_name.includes('nahtaville')
      );
      // Lautakunta confirmation
      const attributeLautakuntaKeys = getVisBoolsByPhaseName(phase).filter(
        (bool_name) => bool_name.includes('lautakunta')
      );

      const esillaoloCount = attributeEsillaoloKeys.filter(key => visValRef[key] === true).length;
      const nextEsillaoloIndex = esillaoloCount + 1;

      const esillaoloConfirmed = getEsillaoloConfirmed(visValRef, phase, attributeEsillaoloKeys, nextEsillaoloIndex, hasFirstLautakunta);
      // Lautakunta confirmation

      const lautakuntaConfirmed = getLautakuntaConfirmed(visValRef, phase, lautakuntaCount);

      // Use helper to get addability and reasons
      let canAddEsillaolo = false,
        nextEsillaoloClean = false,
        canAddLautakunta = false,
        nextLautakuntaClean = false,
        esillaoloReason = "",
        lautakuntaReason = "";

      [
        canAddEsillaolo,
        nextEsillaoloClean,
        canAddLautakunta,
        nextLautakuntaClean,
        esillaoloReason,
        lautakuntaReason
      ] = checkConfirmedGroups(
        esillaoloConfirmed,
        lautakuntaConfirmed,
        visValRef,
        phase,
        canAddEsillaolo,
        canAddLautakunta,
        data
      );
      
      // Force-disable esilläolo add if lautakunta is confirmed in this phase
      if (lautakuntaConfirmed && 
      !["XL. Ehdotus", "L. Ehdotus"].includes(visValRef.kaavan_vaihe)) {
        //Exception if first elements are deleted in luonnos/periaatteet phase
        const exceptionApplies =
        (visValRef.kaavan_vaihe === "XL. Luonnos" && visValRef["kaavaluonnos_lautakuntaan_1"] === false) ||
        (visValRef.kaavan_vaihe === "XL. Periaatteet" && visValRef["periaatteet_lautakuntaan_1"] === false);
        if (!exceptionApplies) {
            canAddEsillaolo = false;
            if (!esillaoloReason) esillaoloReason = "lautakuntaConfirmed";
        }
      }
     
      if (phase === "ehdotus" && (projectSize === "XL" || projectSize === "L")) {
        const anyEsillaoloConfirmed = attributeEsillaoloKeys.some(key => {
        if (visValRef[key] === true) {
            const confirmKey = getConfirmationKeyForEsillaoloKey(phase, key);
            if (Array.isArray(confirmKey)) {
              return confirmKey.some(k => visValRef[k] === true);
            }
            return visValRef[confirmKey] === true;
          }
          return false;
        });
        if(anyEsillaoloConfirmed){
          lautakuntaReason = "nahtavillaolo vahvistettu.";
        }
      }

      if ((phase === "luonnos" || phase === "periaatteet") && (projectSize === "XL" || projectSize === "L")) {
        const anyLautakuntaConfirmed = attributeLautakuntaKeys.some(key => {
        if (visValRef[key] === true) {
            const confirmKey = getConfirmationKeyForLautakuntaKey(phase, key);
            if (Array.isArray(confirmKey)) {
              return confirmKey.some(k => visValRef[k] === true);
            }
            return visValRef[confirmKey] === true;
          }
          return false;
        });
        if(anyLautakuntaConfirmed){
          esillaoloReason = "lautakuntaConfirmed";
          canAddEsillaolo = false;
        }
      }

      // Check max lautakunta limit
      const maxLautakunta = data.group?.maxLautakunta || data.maxLautakunta;
      if (lautakuntaCount >= maxLautakunta) {
        canAddLautakunta = false;
        lautakuntaReason = "max";
        return [
          canAddEsillaolo,
          nextEsillaoloClean,
          canAddLautakunta,
          nextLautakuntaClean,
          esillaoloReason,
          lautakuntaReason
        ];
      }

      // Lautakunta/paatos keys
      const { lautakuntaBase, paatosBase } = getLautakuntaAndPaatosBase(phase);

      // Find the latest lautakunta index for this phase
      const latestIndex = getLatestLautakuntaIndex(visValRef, lautakuntaBase, lautakuntaCount);

      // Build the päätös key for the latest lautakunta
      const paatosKey = latestIndex === 1
        ? paatosBase
        : `${paatosBase}_${latestIndex}`;

      const paatos = visValRef[paatosKey];

      // Check if the next lautakunta slot is false
      const nextLautakuntaKey = `${lautakuntaBase}_${latestIndex + 1}`;
      const canAddNextLautakunta = !visValRef[nextLautakuntaKey]

      if (!lautakuntaConfirmed) {
        canAddLautakunta = false;

        if(lautakuntaReason === ""){
          lautakuntaReason = "noconfirmation";
        }
      }
      else if (
        paatos === "palautettu_uudelleen_valmisteltavaksi" ||
        paatos === "asia_jai_poydalle"
      ) {
        if (canAddNextLautakunta) {
          canAddLautakunta = true;
          lautakuntaReason = "";
        } else {
          canAddLautakunta = false;
          lautakuntaReason = "max";
        }
      }
      else {
        canAddLautakunta = false;
        lautakuntaReason = "palautettu_tai_jai_poydalle";
      }

      if(phase === "periaatteet" && visValRef["periaatteet_luotu"] === true && visValRef["periaatteet_lautakuntaan_1"] === false || 
         phase === "luonnos" && visValRef["luonnos_luotu"] === true && visValRef["kaavaluonnos_lautakuntaan_1"] === false){
          //Luonnos and periaatteet phase can be deleted or added later
          canAddLautakunta = true;
          lautakuntaReason = "";
      }
      if(phase === "periaatteet" && visValRef["periaatteet_luotu"] === true && visValRef["jarjestetaan_periaatteet_esillaolo_1"] === false || 
         phase === "luonnos" && visValRef["luonnos_luotu"] === true && visValRef["jarjestetaan_luonnos_esillaolo_1"] === false){
            //Luonnos and periaatteet phase can be deleted or added later
          canAddEsillaolo = true;
          esillaoloReason = "";
      }

      // First lautakunta confirmation key check for current phase
      // Map phase name exceptions: luonnos -> kaavaluonnos, ehdotus -> kaavaehdotus, others use phase as-is
      const phaseMapped = phase === 'luonnos' ? 'kaavaluonnos' : (phase === 'ehdotus' ? 'kaavaehdotus' : phase);
      const firstLautakuntaConfirmKey = `vahvista_${phaseMapped}_lautakunnassa`;
      const preventEsillaoloAdd = visValRef[firstLautakuntaConfirmKey] === true;
      // Apply prevention except for XL/L ehdotus where lautakunta precedes esillaolo
      if(!(phase === 'ehdotus' && (projectSize === 'XL' || projectSize === 'L')) && preventEsillaoloAdd){
        canAddEsillaolo = false;
        nextEsillaoloClean = false;
        esillaoloReason = "Vahvistusta ei voi perua, koska seuraava lautakunta on jo lisätty."
      }
      // Allow re-adding first deleted Lautakunta for Ehdotus XL
      if (
          phase === "ehdotus" &&
          projectSize === "XL" &&
          visValRef["kaavaehdotus_lautakuntaan_1"] === false
      ) {
          canAddLautakunta = true;
          nextLautakuntaClean = "kaavaehdotus_lautakuntaan_1";
          lautakuntaReason = "";
      }
      return [
        canAddEsillaolo,
        nextEsillaoloClean,
        canAddLautakunta,
        nextLautakuntaClean,
        esillaoloReason,
        lautakuntaReason
      ];
    };

    const openAddDialog = (visValRef,data,event) => {
      const [addEsillaolo,nextEsillaolo,addLautakunta,nextLautakunta,esillaoloReason,lautakuntaReason] = canGroupBeAdded(visValRef,data)
      const rect = event.target.getBoundingClientRect();

      if (event.target.classList.contains('timeline-add-button')) {
        setTimelineAddButton(event.target);
      }
      
      setAddDialogStyle({
        left: `${rect.left - 23}px`,
        top: `${rect.bottom - 4}px`
      })

      const [hidePresence,hideBoard] = hideSelection(data.content,visValRef)
      setAddDialogData({group:data,deadlineSections:deadlineSections,showPresence:addEsillaolo,showBoard:addLautakunta,
        nextEsillaolo:nextEsillaolo,nextLautakunta:nextLautakunta,esillaoloReason:esillaoloReason,lautakuntaReason:lautakuntaReason,
        hidePresence:hidePresence,hideBoard:hideBoard})
      setToggleOpenAddDialog(prevState => !prevState)
    }

    const openRemoveDialog = (data) => {
      setOpenConfirmModal(!openConfirmModal)
      setDataToRemove(data)
    }

    const handleCancelRemove = () => {
      setOpenConfirmModal(!openConfirmModal)
    }

    const handleRemoveGroup = () => {
      const visiblityBool = getVisibilityBoolName(dataToRemove.deadlinegroup)
      if (visiblityBool) {
        dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, visiblityBool, false));
        const confirmationObject = isDeadlineConfirmed(visValuesRef.current, dataToRemove.deadlinegroup, true, false);
        if(confirmationObject?.key && confirmationObject?.value){
          dispatch(change(EDIT_PROJECT_TIMETABLE_FORM, confirmationObject.key, false));
        }
      }
      setOpenConfirmModal(!openConfirmModal)
    }

    const closeAddDialog = () => {
      setToggleOpenAddDialog(prevState => !prevState)
    };
  
  
    const lockLine = (data) => {
      console.log(data)
      //setLock({group:data.nestedInGroup,id:data.id,abbreviation:data.abbreviation,locked:!data.locked})
    }

    const openDialog = (data, container) => {
      const groupId = data.id;
      const timelineElement = timelineRef?.current;

      setToggleTimelineModal(prev => {
        if (selectedGroupIdRef.current === groupId && prev.open) {
          setSelectedGroupId(null);
          setTimelineData({group: null, content: null});
          // Remove highlights when closing via same group click
          if (timelineElement) {
            removeHighlights(timelineElement);
          }
          return {open: false, highlight: null, deadlinegroup: null};
        }

        setSelectedGroupId(groupId);

        if (timelineElement) {
          removeHighlights(timelineElement);
          addHighlights(timelineElement, data, container);
        }

        setTimelineData({group: data.nestedInGroup, content: data.content});
        return {
          open: true,
          highlight: container,
          deadlinegroup: data?.deadlinegroup?.includes(';') ? data.deadlinegroup.split(';')[0] : data.deadlinegroup
        };
      });
    };

    const removeHighlights = (timelineElement) => {
      timelineElement.querySelectorAll(".vis-group.foreground-highlight").forEach(el => {
        el.classList.remove("foreground-highlight");
      });
      timelineElement.querySelectorAll('.highlight-selected').forEach(el => {
        el.classList.remove('highlight-selected');
        if (el.parentElement.parentElement) {
          el.parentElement.parentElement.classList.remove('highlight-selected');
        }
      });
    };

    const addHighlights = (timelineElement, data, container) => {
      // Remove previous highlights
      timelineElement
        .querySelectorAll(".vis-group.foreground-highlight")
        .forEach(el => el.classList.remove("foreground-highlight"));

      // setTimeout(..., 0) ensures DOM elements are rendered before highlighting;
      // without it, elements may not exist yet, causing highlight logic to fail.
      setTimeout(() => {
        if (timelineElement && data?.deadlinegroup) {
          const groupEls = timelineElement.querySelectorAll(`.vis-group.${data.deadlinegroup}`);
          const groupEl = Array.from(groupEls).find(
            el => el.parentElement?.classList?.contains('vis-foreground')
          );
          groupEl?.classList?.add("foreground-highlight");
          if (groupEl) {
            localStorage.setItem('timelineHighlightedElement', data.deadlinegroup);
          }
        }

        container?.classList?.add("highlight-selected");
        container?.parentElement?.parentElement?.classList?.add("highlight-selected");
        localStorage.setItem('menuHighlight', data.className ? data.className : false);

        const groupContainer = timelineElement.querySelector(`#timeline-group-${data.id}`);
        groupContainer?.classList?.add("highlight-selected");
        groupContainer?.parentElement?.parentElement?.classList?.add("highlight-selected");
      }, 0);
    };

    const handleClosePanel = () => {
      setToggleTimelineModal({open: false, highlight: null, deadlinegroup: null});
      setSelectedGroupId(null);
      setTimelineData({group: null, content: null});

      // Remove group highlights when panel closes
      const timelineElement = timelineRef?.current;
      if (timelineElement) {
        removeHighlights(timelineElement);
      }
    };

    const changeItemRange = (subtract, item, i) => {
      const timeline = timelineRef?.current?.getTimelineInstance();
      if(timeline){
        let timeData = i
        if(!subtract){
          let originalDiff = moment.duration(moment(timeData.end).diff(moment(timeData.start)))
          let originalTimeFrame = originalDiff.asDays()
          timeData.start = item.end
          timeData.end = moment(timeData.start).add(originalTimeFrame, 'days').toDate()
        }
        else{
          timeData.end = item.start
        }
        timeline.itemSet.items[i.id].setData(timeData)
        timeline.itemSet.items[i.id].repositionX()
      }
    }
    //For vis timeline dragging 1.2v
  /*const onRangeChanged = ({ start, end }) => {
      console.log(start, end)
      const Min = 1000 * 60 * 60 * 24; // one day in milliseconds
      const Max = 31556952000; // 1000 * 60 * 60 * 24 * 365.25 one year in milliseconds
      let a0 = 10;
      let a100 = moment.duration(moment(Max).diff(moment(Min))).asMilliseconds();
      let  distance = (a100 - a0)/ 100;
      let startTime = moment(start);
      let endTime = moment(end);
      const duration = moment.duration(endTime.diff(startTime));
      const mins = duration.asMilliseconds();
        // Arithmatic progression variables
      if (mins !== 0) {
        const x = (mins - a0) / distance; // Arithmatic progression formula
        console.log(x)
        if(x > 50){
          console.log("smaller then 50")
          document.querySelectorAll('.inner, .inner-end').forEach(el => el.classList.add('hiddenTimes'));
        }
        else if(x < 50 && document.querySelectorAll('.hiddenTimes')){
          console.log("bigger then 50")
          document.querySelectorAll('.inner, .inner-end').forEach(el => el.classList.remove('hiddenTimes'));
        }
      } else {
        if(!document.querySelectorAll('.hiddenTimes')){
          console.log("100")
          document.querySelectorAll('.inner, .inner-end').forEach(el => el.classList.add('hiddenTimes'));
        }
      }
      
    } */

    /**
   * Move the timeline a given percentage to left or right
   * @param {Number} percentage   For example 0.1 (left) or -0.1 (right)
   */
    const move = (percentage) => {
      let range = timeline.getWindow();
      let interval = range.end - range.start;

      timeline.setWindow({
        start: range.start.valueOf() - interval * percentage,
        end: range.end.valueOf() - interval * percentage,
      });
    }

    const showDays = () => {
      let ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
      let now = new Date();
      let nowInMs = now.getTime();
      let oneDayFromNow = nowInMs + ONE_DAY_IN_MS;
      timeline.setWindow(nowInMs, oneDayFromNow);
    }

    const showWeeks = () => {
      let now = new Date();
      let currentYear = now.getFullYear();
      let startOfWeek = new Date(currentYear, now.getMonth(), now.getDate() - now.getDay());
      let endOfWeek = new Date(currentYear, now.getMonth(), now.getDate() - now.getDay() + 6);
      timeline.setWindow(startOfWeek, endOfWeek);
    }

    const showMonths = () => {
      // Leaving 3-month view? detach listener & revert shift
      if(currentFormatRef.current === 'show3Months') {
        detachWeekAxisHover();
        revertWeekendShift();
      }
      currentFormatRef.current = 'showMonths';
      const range = timeline.getWindow();
      const center = new Date((range.start.getTime() + range.end.getTime()) / 2);
      const rangeDuration = 1000 * 60 * 60 * 24 * 30; // about 1 month
      restoreNormalMonths(moment);
      timelineRef.current.classList.remove("years");
      timelineRef.current.classList.remove("hide-lines");
      timelineRef.current.classList.remove("months6");
      timelineRef.current.classList.remove("years2");
      timelineRef.current.classList.remove("year1")
      timelineRef.current.classList.add("months");
      timelineRef.current.classList.add("month1");
      timeline.setOptions({timeAxis: {scale: 'weekday'}});
      //Keep view centered on where user is
      const newStart = new Date(center.getTime() - rangeDuration / 2);
      const newEnd = new Date(center.getTime() + rangeDuration / 2);
      timeline.setWindow(newStart, newEnd);
      setCurrentFormat("showMonths");
      highlightJanuaryFirst()
    }

    const show3Months = () => {
      const range = timeline.getWindow();
      const center = new Date((range.start.getTime() + range.end.getTime()) / 2);
      const rangeDuration = 1000 * 60 * 60 * 24 * 30 * 3; // approx 3 months
      restoreNormalMonths(moment);
      timelineRef.current.classList.remove("years");
      timelineRef.current.classList.remove("months6");
      timelineRef.current.classList.remove("years2");
      timelineRef.current.classList.remove("month1");
      timelineRef.current.classList.remove("year1")
      timelineRef.current.classList.add("months");
      timelineRef.current.classList.add("hide-lines");
      timeline.setOptions({timeAxis: {scale: 'week'},      
        format: {
          minorLabels: { week: '[Viikko] w' }, // Week label: "Viikko 51"
          majorLabels: { week: 'MMMM YYYY' }    // Top axis: month + year
        }});

      const newStart = new Date(center.getTime() - rangeDuration / 2);
      const newEnd = new Date(center.getTime() + rangeDuration / 2);
      timeline.setWindow(newStart, newEnd);
      setCurrentFormat("show3Months");
      currentFormatRef.current = 'show3Months';
      attachWeekAxisHover();
      applyWeekendShift();
      highlightJanuaryFirst();
    }

    const show6Months = () => {
      if(currentFormatRef.current === 'show3Months') { detachWeekAxisHover(); revertWeekendShift(); }
      const range = timeline.getWindow();
      const center = new Date((range.start.getTime() + range.end.getTime()) / 2);
      const rangeDuration = 1000 * 60 * 60 * 24 * 30 * 6; // approx 6 months
      restoreNormalMonths(moment);
      restoreStandardLabelFormat();
      timelineRef.current.classList.remove("hide-lines");
      timelineRef.current.classList.remove("months");
      timelineRef.current.classList.remove("years2");
      timelineRef.current.classList.remove("month1");
      timelineRef.current.classList.remove("year1")
      timelineRef.current.classList.add("years");
      timelineRef.current.classList.add("months6");
      timeline.setOptions({timeAxis: {scale: 'month'}});

      const newStart = new Date(center.getTime() - rangeDuration / 2);
      const newEnd = new Date(center.getTime() + rangeDuration / 2);
      timeline.setWindow(newStart, newEnd);
      setCurrentFormat("show6Months");
      currentFormatRef.current = 'show6Months';
      highlightJanuaryFirst();
    }

    const showYears = () => {
      if(currentFormatRef.current === 'show3Months') { detachWeekAxisHover(); revertWeekendShift(); }
      const range = timeline.getWindow();
      const center = new Date((range.start.getTime() + range.end.getTime()) / 2);
      const rangeDuration = 1000 * 60 * 60 * 24 * 365; // about 1 year
      restoreNormalMonths(moment); // also restores after quarter view
      restoreStandardLabelFormat();
      timelineRef.current.classList.remove("months")
      timelineRef.current.classList.remove("hide-lines");
      timelineRef.current.classList.remove("months6");
      timelineRef.current.classList.remove("years2");
      timelineRef.current.classList.remove("month1");
      timelineRef.current.classList.add("years")
      timelineRef.current.classList.add("year1")
      timeline.setOptions({timeAxis: {scale: 'month'}});
      //Keep view centered on where user is
      const newStart = new Date(center.getTime() - rangeDuration / 2);
      const newEnd = new Date(center.getTime() + rangeDuration / 2);
      timeline.setWindow(newStart, newEnd);
      setCurrentFormat("showYears");
      currentFormatRef.current = 'showYears';
      highlightJanuaryFirst()
    }

    // Apply quarter range labels by temporarily replacing the Finnish month names
    const applyQuarterRangeLabels = () => {
      if (!originalMonthsRef.current) {
        const ld = Moment.localeData('fi');
        originalMonthsRef.current = {
          months: ld.months(),
          monthsShort: ld.monthsShort()
        };
      }
      const months = [...originalMonthsRef.current.months];
      const monthsShort = [...originalMonthsRef.current.monthsShort];
      months[0] = 'Tammikuu - Maaliskuu';
      months[3] = 'Huhtikuu - Kesäkuu';
      months[6] = 'Heinäkuu - Syyskuu';
      months[9] = 'Lokakuu - Joulukuu';
      // Short variants (kept concise; not shown with current format but safe)
      monthsShort[0] = 'Tam-Maa';
      monthsShort[3] = 'Huh-Kes';
      monthsShort[6] = 'Hei-Syy';
      monthsShort[9] = 'Lok-Jou';
      Moment.updateLocale('fi', { months, monthsShort });
    };

    const restoreQuarterRangeLabels = () => {
      if (originalMonthsRef.current) {
        Moment.updateLocale('fi', {
          months: originalMonthsRef.current.months,
          monthsShort: originalMonthsRef.current.monthsShort
        });
        originalMonthsRef.current = null;
      }
    };

    const show2Years = () => {
      if(currentFormatRef.current === 'show3Months') { detachWeekAxisHover(); revertWeekendShift(); }
      const range = timeline.getWindow();
      const center = new Date((range.start.getTime() + range.end.getTime()) / 2);
      const rangeDuration = 1000 * 60 * 60 * 24 * 365 * 2; // ~2 years
      restoreQuarterRangeLabels(); // ensure clean before applying
      applyQuarterRangeLabels();
      timelineRef.current.classList.remove('months');
      timelineRef.current.classList.remove("hide-lines");
      timelineRef.current.classList.remove("months6");
      timelineRef.current.classList.remove("month1");
      timelineRef.current.classList.remove("year1")
      timelineRef.current.classList.add('years');
      timelineRef.current.classList.add("years2");
      timeline.setOptions({
        timeAxis: { scale: 'month', step: 3 },
        format: {
          minorLabels: { month: 'MMMM' },
          majorLabels: { year: 'YYYY' }
        }
      });
      const newStart = new Date(center.getTime() - rangeDuration / 2);
      const newEnd = new Date(center.getTime() + rangeDuration / 2);
      timeline.setWindow(newStart, newEnd);
      timeline.redraw();
      setCurrentFormat('show2Years');
      currentFormatRef.current = 'show2Years';
      highlightJanuaryFirst();
    };

    const show5Years = () => {
      if(currentFormatRef.current === 'show3Months') { detachWeekAxisHover(); revertWeekendShift(); }
      let now = new Date();
      let currentYear = now.getFullYear();
      let startOf5Years = new Date(currentYear, now.getMonth(), 1);
      let endOf5Years = new Date(currentYear + 5, now.getMonth(), 0);
      restoreStandardLabelFormat();
      timeline.setOptions({timeAxis: {scale: 'month'}});
      timeline.setWindow(startOf5Years, endOf5Years);
      setCurrentFormat('show5Years');
      currentFormatRef.current = 'show5Years';
    }

    // Week hover logic (native title) for show3Months
    const computeWeekRange = (weekNum, anchorYear) => {
      // Use ISO week; handle year wrap by trying anchorYear then +/-1 if needed
      let start = moment().isoWeekYear(anchorYear).isoWeek(weekNum).isoWeekday(1).startOf('day');
      if(start.isoWeek() !== weekNum) start = moment().isoWeekYear(anchorYear+1).isoWeek(weekNum).isoWeekday(1).startOf('day');
      let end = moment(start).isoWeekday(7).endOf('day');
      return {start, end};
    };

    const deriveYearForLabel = (labelEl) => {
      // Walk previous siblings for a major label with year
      let parent = labelEl.parentNode;
      if(!parent) return new Date().getFullYear();
      const siblings = Array.from(parent.children);
      const idx = siblings.indexOf(labelEl);
      for(let i=idx; i>=0; i--){
        const sib = siblings[i];
        if(sib.classList && sib.classList.contains('vis-major')){
          const txt = sib.textContent || '';
          const m = txt.match(/(\d{4})/);
          if(m) return parseInt(m[1],10);
        }
      }
      // Fallback: center year of current window
      const range = timeline.getWindow();
      return new Date((range.start.getTime()+range.end.getTime())/2).getFullYear();
    };

    // --- Week tooltip helpers ---
    const ensureWeekTooltip = () => {
      if(!weekTooltipRef.current){
        const div = document.createElement('div');
        div.className = 'week-tooltip';
        div.style.position = 'fixed';
        div.style.pointerEvents = 'none';
        div.style.display = 'none';
        document.body.appendChild(div);
        weekTooltipRef.current = div;
      }
    };

    const showWeekTooltip = (text, clientX, clientY) => {
      ensureWeekTooltip();
      const el = weekTooltipRef.current;
      el.textContent = text;
      el.style.display = 'block';
      const offset = 16;
      el.style.left = `${clientX + offset}px`;
      el.style.top = `${clientY + offset}px`;
      weekTooltipActiveRef.current = true;
    };

    const moveWeekTooltip = (clientX, clientY) => {
      if(!weekTooltipActiveRef.current || !weekTooltipRef.current) return;
      const offset = 16;
      weekTooltipRef.current.style.left = `${clientX + offset}px`;
      weekTooltipRef.current.style.top = `${clientY + offset}px`;
    };

    const hideWeekTooltip = () => {
      if(weekTooltipRef.current){
        weekTooltipRef.current.style.display = 'none';
      }
      weekTooltipActiveRef.current = false;
    };

    const weekAxisPointerMove = (e) => {
      if(currentFormatRef.current !== 'show3Months') return;
      const target = e.target;
      if(!target || !target.classList || !target.classList.contains('vis-text') || !target.classList.contains('vis-minor')){ hideWeekTooltip(); return; }
      let weekNum = null;
      target.classList.forEach(cls => { const m = cls.match(/^vis-week(\d{1,2})$/); if(m) weekNum = parseInt(m[1],10); });
      if(!weekNum){ hideWeekTooltip(); return; }
      const year = deriveYearForLabel(target);
      const {start, end} = computeWeekRange(weekNum, year);
      const startStr = start.format('D.M');
      const endStr = end.format('D.M.YYYY');
      const rangeStr = `${startStr} - ${endStr}`;
      if(!weekTooltipActiveRef.current){
        showWeekTooltip(rangeStr, e.clientX, e.clientY);
      } else {
        moveWeekTooltip(e.clientX, e.clientY);
        if(weekTooltipRef.current) weekTooltipRef.current.textContent = rangeStr;
      }
    };

    const weekAxisPointerLeave = () => { hideWeekTooltip(); };

    const attachWeekAxisHover = () => {
      if(weekAxisListenerRef.current) return;
      const axis = timelineRef.current?.querySelector('.vis-time-axis.vis-foreground');
      if(axis){
        axis.addEventListener('pointermove', weekAxisPointerMove, true);
        axis.addEventListener('pointerleave', weekAxisPointerLeave, true);
        weekAxisListenerRef.current = axis;
      }
    };

    const detachWeekAxisHover = () => {
      if(!weekAxisListenerRef.current) return;
      weekAxisListenerRef.current.removeEventListener('pointermove', weekAxisPointerMove, true);
      weekAxisListenerRef.current.removeEventListener('pointerleave', weekAxisPointerLeave, true);
      hideWeekTooltip();
      weekAxisListenerRef.current = null;
    };

    useEffect(() => () => { detachWeekAxisHover(); revertWeekendShift(); }, []);

    // --- Weekend shift helpers (3-month view alignment) ---
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const applyWeekendShift = () => {
      if (weekendShiftAppliedRef.current || !items || currentFormatRef.current !== 'show3Months') return;
      const weekendItems = items.get({
        filter: itm => itm?.type === 'background' && typeof itm.className === 'string' && (itm.className.includes('normal-weekend') || itm.className.includes('negative'))
      });
      if (!weekendItems.length) return;
      const updates = [];
      for (const itm of weekendItems) {
        if (itm._origStart) continue; // already shifted
        const startMs = new Date(itm.start).getTime() - ONE_DAY_MS;
        const endMs = new Date(itm.end).getTime() - ONE_DAY_MS;
        updates.push({
          ...itm,
          start: new Date(startMs),
          end: new Date(endMs),
          _origStart: itm.start,
          _origEnd: itm.end
        });
      }
      if (updates.length) {
        items.update(updates);
        timelineInstanceRef.current?.redraw();
        weekendShiftAppliedRef.current = true;
      }
    };

    const revertWeekendShift = () => {
      if (!weekendShiftAppliedRef.current || !items) return;
      const shifted = items.get({ filter: itm => itm?._origStart });
      if (!shifted.length) { weekendShiftAppliedRef.current = false; return; }
      const restores = shifted.map(itm => ({
        ...itm,
        start: itm._origStart,
        end: itm._origEnd,
        _origStart: undefined,
        _origEnd: undefined
      }));
      items.update(restores);
      timelineInstanceRef.current?.redraw();
      weekendShiftAppliedRef.current = false;
    };

    // Cleanup tooltip DOM on unmount
    useEffect(() => () => {
      if(weekTooltipRef.current){
        weekTooltipRef.current.remove();
        weekTooltipRef.current = null;
      }
    }, []);


    const restoreNormalMonths = (moment) => {
      const loc = moment.locale('fi');
      const ld = moment.localeData(loc);
      const current = ld.monthsShort();

      // If we had quarter range labels applied, restore originals
      if (originalMonthsRef.current) {
        restoreQuarterRangeLabels();
      }

      // If months are Q1/Q2/... put real month names back using Intl
      if (current && current[0] === 'Q1') {
        const lang = 'fi';
        const longFmt  = new Intl.DateTimeFormat(lang,  { month: 'long'  });
        const shortFmt = new Intl.DateTimeFormat(lang,  { month: 'short' });
        const months = Array.from({length:12}, (_,i) => longFmt .format(new Date(2020, i, 1)));
        const monthsShort = Array.from({length:12}, (_,i) => shortFmt.format(new Date(2020, i, 1)));
        moment.updateLocale(loc, { months, monthsShort });
      }
    }

    // Reset quarter formatting when leaving 2-year quarter view
    const restoreStandardLabelFormat = () => {
      if (!timeline) return;
      timeline.setOptions({
        format: {
          minorLabels: { month: 'MMMM' },
          majorLabels: { year: 'YYYY' }
        }

      });
    }

    // attach events to the navigation buttons
    const zoomIn = () => {
      timeline.zoomIn(1);
    }

    const zoomOut = () =>  {
      timeline.zoomOut(1);
    }

    const moveLeft = () =>  {
      move(0.25);
    }

    const moveRight = () =>  {
      move(-0.25);
    }

    const goToToday = () => {
      const currentDate = new Date();
      timeline.moveTo(currentDate, {animation: true});
    }

    const toggleRollingMode = () =>  {
      timeline.toggleRollingMode();
    }

    const adjustWeekend = (date) => {
      if (date.getDay() === 0) {
        date.setTime(date.getTime() + 86400000); // Move from Sunday to Monday
      } else if (date.getDay() === 6) {
        date.setTime(date.getTime() - 86400000); // Move from Saturday to Friday
      }
    }

    const highlightJanuaryFirst = () => {
      if (!timelineInstanceRef.current) return;
    
      requestAnimationFrame(() => {
        document.querySelectorAll(".vis-text.vis-minor").forEach((label) => {
          const text = label.textContent.trim().toLowerCase();
    
          // Extract the first number before a possible <br> tag
          const firstLineMatch = text.match(/^\d+/); 
          const firstLine = firstLineMatch ? firstLineMatch[0] : "";

          // Month View: Must be "1" AND contain "tammikuu"
          const isMonthView = firstLine === "1";
    
          // Year View: If the text is "tammi" (January in Finnish)
          const isYearView = text === "tammi";
          if (isYearView || isMonthView) {
            label.classList.add("january-first");
          }
        });
      });
    };

    // MutationObserver to track new elements being added dynamically
    const observeTimelineChanges = () => {
      observerRef.current = new MutationObserver(() => {
        highlightJanuaryFirst(); // Apply styles when new elements are added
      });
  
      const targetNode = document.querySelector(".vis-panel.vis-center");
      if (targetNode) {
        observerRef.current.observe(targetNode, { childList: true, subtree: true });
      }
    };

    const getTopmostTimelineItem = (mouseX, mouseY, timelineInstanceRef) => {
      if (!timelineInstanceRef.current?.itemSet) {
        return null;
      }
      const items = Object.values(timelineInstanceRef.current.itemSet.items);
      let highestZIndex = -1;
      let topmostItem = null;
      let topmostItemDom = null;

      items.forEach((item) => {
        const itemDom = item?.dom?.box ?? item?.dom?.point ?? item?.dom?.dot;
        if (itemDom?.classList?.contains('vis-editable')) {
          const itemBounds = itemDom.getBoundingClientRect();

          // Only apply buffer for phase-elements (e.g. rangeItem2)
          const isPhase = itemDom.classList.contains('vis-range');
          const verticalBuffer = isPhase ? 15 : 0;

          if (
            mouseX >= itemBounds.left &&
            mouseX <= itemBounds.right &&
            mouseY >= (itemBounds.top - verticalBuffer) &&
            mouseY <= (itemBounds.bottom + verticalBuffer)
          ) {
            const zIndex = parseInt(window.getComputedStyle(itemDom).zIndex, 10);
            if (zIndex > highestZIndex) {
              highestZIndex = zIndex;
              topmostItem = item;
              topmostItemDom = itemDom;
            }
          }
        }
      });

      return topmostItem ? { item: topmostItem, dom: topmostItemDom } : null;
    };

    const isPhaseClosed = (phase) => {
      const idx = phaseList.indexOf(phase);
      return idx > -1 && idx < currentPhaseIndex;
    };

    useEffect(() => {
      // Ensure capitalized Finnish locale BEFORE creating timeline so initial labels are correct
      ensureFinnishLocale();

      const options = {
        locales: {
          fi: {
            current: "Nykyinen",
            time: "Aika",
          }
        },
        locale: 'fi',
        stack: false,
        selectable: false,
        multiselect: false,
        sequentialSelection:  false,
        moveable:true, // Dragging is disabled from VisTimeline.scss allow in v1.2
        zoomable:false,
        horizontalScroll:true,
        groupHeightMode:"fixed",
        start: new Date(),
        end: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365.25),
        zoomMin: 1000 * 60 * 60 * 24, // one day in milliseconds
        zoomMax: 157784760000, // 1000 * 60 * 60 * 24 * 5 * 365.25 5 year in milliseconds
        margin: {
          item: 20
        },
        align: 'center',
        editable: {
          add: false,         // add new items by double tapping
          updateTime: true,  // drag items horizontally
          updateGroup: false, // drag items from one group to another
          remove: false,       // delete an item by tapping the delete button top right
          overrideItems: false  // allow these options to override item.editable
        },
        itemsAlwaysDraggable: { // Dragging is disabled, allow in v1.2
            item:false, // change to true to allow dragging of items
            range:false // change to true to allow dragging of ranges
        },
        orientation:{
          axis: "top",
        },
        format: {
          minorLabels: {
              millisecond:'SSS',
              second:     's',
              minute:     'HH:mm',
              hour:       'HH:mm',
              weekday:    'D<br>ddd',
              day:        'D',
              week:       'w',
              month:      'MMMM',
              year:       'YYYY'
          },
          majorLabels: {
              millisecond:'HH:mm:ss',
              second:     'D MMMM HH:mm',
              minute:     'ddd D MMMM',
              hour:       'ddd D MMMM',
              weekday:    'MMMM YYYY',
              day:        'MMMM YYYY',
              week:       'MMMM YYYY',
              month:      'YYYY',
              year:       ''
          }   
        },
        // always snap to full hours, independent of the scale
        snap: function (date) {
          let hour = 60 * 60 * 1000;
          return Math.round(date / hour) * hour;
        },
        onMove(item, callback) {
          let preventMove = false;

          const adjustIfWeekend = (date) => {
            if (!(date.getDay() % 6)) {
              adjustWeekend(date);
              return true;
            }
            return false;
          }
        
          if (!adjustIfWeekend(item.start) && !adjustIfWeekend(item.end)) {
            const movingTimetableItem = moment.range(item.start, item.end);
            if (item.phase) {
              items.forEach(i => {
                if (i.phase && i.id !== item.id) {
                  const statickTimetables = moment.range(i.start, i.end);
                  if (movingTimetableItem.overlaps(statickTimetables)) {
                    preventMove = false;
                    changeItemRange(item.start > i.start, item, i);
                  }
                }
              });
            } else {
              items.forEach(i => {
                if (i.id !== item.id) {
                  if (item.phaseID === i.phaseID && !preventMove && !i.locked) {
                    preventMove = false;
                  } else {
                    const statickTimetables = moment.range(i.start, i.end);
                    if (movingTimetableItem.overlaps(statickTimetables)) {
                      preventMove = true;
                    }
                  }
                }
              });
            }
          }
        
          if (item.content != null && !preventMove) {
            callback(item); // send back adjusted item
          } else {
            callback(null); // cancel updating the item
          }
        },
        groupTemplate: function (group) {
          if (group === null) {
            return;
          }

          let container = document.createElement("div");
          container.classList.add("timeline-buttons-container");
          container.setAttribute("tabindex", "0");
          container.id = `timeline-group-${group.id}`;

          let words = group.deadlinegroup?.split("_") || [];
          let words2 = group.content?.split("-") || [];
          let normalizedString = words2[0]
            .replace(/[äå]/gi, 'a')
            .replace(/ö/gi, 'o')
            .toLowerCase();

          let wordsToCheck = ["vahvista_", words[0], normalizedString, words[2] === "1" ? "" : words[2]];
          const keys = Object.entries(visValuesRef?.current);

          const deletableGroup = keys.some(([key, value]) => {
            const allWordsInKey = wordsToCheck.every(word => key.includes(word));
            return allWordsInKey && value;
          });

          //Don't show buttons in these groups
          const stringsToCheck = ["Käynnistys", "Hyväksyminen", "Voimaantulo", "Vaiheen kesto"];
          const contentIncludesString = stringsToCheck.some(str => group?.content.includes(str));

          // Hover effect
          container.addEventListener("mouseenter", function () {
            container.classList.add("show-buttons");
          });
          container.addEventListener("mouseleave", function () {
            container.classList.remove("show-buttons");
          });

          if (group?.nestedGroups !== undefined && allowedToEdit && !contentIncludesString) {
            let label = document.createElement("span");
            label.innerHTML = group.content + " ";
            container.insertAdjacentElement("afterBegin", label);
            let add = document.createElement("button");
            add.classList.add("timeline-add-button");
            add.style.fontSize = "small";

            // Use phaseList and currentPhaseIndex from props
            const labelPhase = label.innerHTML.trim();
            const hoveredIndex = phaseList.indexOf(labelPhase);

            // Disable add-button if phase is closed
            let addTooltipDiv = "";
            if (hoveredIndex < currentPhaseIndex) {
              add.classList.add("button-disabled");
              addTooltipDiv = `<div class='timeline-add-text'>${t('deadlines.phase-closed')}</div>`;
            } else {
              add.classList.remove("button-disabled");
              addTooltipDiv = "";
            }

            add.addEventListener("click", function (event) {
              if (add.classList.contains("button-disabled")) {
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              openAddDialog(visValuesRef.current, group, event);
            });

            container.insertAdjacentElement("beforeEnd", add);
            if (addTooltipDiv) {
              add.insertAdjacentHTML("afterEnd", addTooltipDiv);
            }
            return container;
          } else if (group?.nestedInGroup) {
            // Get, format and add labels
            let label = document.createElement("span");
            let content = group.content;
            label.classList.add("timeline-button-label");

            const formattedContent = formatContent(content, false);
            label.innerHTML = formattedContent + " ";

            container.insertAdjacentElement("afterBegin", label);

            let edit = document.createElement("button");
            edit.classList.add("timeline-edit-button");
            edit.style.fontSize = "small";

            edit.addEventListener("click", function () {
              openDialog(group, container);
            });
            container.insertAdjacentElement("beforeEnd", edit);

            if (allowedToEdit && !contentIncludesString) {

              let labelRemove = document.createElement("span");
              container.insertAdjacentElement("afterBegin", labelRemove);
              let remove = document.createElement("button");
              remove.classList.add("timeline-remove-button");

              // Tooltip for disabled remove button
              let removeTextDiv = "";

              let groupPhase = group.phase || group.phaseName;
              if (!groupPhase && group.deadlinegroup) {
                groupPhase = group.deadlinegroup.split("_")[0];
                groupPhase = groupPhase.charAt(0).toUpperCase() + groupPhase.slice(1).toLowerCase();
              }
              // Try to find the best match in phaseList
              let matchedPhase = phaseList.find(phase =>
                phase.toLowerCase().startsWith(groupPhase?.toLowerCase())
              );
              if (!matchedPhase) {
                matchedPhase = phaseList.find(phase =>
                  phase.toLowerCase().includes(groupPhase?.toLowerCase())
                );
              }

              // --- Remove button disable logic ---
              let isPhaseEnded = isPhaseClosed(matchedPhase);
              let isFirst = false;
              let isConfirmed = false;

              // Common numeric suffix extraction
              const getNum = k => {
                const m = k.match(/_(\d+)$/);
                return m ? parseInt(m[1], 10) : 1;
              };
              const groupNum = getNum(group.deadlinegroup);
              isFirst = groupNum === 1;

              // Esilläolo or Nähtävilläolo
              if (label.innerHTML.includes("Esilläolo") || label.innerHTML.includes("Nähtävilläolo")) {
                // Extract phaseKey robustly from group.deadlinegroup
                let phaseKey = group.deadlinegroup;
                const match = phaseKey.match(/^([a-z_]+)_(esillaolokerta|nahtavillaolokerta)/i);
                if (match) {
                  phaseKey = match[1];
                }
                phaseKey = phaseKey.toLowerCase();
                if (phaseKey === "kaavaehdotus") phaseKey = "ehdotus";
                if (phaseKey === "kaavaluonnos") phaseKey = "luonnos";
                if (phaseKey === "tarkistettu_ehdotus") phaseKey = "tarkistettu_ehdotus";
                if (phaseKey === "periaatteet") phaseKey = "periaatteet";

                const allKeys = Object.keys(visValuesRef?.current || {}).filter(
                  key =>
                    key.startsWith(phaseKey) &&
                    key.includes("esillaolo") &&
                    visValuesRef.current[key] !== false &&
                    typeof visValuesRef.current[key] !== "undefined"
                );
                const allNums = allKeys.map(getNum).sort((a, b) => a - b);
                // If this is group 1, always treat as first
                isFirst = groupNum === 1 || (allNums.length > 0 && groupNum === allNums[0]);

                // Confirmation
                const confirmKey = getConfirmationKeyForEsillaoloKey(phaseKey, group.deadlinegroup);
                isConfirmed = visValuesRef?.current[confirmKey] === true;
              }

              // Lautakunta
              else if (label.innerHTML.includes("Lautakunta")) {
                let phaseKey = group.deadlinegroup;
                if (phaseKey.includes("_lautakunta")) {
                  phaseKey = phaseKey.substring(0, phaseKey.indexOf("_lautakunta"));
                }
                phaseKey = phaseKey.toLowerCase();
                if (phaseKey === "ehdotus") {
                  phaseKey = "kaavaehdotus";
                }
                if (phaseKey === "luonnos") {
                  phaseKey = "kaavaluonnos";
                }
                if (phaseKey === "tarkistettu_ehdotus") {
                  phaseKey = "tarkistettu_ehdotus";
                }
                if (phaseKey === "periaatteet") {
                  phaseKey = "periaatteet";
                }

                const allKeys = Object.keys(visValuesRef?.current || {}).filter(
                  key =>
                    key.startsWith(phaseKey) &&
                    key.includes("lautakuntaan") &&
                    visValuesRef.current[key] !== false &&
                    typeof visValuesRef.current[key] !== "undefined"
                );
                const allNums = allKeys.map(getNum).sort((a, b) => a - b);
                isFirst = allNums.length > 0 && groupNum === allNums[0];

                // Confirmation
                const lautakuntaMatch = group.deadlinegroup.match(/_(\d+)$/);
                const lautakuntaIndex = lautakuntaMatch ? lautakuntaMatch[1] : "1";
                const confirmKey = lautakuntaIndex === "1"
                  ? `vahvista_${phaseKey}_lautakunnassa`
                  : `vahvista_${phaseKey}_lautakunnassa_${lautakuntaIndex}`;
                isConfirmed = visValuesRef?.current[confirmKey] === true;
              }
              // Tooltip and disable logic
              if (isPhaseEnded) {
                remove.classList.add("button-disabled");
                removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-phase-closed')}</div>`;
              } else if (isConfirmed) {
                remove.classList.add("button-disabled");
                if (label.innerHTML.includes("Lautakunta")) {
                  removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-confirmed-lautakunta')}</div>`;
                } else if (label.innerHTML.includes("Esilläolo")) {
                  removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-confirmed-esillaolo')}</div>`;
                } else if (label.innerHTML.includes("Nähtävilläolo")) {
                  removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-confirmed-nahtavillaolo')}</div>`;
                } else {
                  removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-confirmed')}</div>`;
                }
              } else if (isFirst) {
                const isEhdotusXL = group?.nestedInGroup === "Ehdotus" && visValuesRef.current?.kaavaprosessin_kokoluokka === "XL";
                const isLautakunta = label.innerHTML.includes("Lautakunta");
                if (
                    group?.nestedInGroup !== "Periaatteet" &&
                    group?.nestedInGroup !== "Luonnos" &&
                    !(isEhdotusXL && isLautakunta)
                ) {
                    remove.classList.add("button-disabled");
                }
                if (label.innerHTML.includes("Esilläolo")) {
                  removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-first-esillaolo')}</div>`;
                } else if (label.innerHTML.includes("Lautakunta")) {
                  removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-first-lautakunta')}</div>`;
                } else if (label.innerHTML.includes("Nähtävilläolo")) {
                  removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-first-nahtavillaolo')}</div>`;
                }
              }

              remove.style.fontSize = "small";

              remove.addEventListener("click", function () {
                if (!remove.classList.contains("button-disabled")) {
                  openRemoveDialog(group);
                }
              });

              container.insertAdjacentElement("beforeEnd", remove);

              if (remove.classList.contains("button-disabled") && removeTextDiv) {
                container.insertAdjacentHTML("beforeEnd", removeTextDiv);
              }

              let lock = document.createElement("button");
              lock.classList.add("timeline-lock-button");
              lock.style.fontSize = "small";
              lock.addEventListener("click", function () {
                lock.classList.toggle("lock");
                lockLine(group);
              });
              container.insertAdjacentElement("beforeEnd", lock);

            }
            return container;
          } else {
            let label = document.createElement("span");
            label.classList.add("timeline-phase-label");
            label.innerHTML = group?.content + " ";
            container.insertAdjacentElement("afterBegin", label);
            return container;
          }
        },
      }

      // Throttle mousemove for performance
      let lastCall = 0;
      let animationFrameId = null;
      const throttleMs = 16;

      const handleMouseMove = (event) => {
        const now = Date.now();
        if (now - lastCall < throttleMs) return;
        lastCall = now;

        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(() => {

          // Check if the legend/info tooltip is open
          const menuTooltip = document.querySelector('.element-tooltip');
          if (menuTooltip && menuTooltip.offsetParent !== null) {
            hideTooltip();
            return;
          }

          const mouseX = event.clientX;
          const mouseY = event.clientY;

          // Check if mouseX is less than 310 to avoid showing tooltip over the vis-left
          if (mouseX < 310 || mouseY < 250) {
            hideTooltip();
            return;
          }

          const result = getTopmostTimelineItem(mouseX, mouseY, timelineInstanceRef);

          if (result) {
            showTooltip(event, result.item.data, result.item.parent.className);
          } else {
            hideTooltip();
          }
        });
      };

      // Attach the mousemove event to the container, not the items themselves
      timelineRef.current.addEventListener('mousemove', handleMouseMove);

      if(items && options && groups){
        const timeline = timelineRef.current &&
        new vis.Timeline(timelineRef.current, items, options, groups);
        timelineInstanceRef.current = timeline
        setTimeline(timeline)
        // add event listener
        timeline.on('groupDragged', groupDragged)

        // Add click event listener to timeline container so clicking on the timeline items works
        timelineRef.current.addEventListener('click', function(event) {
          const mouseX = event.clientX;
          const mouseY = event.clientY;

          // Skip clicks in the vis-left and header areas
          if (mouseX < 310 || mouseY < 250) {
            return;
          }

          const result = getTopmostTimelineItem(mouseX, mouseY, timelineInstanceRef);

          if (result) {
            if (result.item.data.phase === true) {
              return;
            }
            let groupObj = groups.get(result.item.data.group) || result.item.data;
            openDialog(groupObj, result.dom);
          }
        });

        /* if (timeline?.itemSet) {
          // remove the default internal hammer tap event listener
          timeline.itemSet.groupHammer.off('tap');
          // use my own fake internal hammer tap event listener
          timeline.itemSet.groupHammer.on('tap', function (event) {
            let target = event.target;
            if (target.classList.contains('timeline-add-button')) {
                //Custom function to add new item
                timelineGroupClick(timeline.itemSet.options,groups)
            } 
            else {
              trackExpanded(event)
              // if not add button, forward the event to the vis event handler
              timeline.itemSet._onGroupClick(event);
            }
          });
          
        } */
       if (timeline?.itemSet) {
          timeline.itemSet.groupHammer.off('tap');
          timeline.itemSet.groupHammer.on('tap', function (event) {
            let target = event.target;
            if (target.classList.contains('timeline-add-button')) {
              if (target.classList.contains('button-disabled')) {
                event.preventDefault();
                event.stopPropagation();
                return; // Do nothing if disabled
              }
              timelineGroupClick(timeline.itemSet.options, groups);
            } else {
              trackExpanded(event);
              timeline.itemSet._onGroupClick(event);
            }
          });
        }
        timeline.focus(0);
        if(timeline){
          setTimeout(() => {
            highlightJanuaryFirst();
            observeTimelineChanges();
          }, 100); // Ensures elements are rendered before applying styles
        }
        //timeline.on('rangechanged', onRangeChanged);
        return () => {
          if (timelineInstanceRef.current) {
            timelineInstanceRef.current.destroy();
            timelineInstanceRef.current.off('itemover', showTooltip);
            timelineInstanceRef.current.off('itemout', hideTooltip);
            // Remove mousemove from timelineRef.current
            if (timelineRef.current) {
              timelineRef.current.removeEventListener('mousemove', handleMouseMove);
            }
          }
          timeline.off('groupDragged', groupDragged)
          observerRef?.current?.disconnect();
          //timeline.off('rangechanged', onRangeChanged);
        }
      }
    }, [])

    // Helper: Highlight timeline item if needed
    function highlightTimelineItem(timelineElement, savedHighlightId) {
      if (!timelineElement || !savedHighlightId) return;
      const alreadyHighlightedElements = timelineElement.querySelectorAll(".vis-group.foreground-highlight");
      if (alreadyHighlightedElements.length > 0) return;

      const matchedItem = timelineElement.querySelector(`.vis-item[class*="${savedHighlightId}"]`);
      if (!matchedItem) return;

      const groupEl = matchedItem.closest(".vis-group");
      if (groupEl) {
        groupEl.classList.add("foreground-highlight");
      }
    }

    // Helper: Highlight menu item if needed
    function highlightMenuItem(menuHighlightClass, timelineRef) {
      if (
        !menuHighlightClass ||
        typeof menuHighlightClass !== "string" ||
        menuHighlightClass.startsWith("[object ") ||
        !timelineRef?.current
      ) {
        return;
      }
      const selector = `.vis-label.vis-nested-group.${CSS.escape(menuHighlightClass)}`;
      const alreadyHighlightedMenuElements = document.querySelectorAll(".highlight-selected");
      if (alreadyHighlightedMenuElements.length > 0) return;

      const menuElementToHighlight = document.querySelector(selector);
      if (menuElementToHighlight) {
        menuElementToHighlight.classList.add("highlight-selected");
      }
    }

    useEffect(() => {
      visValuesRef.current = visValues;
      setToggleOpenAddDialog(false);

      if (timelineRef.current && timelineInstanceRef.current) {
        // Update timeline when values change from side modal
        timelineInstanceRef.current.setItems(items);
        timelineInstanceRef.current.setGroups(groups);
        timelineInstanceRef.current.redraw();
      }

      // Restore highlight from localStorage
      const savedHighlightId = localStorage.getItem("timelineHighlightedElement");
      const menuHighlightClass = localStorage.getItem("menuHighlight");

      if (timelineRef.current) {
        highlightTimelineItem(timelineRef.current, savedHighlightId);
      }
      highlightMenuItem(menuHighlightClass, timelineRef);

    }, [visValues]);

    function getHighlightedElement(offset) {
      const raw = Number(offset); // 1 in date is 0 in dom elements so we need to subtract
      const adjusted = !isNaN(raw) && raw > 0 ? raw - 1 : 0; // subtract 1 when > 0, never below 0
      const container = document.querySelector('.vis-labelset');
      if(!container) return null;
      const all = Array.from(container.querySelectorAll('.vis-nested-group'));
      return all[adjusted] || null;
    }

    // Function to highlight elements based on phase name and suffix when redirected from the form to the timeline
    const highlightTimelineElements = (deadlineGroup) => {
      if (!deadlineGroup || !timelineRef.current) return;
      // Find the element whose className contains the full deadlineGroup string
      const container = document.querySelector('.vis-labelset');
      if (!container) return;
      // Normalize: vis.js may replace ä/ö/å with a/o/a and lowercase
      const normalize = str => str
        .replace(/[äå]/gi, 'a')
        .replace(/ö/gi, 'o')
        .toLowerCase();
      const normalizedGroup = normalize(deadlineGroup);
      const all = Array.from(container.querySelectorAll('.vis-nested-group'));
      const highlightedElement = all.find(el => normalize(el.className).includes(normalizedGroup));
      if (highlightedElement) {
        highlightedElement.classList.add('highlight-selected');
      }
    };

    useEffect(() => {
      selectedGroupIdRef.current = selectedGroupId;
    }, [selectedGroupId]);

    useEffect(() => {
      if (showTimetableForm.selectedPhase !== null) {
        setToggleTimelineModal({open:!toggleTimelineModal.open, highlight:true, deadlinegroup:showTimetableForm?.matchedDeadline?.deadlinegroup})
        setTimelineData({group:showTimetableForm.selectedPhase, content:formatDeadlineGroupTitle(showTimetableForm)})
        // Call the highlighting function. Defer highlight to after DOM update
        setTimeout(() => {
          highlightTimelineElements(showTimetableForm?.matchedDeadline?.deadlinegroup);
        }, 50);
      }
    }, [showTimetableForm.selectedPhase])

    const generateTitle = (deadlinegroup) => {
      if (!deadlinegroup) return '';
      // Special handling: treat 'tarkistettu_ehdotus' as one phase token, not two
      let parts = [];
      if (deadlinegroup.startsWith('tarkistettu_ehdotus_')) {
        // Remove the combined prefix and reconstruct parts so that index 0 is the phase
        const remainder = deadlinegroup.substring('tarkistettu_ehdotus_'.length);
        parts = ['tarkistettu_ehdotus', ...remainder.split('_')];
      } else {
        parts = deadlinegroup.split('_');
      }
      if (parts.length < 3) return deadlinegroup;
      const formattedString = `${parts[1].replace('kerta', '')}-${parts[2]}`;
      return formattedString.charAt(0).toUpperCase() + formattedString.slice(1);
    };

    const formatDeadlineGroupTitle = (data) => {
      if(data.selectedPhase === "Voimaantulo" || data.selectedPhase === "Hyväksyminen"){
        return "Vaiheen lisätiedot";
      }
      else{
        const newTitle = generateTitle(data?.matchedDeadline?.deadlinegroup);
        return formatContent(newTitle,true);
      }
    }

    const formatContent = (content, keepNumberOne = false) => {
      if (content) {
        if (content.includes("-1") && !keepNumberOne) {
          content = content.replace("-1", "");
        } else if (content.includes("-")) {
          content = content.replace("-", " - ");
        } else if (content.includes("Vaiheen kesto")) {
          content = "Vaiheen lisätiedot";
        }

        if (content.includes("Nahtavillaolo")) {
          content = content.replace("Nahtavillaolo", "Nähtävilläolo");
        }

        return content;
      }
    };

    const getTimelineInitialTab = (data) => {
      if(!data) return 0;
      const { selectedPhase, subgroup, name } = data;
      if(selectedPhase === "Hyväksyminen"){
          if(subgroup === "Jatkotoimet") return 1;
          if(subgroup === "Pöytäkirjasta") return 0;
      }
      if(selectedPhase === "Voimaantulo"){
          if(subgroup === "Valitukset") return 0;
          if(subgroup === "Lopputulos") return 1;
          if(name === "voimaantulo_pvm") return 1;
          return subgroup === "Päätös" ? 1 : 0;
      }
      return subgroup === "Päätös" ? 1 : 0;
    };

    const timelineInitialTab = getTimelineInitialTab(showTimetableForm);

    return (
      !deadlines ? <LoadingSpinner />
      :
      <>
        <div className='vis years' ref={timelineRef}>
          <VisTimelineMenu
            goToToday={goToToday}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            moveLeft={moveLeft}
            moveRight={moveRight}
            toggleRollingMode={toggleRollingMode}
            showDays={showDays}
            showWeeks={showWeeks}
            showMonths={showMonths}
            show3Months={show3Months}
            show6Months={show6Months}
            showYears={showYears}
            show2Years={show2Years}
            show5Years={show5Years}
          />
        </div>
        <TimelineModal 
          open={toggleTimelineModal.open}
          group={timelineData.group}
          content={formatContent(timelineData.content, true)}
          deadlinegroup={toggleTimelineModal.deadlinegroup}
          deadlines={deadlines}
          onClose={handleClosePanel}
          visValues={visValues}
          deadlineSections={deadlineSections}
          formSubmitErrors={formSubmitErrors}
          phaseList={phaseList}
          projectPhaseIndex={projectPhaseIndex}
          archived={archived}
          allowedToEdit={allowedToEdit}
          disabledDates={disabledDates}
          lomapaivat={lomapaivat}
          dateTypes={dateTypes}
          groups={groups?.get()}
          items={items?.get()}
          sectionAttributes={sectionAttributes}
          isAdmin={isAdmin}
          initialTab={timelineInitialTab}
        />
        <AddGroupModal
          toggleOpenAddDialog={toggleOpenAddDialog}
          addDialogStyle={addDialogStyle}
          addDialogData={addDialogData}
          closeAddDialog={closeAddDialog}
          allowedToEdit={allowedToEdit}
          timelineAddButton={timelineAddButton}
          phaseIsClosed={isPhaseClosed(addDialogData?.group?.content)}
        />
        <ConfirmModal
          openConfirmModal={openConfirmModal}
          headerText={"Haluatko poistaa rivin?"} 
          contentText={"Jos poistat tämän rivin, et voi palauttaa sitä myöhemmin."} 
          button1Text={"Peruuta"} 
          button2Text={"Poista rivi"}
          onButtonPress1={handleCancelRemove} 
          onButtonPress2={handleRemoveGroup}
          style={"timetable-danger-modal"}
          buttonStyle1={"secondary"}
          buttonStyle2={"danger"}
        />
      </>
    )
});
VisTimelineGroup.displayName = 'VisTimelineGroup';
VisTimelineGroup.propTypes = {
  groups: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool
  ]),
  items: PropTypes.object,
  deadlines: PropTypes.array,
  visValues: PropTypes.object,
  deadlineSections: PropTypes.array,
  formSubmitErrors: PropTypes.object,
  projectPhaseIndex: PropTypes.number,
  archived: PropTypes.bool,
  allowedToEdit: PropTypes.bool,
  isAdmin: PropTypes.bool,
  disabledDates: PropTypes.array,
  lomapaivat: PropTypes.array,
  dateTypes: PropTypes.object,
  trackExpandedGroups: PropTypes.func,
  sectionAttributes: PropTypes.array
};
export default VisTimelineGroup