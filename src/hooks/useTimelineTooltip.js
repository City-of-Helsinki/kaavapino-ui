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
    // fallback: capitalize first letter, replace underscores with spaces
    label = className.charAt(0).toUpperCase() + className.slice(1).replace(/_/g, ' ');
  }

  // Try to find a number at the end (e.g. _2)
  const numMatch = className.match(/_(\d+)$/);
  if (numMatch && numMatch[1] !== '1') {
    number = ' - ' + numMatch[1];
  }

  return label + number;
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

  // Show tooltip for timeline items
  const showTooltip = (event, item, parentClassName) => {
    if (!tooltipRef.current) return;

    let isPhase = item.phase === true;
    let header = '';
    let dateStr = '';
    let lineName = '';
    let phaseName = '';

    if (isPhase) {
      header = `Vaihe: ${item.phaseName || item.group || ''}`;
      if (item.start) {
        const startDate = new Date(item.start).toLocaleDateString("fi-FI");
        if (item.end && item.end !== item.start && !item.className?.includes('board')) {
          const endDate = new Date(item.end).toLocaleDateString("fi-FI");
          dateStr = `Päivämääräväli: ${startDate} - ${endDate}`;
        } else {
          dateStr = `Päivämäärä: ${startDate}`;
        }
      }
      tooltipRef.current.innerHTML = `
        <div class="tooltip-header">${header}</div>
        ${dateStr ? dateStr + '<br>' : ''}
      `;
    } else {
      header = item.groupInfo || '';
      if (item.start) {
        const startDate = new Date(item.start).toLocaleDateString("fi-FI");
        if (item.end && item.end !== item.start && !item.className?.includes('board')) {
          const endDate = new Date(item.end).toLocaleDateString("fi-FI");
          dateStr = `Päivämääräväli: ${startDate} - ${endDate}`;
        } else {
          dateStr = `Päivämäärä: ${startDate}`;
        }
      }
      lineName = parentClassName ? `Rivin nimi: ${getLineNameFromClassName(parentClassName)}` : '';
      phaseName = item.phaseName ? `Vaiheen nimi: ${item.phaseName}` : '';

      tooltipRef.current.innerHTML = `
        <div class="tooltip-header">${header}</div>
        ${dateStr ? dateStr + '<br>' : ''}
        ${lineName ? lineName + '<br>' : ''}
        ${phaseName}
      `;
    }

    tooltipRef.current.style.display = 'block';
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const offsetY = 20;
    tooltipRef.current.style.left = `${event.pageX - tooltipWidth / 2}px`;
    tooltipRef.current.style.top = `${event.pageY + offsetY}px`;
  };

  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
      tooltipRef.current.className = 'vis-tooltip'; // Reset to default
    }
  };

  return { showTooltip, hideTooltip };
}