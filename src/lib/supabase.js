import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key ? createClient(url, key) : null
export const hasSupabase = Boolean(supabase)

export const fromPropertyRow = (row) => ({
  id: row.id, title: row.title, area: row.area, city: row.city, state: row.state, zip: row.zip,
  images: row.images || [], weeklyPrice: Number(row.weekly_price), biweeklyPrice: Number(row.biweekly_price),
  monthlyPrice: Number(row.monthly_price), deposit: Number(row.security_deposit), applicationFee: Number(row.application_fee),
  holdDeposit: Number(row.hold_deposit_cents) / 100, roomType: row.room_type, availability: row.availability,
  earliestMoveInDate: row.earliest_move_in_date, amenities: row.amenities || [], description: row.description,
  rating: Number(row.rating), featured: row.featured, latitude: Number(row.latitude), longitude: Number(row.longitude), status: row.status,
})

export const toPropertyRow = (property) => ({
  id: property.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  title: property.title, area: property.area, city: property.city, state: property.state, zip: property.zip,
  images: property.images, weekly_price: Number(property.weeklyPrice), biweekly_price: Number(property.biweeklyPrice),
  monthly_price: Number(property.monthlyPrice), security_deposit: Number(property.deposit), application_fee: Number(property.applicationFee),
  room_type: property.roomType, availability: property.availability, earliest_move_in_date: property.earliestMoveInDate || null,
  amenities: property.amenities, description: property.description, rating: Number(property.rating), featured: property.featured,
  latitude: property.latitude ? Number(property.latitude) : null, longitude: property.longitude ? Number(property.longitude) : null,
  status: property.status,
})
