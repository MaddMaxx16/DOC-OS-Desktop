import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DISPATCH_PLAN_STATUS,
  canEditDispatchPlan,
  dispatchPlanStatusLabel,
  normalizeDispatchPlanStatus,
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
