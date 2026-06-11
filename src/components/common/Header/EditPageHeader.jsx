import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigation, Button, IconAngleLeft, IconCheck, IconErrorFill, LoadingSpinner, Tooltip } from 'hds-react';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setTestingConnection } from '../../../actions/projectActions.js';
import { lastSavedSelector, projectNetworkSelector, savingSelector, selectedPhaseSelector } from '../../../selectors/projectSelector';
import { schemaSelector } from '../../../selectors/schemaSelector.js';
import schemaUtils from '../../../utils/schemaUtils';
import { useInterval } from '../../../hooks/connectionPoller.js';
import PropTypes from 'prop-types';

const EditPageHeader = ({ title, pollConnection, currentSectionIndex, location }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();

  const currentEnv = process.env.REACT_APP_ENVIRONMENT;
  const [pollCount, setPollCount] = useState(1);
  const [isPollingConnection, setIsPollingConnection] = useState(false);
  const [updateTime, setUpdateTime] = useState({ status: t('header.edit-menu-no-save'), time: "" });
  const [lastSuccessfulSaveTime, setLastSuccessfulSaveTime] = useState(null);
  const [phaseTitle, setPhaseTitle] = useState("");
  const [sectionTitle, setSectionTitle] = useState("");

  const projectNetwork = useSelector(state => projectNetworkSelector(state));
  const lastSaved = useSelector(state => lastSavedSelector(state));
  const saving = useSelector(state => savingSelector(state));
  const schema = useSelector(state => schemaSelector(state));
  const selectedPhase = useSelector(state => selectedPhaseSelector(state));
  const isConnectionRestored = projectNetwork?.status === 'success' || lastSaved?.status === 'connection_restored';

  const spinnerRef = useRef(null);

  useEffect(() => {
    if (schema?.phases) {
      const currentSchemaIndex = schema?.phases.findIndex(s => s.id === schemaUtils.getSelectedPhase(location.search, selectedPhase));
      const currentSchema = schema?.phases[currentSchemaIndex];
      const currentSection = currentSchema?.sections[currentSectionIndex];
      setPhaseTitle(currentSchema?.title);
      setSectionTitle(currentSection?.title);
    }
  }, [schema, selectedPhase, currentSectionIndex]);

  useInterval(() => {
    // Auto-retry connection to backend during error
    if (lastSaved?.status === "error") {
      setPollCount(Math.min(pollCount + pollCount, 6));
      setIsPollingConnection(true);
      const failedFieldName = lastSaved?.fields?.[0];
      pollConnection();
      dispatch(setTestingConnection(true, failedFieldName));
      if (spinnerRef?.current?.style) {
        spinnerRef.current.style.visibility = "visible";
        setTimeout(() => {
          spinnerRef.current.style.visibility = "hidden";
          setIsPollingConnection(false);
          dispatch(setTestingConnection(false, null));
        }, 5000);
      }
    }
  }, lastSaved?.status === "error" ? 1000 * pollCount * 10 : 0);



  useEffect(() => {
    if (spinnerRef?.current?.style) {
      spinnerRef.current.style.visibility = saving ? "visible" : "hidden";
    }
  }, [saving]);

  useEffect(() => {
    if (!lastSaved) {
      return;
    }

    let latestUpdate;

    if (lastSaved?.status === "error" || lastSaved?.status === "field_error") {
      // Don't include time with error status - time will be shown in tooltip only if it exists
      latestUpdate = { status: t('header.edit-menu-save-fail'), time: "" };
    }
    else if (lastSaved?.status === "success") {
      setPollCount(1);
      latestUpdate = { status: t('header.latest-save'), time: lastSaved.time };
      setLastSuccessfulSaveTime(lastSaved.time);
    }
    else if (lastSaved?.status === "connection_restored") {
      // Connection was restored - clear error state from header
      setPollCount(1);
      if (lastSaved.time) {
        setLastSuccessfulSaveTime(lastSaved.time);
        latestUpdate = { status: t('header.latest-save'), time: lastSaved.time };
      } else if (lastSuccessfulSaveTime) {
        latestUpdate = { status: t('header.latest-save'), time: lastSuccessfulSaveTime };
      } else {
        latestUpdate = { status: t('header.edit-menu-no-save'), time: "" };
      }
    }
    else if (lastSaved?.status === "") {
      setPollCount(1);
      if (lastSuccessfulSaveTime) {
        latestUpdate = { status: t('header.latest-save'), time: lastSuccessfulSaveTime };
      } else {
        latestUpdate = { status: t('header.edit-menu-no-save'), time: "" };
      }
    }
    if (latestUpdate) {
      setUpdateTime(latestUpdate);
    }
  }, [lastSaved]);

  const navigateBack = () => {
    let path = history.location.pathname;
    path = path.replace('/edit', '');
    history.push(path);
  };
  const saveStatusText = isConnectionRestored && updateTime?.status === t('header.edit-menu-save-fail')
    ? ''
    : `${updateTime?.status}${updateTime?.time}`;
  return (
    <div className={'edit-page-header' + ((!currentEnv || currentEnv === 'production') ? '' : ' edit-header-dev')}>
      <Navigation
        label="navigation"
        skipTo='#main'
        skipToContentLabel={t('header.skip-to-content')}
      >
        <Navigation.Row variant="inline" ariaLabel={t('header.edit-menu-back')}>
          <Button onClick={navigateBack} role="link" variant="supplementary" size="small" iconLeft={<IconAngleLeft />}>{t('header.edit-menu-back')}</Button>
          <div className='edit-page-title'>
            <div><p>{title}</p></div>
            <div className='phase-section'>
              <span>{phaseTitle}</span>
              <span className='divider'>/</span>
              <span>{sectionTitle}</span>
            </div>
          </div>
          <div className={'edit-page-save ' + lastSaved?.status}>
            <div className='spinner-container' ref={spinnerRef}>
              <LoadingSpinner className="loading-spinner" small theme={{ '--spinner-color': '#0000BF' }}></LoadingSpinner>
              <span className="loading-spinner">{lastSaved?.status === "error" ? t('messages.connect-again') : ""}</span>
            </div>
            <div className='icons-container-flex'>
              {!saving && !isPollingConnection && updateTime?.status === t('header.latest-save') ? <IconCheck className='check-icon' /> : ""}
              {!saving && !isPollingConnection && updateTime?.status === t('header.edit-menu-save-fail') && !isConnectionRestored ? (
                <> <IconErrorFill className='error-icon' /> <p className="error">{updateTime?.status}</p> </>
              ) : (
                !isPollingConnection && <p>{saveStatusText}</p>
              )}
              {!saving && !isPollingConnection && updateTime?.status === t('header.edit-menu-save-fail') && lastSuccessfulSaveTime ?
                <Tooltip placement="bottom" className='question-icon'>{t('header.latest-save')}{lastSuccessfulSaveTime}</Tooltip> : ""
              }
            </div>
          </div>
        </Navigation.Row>
      </Navigation>
    </div>
  );
};

EditPageHeader.propTypes = {
  location: PropTypes.object,
  pollConnection: PropTypes.func,
  title: PropTypes.string,
  currentSectionIndex: PropTypes.number
};

export default EditPageHeader;