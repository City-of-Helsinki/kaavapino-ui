export const START = 'Käynnistys'
export const OAS = 'OAS'
export const DRAFT = 'Luonnos'
export const PRINCIPLES = 'Periaatteet'
export const PROPOSITION = 'Ehdotus'
export const CHECKED_PROPOSITION = 'Tarkistettu ehdotus'
export const ACCEPTANCE = 'Hyväksyminen'
export const INCEPTION = 'Voimaantulo'

export const START_COLOR = 'start_color'
export const OAS_COLOR = 'OAS_color'
export const DRAFT_COLOR = 'draft_color'
export const PRINCIPLES_COLOR = 'principles_color'
export const PROPOSITION_COLOR = 'proposition_color'
export const CHECKED_PROPOSITION_COLOR = 'checked_proposition_color'
export const ACCEPTANCE_COLOR = 'acceptance_color'
export const INCEPTION_COLOR = 'inception_color'

export const NAME = 'name'

export const getSubtypeChartData = chartData => {
  const returnValue = []

  if (!chartData || !chartData.subtypes) {
    return null
  }

  let startColor
  let oasColor
  let draftColor
  let principlesColor
  let propositionColor
  let checkPropositionColor
  let acceptanceColor
  let inceptionColor

  chartData.subtypes.forEach(subtype => {
    const start = getPhaseData(subtype.phases, START)
    const oas = getPhaseData(subtype.phases, OAS)
    const draft = getPhaseData(subtype.phases, DRAFT)
    const principles = getPhaseData(subtype.phases, PRINCIPLES)
    const proposition = getPhaseData(subtype.phases, PROPOSITION)
    const checkedProposition = getPhaseData(subtype.phases, CHECKED_PROPOSITION)
    const acceptance = getPhaseData(subtype.phases, ACCEPTANCE)
    const inception = getPhaseData(subtype.phases, INCEPTION)

    if (!startColor) {
      startColor = start && start.color
    }
    if (!oasColor) {
        oasColor = oas && oas.color
    }
    if (!draftColor) {
        draftColor = draft && draft.color
    }
    if (!principlesColor) {
        principlesColor = principles && principles.color
    }
    if (!propositionColor) {
        propositionColor = proposition && proposition.color
    }
    if (!checkPropositionColor) {
        checkPropositionColor = checkedProposition && checkedProposition.color
    }
    if (!acceptanceColor) {
        acceptanceColor = acceptance && acceptance.color
    }
    if (!inceptionColor) {
        inceptionColor = inception && inception.color
    }

    returnValue.push({
      [NAME]: subtype.name,
      [START]: start.project_count,
      [OAS]: oas.project_count,
      [DRAFT]: draft.project_count,
      [PRINCIPLES]: principles.project_count,
      [PROPOSITION]: proposition.project_count,
      [CHECKED_PROPOSITION]: checkedProposition.project_count,
      [ACCEPTANCE]: acceptance.project_count,
      [INCEPTION]: inception.project_count
    })
  })

  const returnObject = {
    [START_COLOR]: startColor,
    [OAS_COLOR]: oasColor,
    [ACCEPTANCE_COLOR]: acceptanceColor,
    [PROPOSITION_COLOR]: propositionColor,
    [PRINCIPLES_COLOR]: principlesColor,
    [CHECKED_PROPOSITION_COLOR]: checkPropositionColor,
    [INCEPTION_COLOR]: inceptionColor,
    [DRAFT_COLOR]: draftColor,
    phases: returnValue
  }
  return returnObject

}

export const getPhaseData = (phases, currentName) => {
  if (!phases) {
    return null
  }

  const foundValue = phases.find(phase => phase.name === currentName)

  return foundValue
    ? { project_count: foundValue.project_count, color: foundValue.color_code }
    : { project_count: 0, color: '' }
}
