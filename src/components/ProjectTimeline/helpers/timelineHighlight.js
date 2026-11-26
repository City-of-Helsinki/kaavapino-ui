// Resolve identifiers against the current DOM because vis-timeline recreates groups.
// A null target clears all highlights.
export const applyTimelineHighlight = (root, target) => {
  if (!root) return;

  const deadlinegroup = typeof target?.deadlinegroup === "string"
    ? target.deadlinegroup.split(";")[0]
    : null;
  const foreground = deadlinegroup
    ? Array.from(root.querySelectorAll(".vis-foreground > .vis-group"))
      .find(el => el.classList.contains(deadlinegroup))
    : null;
  const groupContainer = target?.groupId != null
    ? Array.from(root.querySelectorAll(".timeline-buttons-container"))
      .find(el => el.id === `timeline-group-${target.groupId}`)
    : null;
  const label = groupContainer?.closest(".vis-label") || (
    target?.className
      ? Array.from(root.querySelectorAll(".vis-label.vis-nested-group"))
        .find(el => el.classList.contains(target.className))
      : null
  );

  for (const [className, elements] of [
    ["foreground-highlight", [foreground]],
    ["highlight-selected", [groupContainer, label]],
  ]) {
    root.querySelectorAll(`.${className}`).forEach(el => {
      if (!elements.includes(el)) el.classList.remove(className);
    });
    elements.forEach(el => el?.classList.add(className));
  }
};
