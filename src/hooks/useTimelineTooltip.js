import { useEffect, useRef } from 'react';

/**
 * Extracts and formats line name from CSS class name
 * Handles special cases for phase detail rows (_1 suffix)
 * @param {string} className - CSS class name to parse
 * @returns {string} Formatted line name
 */
function getLineNameFromClassName(className) {
  if (!className) return '';

  // Phase detail rows (_1 suffix) always show generic label
  if (className.endsWith('_1') || className.includes('_1 ')) {
    return 'Vaiheen lisätiedot';
  }

  // Known phase type mappings (handles both with and without umlauts)
  const phaseTypeLabels = new Map([
    ['kaynnistys', 'Käynnistys'],
    ['käynnistys', 'Käynnistys'],
    ['voimaantulo', 'Voimaantulo'],
    ['hyvaksyminen', 'Hyväksyminen'],
    ['hyväksyminen', 'Hyväksyminen'],
    ['esillaolo', 'Esilläolo'],
    ['nahtavillaolo', 'Nähtävilläolo'],
    ['lautakunta', 'Lautakunta']
  ]);

  // Try to find matching phase type in className
  let label = '';
  for (const [key, value] of phaseTypeLabels) {
    if (className.includes(key)) {
      label = value;
      break;
    }
  }

  // Fallback: capitalize first letter and format
  if (!label) {
    label = className.charAt(0).toUpperCase() + className.slice(1).replaceAll('_', ' ');
  }

  // Extract number suffix (e.g., "_2", "_3") but not "_1"
  const lastUnderscore = className.lastIndexOf('_');
  if (lastUnderscore !== -1) {
    const numberPart = className.slice(lastUnderscore + 1);
    if (numberPart !== '1' && !Number.isNaN(Number(numberPart))) {
      return `${label} - ${numberPart}`;
    }
  }

  return label;
}

// UI constants for tooltip positioning
const UI_CONSTANTS = {
  LEFT_PANEL_WIDTH: 310,
  TOOLTIP_RIGHT_MARGIN: 20,
  LINE_ELEMENT_HEIGHT: 24,
  PHASE_ELEMENT_OFFSET: 2,
  NORMAL_ELEMENT_OFFSET: 8,
  LINE_ELEMENT_MAX_HEIGHT: 20
};

/**
 * Formats a date range for display in Finnish locale
 * @param {string|Date} start - Start date
 * @param {string|Date} end - End date
 * @param {boolean} isBoard - Whether this is a board element
 * @returns {string} Formatted date string
 */
function formatDateRange(start, end, isBoard) {
  if (!start) return '';
  const startDate = new Date(start).toLocaleDateString("fi-FI");
  if (end && end !== start && !isBoard) {
    const endDate = new Date(end).toLocaleDateString("fi-FI");
    return `Päivämääräväli: ${startDate} - ${endDate}`;
  }
  return `Päivämäärä: ${startDate}`;
}

/**
 * Generates HTML content for phase tooltips
 * @param {Object} item - Phase item data
 * @returns {string} HTML string for tooltip
 */
function getPhaseTooltipHTML(item) {
  const header = `Vaihe: ${item.phaseName || item.group || ''}`;
  const dateStr = formatDateRange(item.start, item.end, item.className?.includes('board'));
  return `
    <div class="tooltip-header">${header}</div>
    ${dateStr ? dateStr + '<br>' : ''}
  `;
}

/**
 * Generates HTML content for item tooltips
 * @param {Object} item - Item data
 * @param {string} parentClassName - Parent element class name
 * @returns {string} HTML string for tooltip
 */
function getItemTooltipHTML(item, parentClassName) {
  // Use groupInfo if available, otherwise derive from parentClassName
  const lineNameFromClass = getLineNameFromClassName(parentClassName);
  const header = item.groupInfo || lineNameFromClass || '';
  const dateStr = formatDateRange(item.start, item.end, item.className?.includes('board'));
  const lineName = lineNameFromClass ? `Rivin nimi: ${lineNameFromClass}` : '';
  const phaseName = item.phaseName ? `Vaiheen nimi: ${item.phaseName}` : '';
  return `
    <div class="tooltip-header">${header}</div>
    ${dateStr ? dateStr + '<br>' : ''}
    ${lineName ? lineName + '<br>' : ''}
    ${phaseName}
  `;
}

// Tooltip timing configuration (in milliseconds)
const TOOLTIP_DELAYS = {
  SHOW: 500,  // Delay before showing tooltip
  HIDE: 500   // Delay before hiding tooltip after leaving
};

/**
 * Custom hook for managing timeline tooltips with hover delays and positioning
 * Implements best practices:
 * - 500ms show/hide delays for better UX
 * - Hoverable tooltips that don't disappear when moused over
 * - Smart positioning that avoids clipping
 * - Locked position once visible (no jitter)
 * @returns {Object} Tooltip control functions
 */
export function useTimelineTooltip() {
  const tooltipRef = useRef(null);
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const currentItemRef = useRef(null); // Currently displayed item
  const currentPositionRef = useRef({ x: 0, y: 0 }); // Latest cursor position
  const currentElementRef = useRef(null); // DOM element being hovered
  const isOverTooltipRef = useRef(false); // Track if mouse is over tooltip
  const isOverElementRef = useRef(false); // Track if mouse is over element
  const isTooltipLockedRef = useRef(false); // Lock tooltip position when visible

  // Define scheduleHide before useEffect so it can be referenced in cleanup
  /**
   * Schedules tooltip to hide after delay
   * Will not hide if mouse is still over element or tooltip
   */
  const scheduleHide = () => {
    // Clear show timeout if it exists
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    // If already scheduled or if still over element/tooltip, don't schedule hide
    if (hideTimeoutRef.current || isOverElementRef.current || isOverTooltipRef.current) {
      return;
    }

    // Schedule hiding after delay
    hideTimeoutRef.current = setTimeout(() => {
      // Double-check we're not over element or tooltip before hiding
      if (!isOverElementRef.current && !isOverTooltipRef.current && tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
        tooltipRef.current.className = 'vis-tooltip';
        currentItemRef.current = null;
        isTooltipLockedRef.current = false;
      }
      hideTimeoutRef.current = null;
    }, TOOLTIP_DELAYS.HIDE);
  };

  useEffect(() => {
    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'vis-tooltip';
    tooltipDiv.style.display = 'none';
    tooltipDiv.style.pointerEvents = 'auto'; // Make tooltip hoverable
    document.body.appendChild(tooltipDiv);
    tooltipRef.current = tooltipDiv;

    // Add mouse enter/leave handlers to tooltip
    const handleTooltipEnter = () => {
      isOverTooltipRef.current = true;
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    const handleTooltipLeave = () => {
      isOverTooltipRef.current = false;
      scheduleHide();
    };

    tooltipDiv.addEventListener('mouseenter', handleTooltipEnter);
    tooltipDiv.addEventListener('mouseleave', handleTooltipLeave);

    return () => {
      if (tooltipDiv) {
        tooltipDiv.removeEventListener('mouseenter', handleTooltipEnter);
        tooltipDiv.removeEventListener('mouseleave', handleTooltipLeave);
        tooltipDiv.remove();
      }
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  /**
   * Calculates horizontal position preventing clipping
   */
  const calculateTooltipLeft = (elementCenterX, tooltipWidth) => {
    let tooltipLeft = elementCenterX + window.pageXOffset - tooltipWidth / 2;
    const minLeft = UI_CONSTANTS.LEFT_PANEL_WIDTH + window.pageXOffset;

    // Get the timeline container to calculate right boundary
    const timelineContainer = document.querySelector('.vis-timeline');
    const containerRight = timelineContainer
      ? timelineContainer.getBoundingClientRect().right
      : window.innerWidth;
    const maxRight = containerRight + window.pageXOffset - UI_CONSTANTS.TOOLTIP_RIGHT_MARGIN;

    // Prevent clipping on the left (panel)
    if (tooltipLeft < minLeft) {
      tooltipLeft = minLeft;
    }

    // Prevent clipping on the right (container edge)
    if (tooltipLeft + tooltipWidth > maxRight) {
      tooltipLeft = maxRight - tooltipWidth;
    }

    return tooltipLeft;
  };

  /**
   * Updates tooltip position relative to cursor or element
   * @param {number} pageX - Mouse X coordinate
   @param {number} pageY - Mouse Y coordinate
   * @param {HTMLElement|null} elementDOM - Optional element to anchor tooltip to
   */
  const updateTooltipPosition = (pageX, pageY, elementDOM = null) => {
    if (!tooltipRef.current) return;
  
    const tooltipWidth = tooltipRef.current.offsetWidth;
  
    // If we have the element DOM, position tooltip below the element center
    if (elementDOM) {
      const rect = elementDOM.getBoundingClientRect();
      let elementCenterX = rect.left + rect.width / 2;
    
      // Check if element is clipped by left panel - use visible center instead
      if (rect.left < UI_CONSTANTS.LEFT_PANEL_WIDTH) {
        // Element is partially under the panel, center on visible portion
        const visibleLeft = Math.max(rect.left, UI_CONSTANTS.LEFT_PANEL_WIDTH);
        const visibleWidth = rect.right - visibleLeft;
        elementCenterX = visibleLeft + visibleWidth / 2;
      }
    
      // Determine the bottom position based on element type
      let elementBottom = rect.bottom;
    
      // For line/range elements (thin height), use consistent height with dot elements
      const isLineElement = elementDOM.classList.contains('vis-range') && 
                           !elementDOM.classList.contains('phase-element') &&
                           rect.height < UI_CONSTANTS.LINE_ELEMENT_MAX_HEIGHT;
      
      if (isLineElement) {
        // Normalize line element height to match dot elements for consistent positioning
        const elementMiddleY = rect.top + rect.height / 2;
        elementBottom = elementMiddleY + UI_CONSTANTS.LINE_ELEMENT_HEIGHT / 2;
      }
    
      // Use smaller offset for phase elements to keep tooltip close
      const isPhaseElement = elementDOM.classList.contains('phase-holder') || 
                            elementDOM.classList.contains('phase-element');
      const offsetY = isPhaseElement ? UI_CONSTANTS.PHASE_ELEMENT_OFFSET : UI_CONSTANTS.NORMAL_ELEMENT_OFFSET;
    
      const tooltipLeft = calculateTooltipLeft(elementCenterX, tooltipWidth);
    
      tooltipRef.current.style.left = `${tooltipLeft}px`;
      tooltipRef.current.style.top = `${elementBottom + window.pageYOffset + offsetY}px`;
    } else {
      // Fallback to cursor position when element is not available
      tooltipRef.current.style.left = `${pageX - tooltipWidth / 2}px`;
      tooltipRef.current.style.top = `${pageY + UI_CONSTANTS.NORMAL_ELEMENT_OFFSET}px`;
    }
  };

  /**
   * Schedules tooltip to show after delay
   * If tooltip already visible for different item, updates immediately
   * @param {Event} event - Mouse event
   * @param {Object} item - Item data to display
   * @param {string} parentClassName - Parent element class name
   * @param {HTMLElement|null} elementDOM - DOM element to anchor tooltip to
   */
  const scheduleShow = (event, item, parentClassName, elementDOM = null) => {
    // Store the current cursor position and element
    currentPositionRef.current = { x: event.pageX, y: event.pageY };
    currentElementRef.current = elementDOM;

    // Clear any existing timeouts
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    isOverElementRef.current = true;

    // If tooltip is already showing, update it immediately for the new item
    if (tooltipRef.current?.style?.display === 'block') {
      // Different item - update content and position immediately
      if (currentItemRef.current !== item) {
        currentItemRef.current = item;
        const isPhase = item.phase === true;
        tooltipRef.current.innerHTML = isPhase
          ? getPhaseTooltipHTML(item)
          : getItemTooltipHTML(item, parentClassName);
        
        // Update position based on element and keep it locked
        updateTooltipPosition(event.pageX, event.pageY, elementDOM);
        isTooltipLockedRef.current = true;
      }
      return;
    }

    currentItemRef.current = item;

    // Schedule showing the tooltip after delay for better UX
    showTimeoutRef.current = setTimeout(() => {
      if (!tooltipRef.current || !isOverElementRef.current) return;

      const isPhase = item.phase === true;
      tooltipRef.current.innerHTML = isPhase
        ? getPhaseTooltipHTML(item)
        : getItemTooltipHTML(item, parentClassName);

      tooltipRef.current.style.display = 'block';
      
      // Position tooltip at the element position and lock it
      updateTooltipPosition(currentPositionRef.current.x, currentPositionRef.current.y, currentElementRef.current);
      isTooltipLockedRef.current = true;
      
      showTimeoutRef.current = null;
    }, TOOLTIP_DELAYS.SHOW);
  };

  const onElementEnter = (event, item, parentClassName, elementDOM = null) => {
    scheduleShow(event, item, parentClassName, elementDOM);
  };

  const onElementMove = (event, item, elementDOM = null) => {
    // Always update the current position and element
    currentPositionRef.current = { x: event.pageX, y: event.pageY };
    currentElementRef.current = elementDOM;
    
    // Only update tooltip position if it's visible and NOT locked
    if (tooltipRef.current?.style?.display === 'block' && currentItemRef.current === item && !isTooltipLockedRef.current) {
      updateTooltipPosition(event.pageX, event.pageY, elementDOM);
    }
  };

  const onElementLeave = () => {
    isOverElementRef.current = false;
    isTooltipLockedRef.current = false; // Unlock when leaving element
    scheduleHide();
  };

  const hideTooltip = () => {
    // Immediate hide (for drag operations, etc.)
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    isOverElementRef.current = false;
    isOverTooltipRef.current = false;
    currentItemRef.current = null;
    isTooltipLockedRef.current = false;

    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
      tooltipRef.current.className = 'vis-tooltip';
    }
  };

  return { onElementEnter, onElementMove, onElementLeave, hideTooltip };
}