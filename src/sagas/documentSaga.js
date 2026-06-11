import axios from 'axios'

import { takeLatest, put, call, all, delay } from 'redux-saga/effects'
import {
  FETCH_DOCUMENTS,
  fetchDocumentsSuccessful,
  DOWNLOAD_DOCUMENT,
  DOWNLOAD_DOCUMENT_PREVIEW,
  downloadDocumentDone
} from '../actions/documentActions'
import { error } from '../actions/apiActions'
import { documentsApi } from '../utils/api'
import { toastr } from 'react-redux-toastr'
import i18next from 'i18next'
import FileSaver from 'file-saver'
import {IconInfoCircleFill,IconCheckCircleFill,IconErrorFill} from 'hds-react'
const MAX_COUNT = 100
const INTERVAL_MILLISECONDS = 2000

export default function* documentSaga() {
  yield all([
    takeLatest(FETCH_DOCUMENTS, fetchDocumentsSaga),
    takeLatest(DOWNLOAD_DOCUMENT, downloadDocumentOfficialSaga),
    takeLatest(DOWNLOAD_DOCUMENT_PREVIEW, downloadDocumentPreviewSaga)
  ])
}

const showSuccessToast = (isProjectCard, isPreview) => {
  let title, content;
  if (isProjectCard) {
    title = i18next.t('document-loading.project-card-title');
    content = i18next.t('document-loading.project-card-loaded');
  } else {
    title = i18next.t('document-loading.ready-title');
    content = i18next.t(isPreview ? 'document-loading.document-preview-loaded' : 'document-loading.document-loaded');
  }
  toastr.success(
    title,
    content,
    { 
      showCloseButton:false, 
      closeOnToastrClick: false, 
      timeOut:5000,
      progressBar: false,
      removeOnHoverTimeOut: 0,
      removeOnHover: false,
      icon: <IconCheckCircleFill /> 
    }
  )
}

const showInfoToast = (isProjectCard, isPreview) => {
  let title, content;
  if (isProjectCard) {
    title = i18next.t('document-loading.project-card-title');
    content = i18next.t('document-loading.project-card-content');
  } else {
    title = i18next.t('document-loading.wait-title');
    content = i18next.t(isPreview ? 'document-loading.document-preview-content' : 'document-loading.document-content');
  }
  toastr.info(
    title,
    content,
    { showCloseButton: false,
      closeOnToastrClick: true,
      timeOut: 0,
      removeOnHover: false,
      removeOnHoverTimeOut: 0,
      icon: <IconInfoCircleFill />
    }
  )
}

const showErrorToast = (isProjectCard, isPreview) => {
  let title, content;
  if (isProjectCard) {
    title = i18next.t('document-loading.project-card-title');
    content = i18next.t('document-loading.project-card-error');
  } else {
    title = i18next.t('document-loading.error-title');
    content = i18next.t(isPreview ? 'document-loading.document-preview-error' : 'document-loading.document-error');
  }
  toastr.error(
    title,
    content,
    { 
      showCloseButton:false, 
      closeOnToastrClick: false, 
      timeOut:5000,
      progressBar: false,
      removeOnHoverTimeOut: 0,
      removeOnHover: false,
      icon: <IconErrorFill />
    }
  );
}

const saveFileFromResponse = (res) => {
  const fileData = res.data
  const contentDisposition = res.headers['content-disposition']
  const fileName = contentDisposition?.split('filename=')[1]
  if (fileData) {
    FileSaver.saveAs(fileData, fileName)
    return true;
  }
  return false;
}

function* fetchDocumentsSaga({ payload: projectId }) {
  try {
    const documents = yield call(documentsApi.get, { path: { id: projectId } })
    yield put(fetchDocumentsSuccessful(documents))
  } catch (e) {
    yield put(error(e))
  }
}

function* downloadDocumentOfficialSaga({ payload }) {
  yield call(downloadDocumentSaga, payload, false);
}

function* downloadDocumentPreviewSaga({ payload }) {
  yield call(downloadDocumentSaga, payload, true);
}

function* downloadDocumentSaga(payload, isPreview) {
  let res
  let isError = false
  const modifiedUrl = payload.file + '?immediate=true' + (isPreview ? '&preview=true' : '')
  yield put(downloadDocumentDone(false))
  showInfoToast(payload.projectCard, isPreview)
  try {
    res = yield call(axios.get, modifiedUrl, { responseType: 'blob' })
    if (res.status !== 200) {
      isError = true
    }
  } catch {
    isError = true
  }

  toastr.removeByType('info')

  if (isError) {
    showErrorToast(payload.projectCard, isPreview)
  } else {
    saveFileFromResponse(res) ? showSuccessToast(payload.projectCard, isPreview) : showErrorToast(payload.projectCard, isPreview);
  }
  yield put(downloadDocumentDone(true))
}

function* downloadDocumentOfficialSagaAsync({ payload }) {
  yield call(downloadDocumentSaga, payload, false);
}

function* downloadDocumentPreviewSagaAsync({ payload }) {
  yield call(downloadDocumentSaga, payload, true);
}

function* downloadDocumentSagaAsync(payload, isPreview) {
  let res
  let currentTask
  let isError = false

  let counter = 0
  const modifiedUrl = payload.file + '?immediate=false' + (isPreview ? '&preview=true' : '')
  yield put(downloadDocumentDone(false));
  showInfoToast(payload.projectCard, isPreview);
  try {
    res = yield call(axios.get, modifiedUrl);
    currentTask = res?.data ? res.data.detail : null;

    if (!currentTask && res.status !== 200) {
      isError = true;
    }
    while ((!res || res.status === 202) && !isError && counter < MAX_COUNT) {
      if (res?.status === 500) {
        isError = true;
        break;
      }
      const includeTaskUrl = payload.file + `?task=${currentTask}`;
      res = yield call(axios.get, includeTaskUrl, { responseType: 'blob' });
      counter++;
      yield delay(INTERVAL_MILLISECONDS);
    }
  } catch {
    isError = true;
  }

  toastr.removeByType('info')

  if (isError || counter === MAX_COUNT) {
    showErrorToast(payload.projectCard, isPreview)
  } else {
    saveFileFromResponse(res) ? showSuccessToast(payload.projectCard, isPreview) : showErrorToast(payload.projectCard, isPreview);
  }
  yield put(downloadDocumentDone(true))
}
