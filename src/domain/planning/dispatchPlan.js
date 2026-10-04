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

export function dispatchPlanReadiness(day = {}) {
  const blockers = day?.planHealth?.blockers ?? []
  const warnings = day?.planHealth?.warnings ?? []

  return {
    status: blockers.length ? 'blocked' : warnings.length ? 'warning' : 'ready',
    blockers,
    warnings,
    canSend: blockers.length === 0,
    requiresWarningOverride: blockers.length === 0 && warnings.length > 0,
  }
}

export function sendDispatchPlan({
  driverId,
  driverPlans = {},
  driverDay,
  allowWarnings = false,
} = {}) {
  const plan = driverPlans[driverId]
  if (!plan || !driverDay || !canEditDispatchPlan(plan)) {
    return { ok: false, reason: 'This Driver Day is not an editable draft.' }
  }

  const readiness = dispatchPlanReadiness(driverDay)
  if (!readiness.canSend) {
    return {
      ok: false,
      reason: readiness.blockers[0] ?? 'Resolve plan blockers before sending.',
      readiness,
    }
  }

  if (readiness.requiresWarningOverride && !allowWarnings) {
    return {
      ok: false,
      reason: 'This plan has warnings that require explicit confirmation.',
      readiness,
      requiresWarningOverride: true,
    }
  }

  return {
    ok: true,
    readiness,
    driverPlans: {
      ...driverPlans,
      [driverId]: {
        ...plan,
        dispatchStatus: DISPATCH_PLAN_STATUS.SENT,
        sentWithWarnings: readiness.warnings.length > 0,
        sentWarningCount: readiness.warnings.length,
      },
    },
  }
}
