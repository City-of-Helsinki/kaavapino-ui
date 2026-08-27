import { isGroupConfirmed } from '../../utils/projectUtils';
import { isGroupAfterLockedGroup } from '../../utils/timeUtil';
import { t } from 'i18next';


const createGroupContainer = (group, props) => {
  const {timelineInstanceRef, timelineRef, pendingGroupFocusIdRef } = props;
  const container = document.createElement("div");
  container.classList.add("timeline-buttons-container");
  container.setAttribute("tabindex", group?.nestedGroups === undefined ? "-1" : "0");
  container.id = `timeline-group-${group.id}`;

  // Hover effect
  container.addEventListener("mouseenter", function () {
    container.classList.add("show-buttons");
  });
  container.addEventListener("mouseleave", function () {
    if (!container.contains(document.activeElement)) {
      container.classList.remove("show-buttons");
    }
  });
  container.addEventListener("focusin", function () {
    container.classList.add("show-buttons");
  });
  container.addEventListener("focusout", function (event) {
    if (!container.contains(event.relatedTarget)) {
      container.classList.remove("show-buttons");
    }
  });

  if (group?.nestedGroups !== undefined) {
    container.ariaLabel = t('deadlines.aria.toggle-phase-rows', { phase: group.content });
    container.onkeydown = function (e) {
      if ((e.key === "Enter" || e.key === " ") && !(document.activeElement.id.includes("add-button"))) {
        e.preventDefault();
        const itemSet = timelineInstanceRef.current?.itemSet;
        const itemSetGroup = itemSet.groups[group.id];
        itemSet.toggleGroupShowNested(itemSetGroup);
        pendingGroupFocusIdRef.current = container.id;
        const focusAfterRender = () => {
          const focusEl = timelineRef.current?.querySelector(`[id="${pendingGroupFocusIdRef.current}"]`);
          if (focusEl) {
            focusEl.focus();
            pendingGroupFocusIdRef.current = null;
          }
        };
        requestAnimationFrame(() => requestAnimationFrame(focusAfterRender));
      }
    };
  }

  return container;
};

const createTopLevelLabel = (group, container) => {
  const label = document.createElement("label");
  label.innerHTML = group.content + " ";
  label.htmlFor = container.id;
  return label;
};

const createAddButton = (group, props) => {
  const { handleAddButtonClick: onClick, visValuesRef, phaseList, currentPhaseIndex } = props;
  const phaseClosed = phaseList.indexOf(group.content) < currentPhaseIndex;
  const add = document.createElement("button");
  add.id = `add-button-${group.id}`;
  add.classList.add("timeline-add-button");
  add.style.fontSize = "small";
  // Disable add-button if phase is closed
  let addTooltipDiv = null;
  if (phaseClosed) {
    add.classList.add("button-disabled");
    addTooltipDiv = `<div class='timeline-add-text'>${t('deadlines.phase-closed')}</div>`;
  } else {
    add.classList.remove("button-disabled");
  }
  add.addEventListener("click", function (event) {
    if (add.classList.contains("button-disabled")) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick(visValuesRef.current, group, event);
  });
  return { add, addTooltipDiv };
};

const createNestedLabel = (group, props) => {
  const { formatContent } = props;
  // Get, format and add labels
  const label = document.createElement("label");
  label.classList.add("timeline-button-label");

  const formattedContent = formatContent(group.content, false);
  label.innerHTML = formattedContent + " ";
  return label;
};

const createEditButton = (group, container, props) => {
  const { openDialog } = props;
  const edit = document.createElement("button");
  edit.id = `edit-button-${group.id}`;

  edit.classList.add("timeline-edit-button");
  edit.style.fontSize = "small";
  edit.ariaLabel = t('deadlines.aria.toggle-group-form', { group: group.content });

  edit.addEventListener("click", function () {
    openDialog(group, container);
  });
  return edit;
};

const getRemoveDisabledState = (group, props) => {
  const { currentTimelineLockRef, visValuesRef, t, deadlineSections, phaseList, currentPhaseIndex } = props;
  const getNum = k => {
    const m = k.match(/_(\.d+)$/);
    return m ? Number.parseInt(m[1], 10) : 1;
  };

  const isPhaseClosed = (phase) => phaseList.includes(phase) && phaseList.indexOf(phase) < currentPhaseIndex;
  const isPhaseEnded = isPhaseClosed(group.nestedInGroup);
  const groupNum = getNum(group.deadlinegroup);
  const isFirst = groupNum === 1;
  const isConfirmed = isGroupConfirmed(group.deadlinegroup, visValuesRef?.current || {});
  let removeExplanation = "";
  let groupType = group.content.includes("Esilläolo") ? "esillaolo" : null;
  groupType = group.content.includes("Nahtavillaolo") ? "nahtavillaolo" : groupType;
  groupType = group.content.includes("Lautakunta") ? "lautakunta" : groupType;

  let isDisabled = false;

  if (isPhaseEnded) {
    removeExplanation = t('deadlines.delete-phase-closed');
    isDisabled = true;
  } else if (isConfirmed) {
    removeExplanation = groupType ? t(`deadlines.delete-confirmed-${groupType}`) : t('deadlines.delete-confirmed');
    isDisabled = true;
  } else if (isFirst) {
    const isEhdotusXL = group?.nestedInGroup === "Ehdotus" && visValuesRef.current?.kaavaprosessin_kokoluokka === "XL";
    const isLautakunta = groupType === "lautakunta";
    if (
      group?.nestedInGroup !== "Periaatteet" &&
      group?.nestedInGroup !== "Luonnos" &&
      !(isEhdotusXL && isLautakunta)
    ) {
      removeExplanation = t(`deadlines.delete-first-${groupType}`);
      isDisabled = true;
    }
  }
  if (isGroupAfterLockedGroup(currentTimelineLockRef?.current, group.deadlinegroup, deadlineSections)) {
    removeExplanation = t('deadlines.delete-locked');
    isDisabled = true;
  }
  return { isDisabled, removeExplanation };
}

const createRemoveButton = (group, props) => {
  const { openRemoveDialog: onClick } = props;
  const remove = document.createElement("button");
  remove.id = `remove-button-${group.id}`;
  remove.classList.add("timeline-remove-button");
  remove.dataset.groupName = group.deadlinegroup;
  remove.style.fontSize = "small";

  const { isDisabled, removeExplanation } = getRemoveDisabledState(group, props);
  if (isDisabled) {
    remove.classList.add("button-disabled");
  }

  const removeTextDiv = removeExplanation ? `<div class='timeline-remove-text'>${removeExplanation}</div>` : null;

  remove.addEventListener("click", function () {
    if (!remove.classList.contains("button-disabled")) {
      onClick(group);
    }
  });
  return { remove, removeTextDiv };
};

const createLockButton = (group, props) => {
  const { currentTimelineLockRef, groups, handleLockElement: onClick } = props;
  const lock = document.createElement("button");
  lock.classList.add("timeline-lock-button");
  lock.style.fontSize = "small";

  if (currentTimelineLockRef.current) {
    if (group.deadlinegroup === currentTimelineLockRef.current) {
      lock.classList.add("lock");
    } else {
      lock.classList.add("button-disabled");
    }
  }
  lock.addEventListener("click", function () {
    if (lock.classList.contains("button-disabled")) return;

    const isCurrentlyLocked = lock.classList.contains("lock");
    const allLockButtons = document.querySelectorAll(".timeline-lock-button");
    allLockButtons.forEach(btn => {
      btn.classList.remove("lock", "button-disabled");
    });

    if (!isCurrentlyLocked) {
      lock.classList.add("lock");
      allLockButtons.forEach(btn => {
        if (btn !== lock) btn.classList.add("button-disabled");
      });
    }

    // Dispatches lock action
    onClick(group);

    // Use the known next lock value rather than waiting for the ref to update after dispatch
    const nextLock = isCurrentlyLocked ? null : group.deadlinegroup;
    const propsWithNextLock = { ...props, currentTimelineLockRef: { current: nextLock } };
    const allRemoveButtons = document.querySelectorAll(".timeline-remove-button");
    const groupList = groups.get();
    allRemoveButtons.forEach(btn => {
      const groupName = btn.dataset.groupName;
      const btnGroup = groupList.find(g => g.deadlinegroup === groupName);
      if (!btnGroup) {
        return;
      }
      const { isDisabled } = getRemoveDisabledState(btnGroup, propsWithNextLock);
      if (isDisabled) {
        btn.classList.add("button-disabled");
        const removeTextDiv = `<div class='timeline-remove-text'>${t('deadlines.delete-locked')}</div>`;
        if (!btn.nextElementSibling?.classList.contains("timeline-remove-text")) {
          btn.insertAdjacentHTML("afterEnd", removeTextDiv);
        }
      } else {
        btn.classList.remove("button-disabled");
        if (btn.nextElementSibling?.classList.contains("timeline-remove-text")) {
          btn.nextElementSibling.remove();
        }
      }
    });


  });
  return lock;
};


/**
 * @typedef {Object} GroupTemplateProps
 * @property {React.RefObject} timelineInstanceRef
 * @property {React.RefObject} timelineRef
 * @property {React.RefObject} pendingGroupFocusIdRef
 * @property {boolean} allowedToEdit
 * @property {string[]} phaseList
 * @property {number} currentPhaseIndex
 * @property {React.RefObject} visValuesRef
 * @property {React.RefObject} currentTimelineLockRef
 * @property {Function} formatContent
 * @property {Function} handleAddButtonClick
 * @property {Function} openDialog
 * @property {Function} openRemoveDialog
 * @property {Function} handleLockElement
 * @property {Object[]} deadlineSections
 * @property {Object} groups
 */

/**
 * Creates html elements for timeline groups (shown in left side of timeline view)
 * Including labels and buttons for editing, adding, removing and locking groups
 * Called by vis.js timeline library for each group every time the timeline is rendered
 * @param {GroupTemplateProps} props
 */
export const createGroupTemplate = (props) => {
  const { allowedToEdit } = props;
  return function groupTemplate(group) {

    if (group === null) {
      return;
    }

    const container = createGroupContainer(group, props);

    //Don't show buttons in these groups
    const stringsToCheck = ["Käynnistys", "Hyväksyminen", "Voimaantulo", "Vaiheen kesto"];
    const contentIncludesString = stringsToCheck.some(str => group?.content.includes(str));

    if (group?.nestedGroups !== undefined && allowedToEdit && !contentIncludesString) {
      // Top-level group element with nested groups
      const label = createTopLevelLabel(group, container);
      container.insertAdjacentElement("afterBegin", label);

      const { add, addTooltipDiv } = createAddButton(group, props);

      container.insertAdjacentElement("beforeEnd", add);

      if (addTooltipDiv) {
        add.insertAdjacentHTML("afterEnd", addTooltipDiv);
      }
      return container;
    } else if (group?.nestedInGroup) {
      // Nested group element with edit, remove and lock buttons
      const label = createNestedLabel(group, props);
      container.insertAdjacentElement("afterBegin", label);

      const edit = createEditButton(group, container, props);
      label.htmlFor = edit.id;
      container.insertAdjacentElement("beforeEnd", edit);

      if (allowedToEdit && !contentIncludesString) {
        const { remove, removeTextDiv } = createRemoveButton(group, props);
        container.insertAdjacentElement("beforeEnd", remove);

        if (remove.classList.contains("button-disabled") && removeTextDiv) {
          container.insertAdjacentHTML("beforeEnd", removeTextDiv);
        }
        const lock = createLockButton(group, props);
        container.insertAdjacentElement("beforeEnd", lock);
      }
      return container;
    } else {
      // Plain label without buttons
      const label = document.createElement("label");
      label.htmlFor = container.id;
      label.classList.add("timeline-phase-label");
      label.innerHTML = group?.content + " ";
      container.insertAdjacentElement("afterBegin", label);
      return container;
    }
  };
};
