import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DISPATCH_PLAN_STATUS,
  canEditDispatchPlan,
  dispatchPlanStatusLabel,
  normalizeDispatchPlanStatus,
  sendDispatchPlan,
} from '../src/domain/planning/dispatchPlan.js'

test('dispatch plans default to draft until explicitly sent', () => {
  assert.equal(normalizeDispatchPlanStatus({}), DISPATCH_PLAN_STATUS.DRAFT)
  assert.equal(normalizeDispatchPlanStatus({ dispatchStatus: 'draft' }), DISPATCH_PLAN_STATUS.DRAFT)
  assert.equal(normalizeDispatchPlanStatus({ dispatchStatus: 'sent' }), DISPATCH_PLAN_STATUS.SENT)
})

test('only draft dispatch plans are editable', () => {
  assert.equal(canEditDispatchPlan({ dispatchStatus: 'draft' }), true)
  assert.equal(canEditDispatchPlan({ dispatchStatus: 'sent' }), false)
})

test('dispatch plan labels distinguish draft and sent truth', () => {
  assert.equal(dispatchPlanStatusLabel({ dispatchStatus: 'draft' }), 'DRAFT PLAN')
  assert.equal(dispatchPlanStatusLabel({ dispatchStatus: 'sent' }), 'SENT PLAN')
})


test('sending a Driver Day stamps the actual simulation send time without changing scheduled shift truth', () => {
  const result = sendDispatchPlan({
    driverId: 'taylor-brooks',
    driverPlans: {
      'taylor-brooks': {
        dispatchStatus: 'draft',
        shift: { startMinutes: 450, endMinutes: 1020 },
      },
    },
    driverDay: {
      driverId: 'taylor-brooks',
      planHealth: {
        blockers: [],
        warnings: [],
      },
    },
    sentAtMinutes: 486,
    sentAtDayNumber: 1,
  })

  assert.equal(result.ok, true)
  assert.equal(result.driverPlans['taylor-brooks'].dispatchStatus, 'sent')
  assert.equal(result.driverPlans['taylor-brooks'].sentAtMinutes, 486)
  assert.equal(result.driverPlans['taylor-brooks'].sentAtDayNumber, 1)
  assert.equal(result.driverPlans['taylor-brooks'].shift.startMinutes, 450)
})
