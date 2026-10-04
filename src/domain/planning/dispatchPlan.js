export const DISPATCH_PLAN_STATUS = Object.freeze({
  DRAFT: 'draft',
  SENT: 'sent',
})

export function normalizeDispatchPlanStatus(plan = {}) {
  return plan?.dispatchStatus === DISPATCH_PLAN_STATUS.SENT
    ? DISPATCH_PLAN_STATUS.SENT
    : DISPATCH_PLAN_STATUS.DRAFT
}

export function dispatchPlanStatusLabel(plan = {}) {
  return normalizeDispatchPlanStatus(plan) === DISPATCH_PLAN_STATUS.SENT
    ? 'SENT PLAN'
    : 'DRAFT PLAN'
}

export function canEditDispatchPlan(plan = {}) {
  return normalizeDispatchPlanStatus(plan) === DISPATCH_PLAN_STATUS.DRAFT
}
