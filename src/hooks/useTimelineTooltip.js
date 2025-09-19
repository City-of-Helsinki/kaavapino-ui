import { useEffect, useRef } from 'react';

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

  // Use this only for timeline items (not for static left panel)
  const showTooltip = (event, item, tooltipText = "", customClass = "") => {
    if (!tooltipRef.current) return;
    const offsetX = 150;
    tooltipRef.current.style.display = 'block';
    tooltipRef.current.style.left = `${event.pageX - offsetX}px`;
    tooltipRef.current.style.top = `${event.pageY + 20}px`;
    tooltipRef.current.className = `vis-tooltip${customClass ? " " + customClass : ""}`;
    tooltipRef.current.innerHTML = `
      ${tooltipText ? `<strong>${tooltipText}</strong><br>` : ""}
      Vaihe: ${item?.phaseName || ''} <br>
      ${item?.groupInfo ? "Nimi: " + item?.groupInfo + " <br>" : ""}
      ${item?.start ? "Päivämäärä: " + new Date(item?.start).toLocaleDateString() : ""}
      ${item?.start && item?.end && !item?.className?.includes('board') ? " - " + new Date(item?.end).toLocaleDateString() : ""}
    `;
  };

  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
      tooltipRef.current.className = 'vis-tooltip'; // Reset to default
    }
  };

  return { showTooltip, hideTooltip };
}