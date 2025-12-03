import { useEffect, useRef } from 'react';

function getLineNameFromClassName(className) {
  if (!className) return '';

  let label = '';
  let number = '';

  if (className.includes('esillaolo')) {
    label = 'Esilläolo';
  } else if (className.includes('nahtavillaolo')) {
    label = 'Nähtävilläolo';
  } else if (className.includes('lautakunta')) {
    label = 'Lautakunta';
  } else {
    label = className.charAt(0).toUpperCase() + className.slice(1).replaceAll('_', ' ');
  }

  const numMatch = className.match(/_(\d+)$/);
  if (numMatch && numMatch[1] !== '1') {
    number = ' - ' + numMatch[1];
  }

  return label + number;
}

function formatDateRange(start, end, isBoard) {
  if (!start) return '';
  const startDate = new Date(start).toLocaleDateString("fi-FI");
  if (end && end !== start && !isBoard) {
    const endDate = new Date(end).toLocaleDateString("fi-FI");
    return `Päivämääräväli: ${startDate} - ${endDate}`;
  }
  return `Päivämäärä: ${startDate}`;
}

function getPhaseTooltipHTML(item) {
  const header = `Vaihe: ${item.phaseName || item.group || ''}`;
  const dateStr = formatDateRange(item.start, item.end, item.className?.includes('board'));
  return `
    <div class="tooltip-header">${header}</div>
    ${dateStr ? dateStr + '<br>' : ''}
  `;
}

function getItemTooltipHTML(item, parentClassName) {
  const header = item.groupInfo || '';
  const dateStr = formatDateRange(item.start, item.end, item.className?.includes('board'));
  const lineName = parentClassName ? `Rivin nimi: ${getLineNameFromClassName(parentClassName)}` : '';
  const phaseName = item.phaseName ? `Vaiheen nimi: ${item.phaseName}` : '';
  return `
    <div class="tooltip-header">${header}</div>
    ${dateStr ? dateStr + '<br>' : ''}
    ${lineName ? lineName + '<br>' : ''}
    ${phaseName}
  `;
}

export function useTimelineTooltip() {
  const tooltipRef = useRef(null);

  useEffect(() => {
    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'vis-tooltip';
    tooltipDiv.style.display = 'none';
    document.body.appendChild(tooltipDiv);
    tooltipRef.current = tooltipDiv;

    return () => {
      if (tooltipDiv) tooltipDiv.remove();
    };
  }, []);

  const showTooltip = (event, item, parentClassName) => {
    if (!tooltipRef.current) return;

    const isPhase = item.phase === true;
    tooltipRef.current.innerHTML = isPhase
      ? getPhaseTooltipHTML(item)
      : getItemTooltipHTML(item, parentClassName);

    tooltipRef.current.style.display = 'block';
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const offsetY = 20;
    tooltipRef.current.style.left = `${event.pageX - tooltipWidth / 2}px`;
    tooltipRef.current.style.top = `${event.pageY + offsetY}px`;
  };

  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
      tooltipRef.current.className = 'vis-tooltip';
    }
  };

  return { showTooltip, hideTooltip };
}