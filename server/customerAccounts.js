export async function ensureCustomerAccount(db, email, fullName) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return null

  const { data: existing } = await db.from('profiles').select('id').eq('email', normalizedEmail).maybeSingle()
  if (existing?.id) return existing.id

  const { data, error } = await db.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    user_metadata: { full_name: String(fullName || '').trim() || undefined },
  })
  if (data?.user?.id) return data.user.id
  if (error) {
    const { data: concurrent } = await db.from('profiles').select('id').eq('email', normalizedEmail).maybeSingle()
    if (concurrent?.id) return concurrent.id
    throw error
  }
  return null
}
