const TEST_NUMBERS = new Set(['+14049513737', '+918958875538'])
const DOSSY_NUMBER = '+14049513737'

export function normalizePhone(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const digits = text.replace(/\D/g, '')
  if (!digits) return ''
  if (text.startsWith('+')) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return `+${digits}`
}

function toolCallsFrom(call) {
  const messages = [...(call.messages || []), ...(call.artifact?.messages || [])]
  const calls = []
  for (const message of messages) {
    for (const toolCall of message.toolCalls || message.tool_calls || []) {
      const fn = toolCall.function || toolCall
      calls.push({ id: toolCall.id || `${fn.name}:${fn.arguments}`, name: fn.name || '', arguments: fn.arguments || '' })
    }
  }
  return [...new Map(calls.map((item) => [item.id, item])).values()]
}

function hasAppointmentTool(toolCalls) {
  return toolCalls.some(({ name }) => /create.*appointment|appointment.*create/i.test(name))
}

function hasDossyTransfer(call, toolCalls) {
  if (normalizePhone(call.forwardedPhoneNumber) === DOSSY_NUMBER) return true
  if ((call.artifact?.transfers || []).some((transfer) => normalizePhone(transfer.destination?.number || transfer.number) === DOSSY_NUMBER)) return true
  return toolCalls.some(({ name, arguments: args }) => /transfer.*dossy/i.test(name) || (/transfer/i.test(name) && String(args).replace(/\D/g, '').includes('14049513737')))
}

function reviewedCategory({ booked, transferred, outcome, endedReason, callbackRequested, interested }) {
  const value = String(outcome || '').toLowerCase().replace(/[\s-]+/g, '_')
  if (booked) return 'appointment_booked'
  if (value.includes('not_interested')) return 'not_interested'
  if (value.includes('callback') || callbackRequested) return 'callback_requested'
  if (value.includes('incomplete') || /error|failed|silence|technical/i.test(String(endedReason || ''))) return 'incomplete_technical'
  if (value.includes('interested') || interested === true) return 'interested_not_booked'
  if (transferred || value.includes('transfer')) return 'transferred'
  return 'other_unclear'
}

export function mapVapiCall(call) {
  const structured = call.analysis?.structuredData || {}
  const toolCalls = toolCallsFrom(call)
  const caller = normalizePhone(call.customer?.number || call.customerNumber)
  const transferred = hasDossyTransfer(call, toolCalls)
  const booked = hasAppointmentTool(toolCalls) || structured.appointmentBooked === true || structured.callOutcome === 'appointment_booked'
  const startedAt = call.startedAt || call.createdAt || new Date().toISOString()
  const endedAt = call.endedAt || null
  const duration = endedAt ? Math.max(0, Math.round((new Date(endedAt) - new Date(startedAt)) / 1000)) : 0
  const customerName = structured.fullName || [structured.firstName, structured.lastName].filter(Boolean).join(' ') || call.customer?.name || null

  return {
    id: call.id,
    assistant_id: call.assistantId || null,
    phone_number_id: call.phoneNumberId || null,
    call_type: call.type || null,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds: duration,
    caller_number: caller || null,
    customer_name: customerName,
    status: call.status || null,
    ended_reason: call.endedReason || null,
    cost: Number(call.cost || 0),
    raw_outcome: structured.callOutcome || null,
    reviewed_category: reviewedCategory({ booked, transferred, outcome: structured.callOutcome, endedReason: call.endedReason, callbackRequested: structured.callbackRequested, interested: structured.interested }),
    is_test: TEST_NUMBERS.has(caller),
    appointment_booked: booked,
    appointment_requested: structured.appointmentRequested === true,
    appointment_date_text: structured.appointmentDate || null,
    appointment_time_text: structured.appointmentTime || null,
    interested: typeof structured.interested === 'boolean' ? structured.interested : null,
    callback_requested: structured.callbackRequested === true,
    transferred_to_dossy: transferred,
    summary: call.summary || call.analysis?.summary || null,
    transcript: call.transcript || call.artifact?.transcript || null,
    recording_url: call.recordingUrl || call.artifact?.recordingUrl || call.artifact?.stereoRecordingUrl || null,
    structured_data: structured,
    raw_data: { toolCalls, transfers: call.artifact?.transfers || [], forwardedPhoneNumber: call.forwardedPhoneNumber || null },
    source: 'vapi',
    vapi_created_at: call.createdAt || null,
    vapi_updated_at: call.updatedAt || null,
    synced_at: new Date().toISOString(),
  }
}

export const callReportingRules = { testNumbers: [...TEST_NUMBERS], dossyNumber: DOSSY_NUMBER }
