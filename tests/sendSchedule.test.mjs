import test from 'node:test'
import assert from 'node:assert/strict'
import { drivers } from '../src/data/drivers.js'
import { driverPlans, loads, locations } from '../src/data/operationsSeed.js'
import { buildDriverDay } from '../src/domain/manifest/driverDayModel.js'
import {
  canEditDispatchPlan,
  dispatchPlanReadiness,
  sendDispatchPlan,
} from '../src/domain/planning/dispatchPlan.js'

const marcus = drivers.find((driver) => driver.id === 'marcus-reed')
const seedDay = buildDriverDay({
  driver: marcus,
  loads,
  plan: driverPlans[marcus.id],
  locations,
})

test('draft plan readiness blocks sending until staging is confirmed', () => {
  const readiness = dispatchPlanReadiness(seedDay)

  assert.equal(readiness.status, 'blocked')
  assert.equal(readiness.canSend, false)
  assert.ok(readiness.blockers.some((message) => /staging location/i.test(message)))
  assert.ok(
    seedDay.planHealth.blockerIssues.some((issue) => (
      issue.id === 'staging-location-missing'
      && issue.stopId === 'marcus-reed:staging'
    )),
  )
})

test('a clean draft can be sent and becomes non-editable', () => {
  const cleanDay = {
    ...seedDay,
    planHealth: {
      ...seedDay.planHealth,
      status: 'ready',
      blockers: [],
      warnings: [],
      blockerIssues: [],
      warningIssues: [],
    },
  }

  const result = sendDispatchPlan({
    driverId: marcus.id,
    driverPlans,
    driverDay: cleanDay,
  })

  assert.equal(result.ok, true)
  assert.equal(result.driverPlans[marcus.id].dispatchStatus, 'sent')
  assert.equal(result.driverPlans[marcus.id].sentWithWarnings, false)
  assert.equal(result.driverPlans[marcus.id].sentWarningCount, 0)
  assert.equal(canEditDispatchPlan(result.driverPlans[marcus.id]), false)
})

test('warnings require SEND ANYWAY before schedule state changes', () => {
  const warningDay = {
    ...seedDay,
    planHealth: {
      ...seedDay.planHealth,
      status: 'warning',
      blockers: [],
      warnings: ['M-202 delivery is projected 12 min late.'],
      blockerIssues: [],
      warningIssues: [{
        id: 'appointment-late:M-202:delivery',
        message: 'M-202 delivery is projected 12 min late.',
        stopId: 'M-202:delivery',
      }],
    },
  }

  const firstAttempt = sendDispatchPlan({
    driverId: marcus.id,
    driverPlans,
    driverDay: warningDay,
  })

  assert.equal(firstAttempt.ok, false)
  assert.equal(firstAttempt.requiresWarningOverride, true)
  assert.equal(driverPlans[marcus.id].dispatchStatus, 'draft')

  const override = sendDispatchPlan({
    driverId: marcus.id,
    driverPlans,
    driverDay: warningDay,
    allowWarnings: true,
  })

  assert.equal(override.ok, true)
  assert.equal(override.driverPlans[marcus.id].dispatchStatus, 'sent')
  assert.equal(override.driverPlans[marcus.id].sentWithWarnings, true)
  assert.equal(override.driverPlans[marcus.id].sentWarningCount, 1)
})

test('sent plans cannot be sent again through the draft dispatch action', () => {
  const sentPlans = {
    ...driverPlans,
    [marcus.id]: {
      ...driverPlans[marcus.id],
      dispatchStatus: 'sent',
    },
  }
  const cleanDay = {
    ...seedDay,
    planHealth: {
      ...seedDay.planHealth,
      status: 'ready',
      blockers: [],
      warnings: [],
    },
  }

  const result = sendDispatchPlan({
    driverId: marcus.id,
    driverPlans: sentPlans,
    driverDay: cleanDay,
  })

  assert.equal(result.ok, false)
  assert.match(result.reason, /not an editable draft/)
})
