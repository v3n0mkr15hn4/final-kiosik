/**
 * supabaseSync.js — direct Supabase REST for submissions + offline queue drain.
 *
 * Adds a cloud sync path alongside the existing Express /service-requests
 * route. Falls back to the existing IndexedDB offline queue (offline.js)
 * whenever Supabase is unreachable or not configured.
 * Auto-syncs on network restore.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { savePendingSubmission, syncPendingSubmissions, isOnline } from './offline';
import { generateRequestId } from './helpers';

/**
 * Submit a service request (new connection, complaint, etc.) to Supabase.
 * Falls back to the existing offline queue if Supabase isn't configured,
 * unreachable, or the device is offline.
 */
export async function submitToSupabase(formData) {
  const trackingId = formData.trackingId || generateRequestId();
  const payload = {
    tracking_id: trackingId,
    org: formData.org || 'general',
    ref_id: formData.refId || trackingId,
    receipt_type: formData.receiptType || 'service_request',
    consumer_name: formData.name || formData.consumerName || '',
    submitted_at: new Date().toISOString(),
    form_data: formData,
  };

  if (!isSupabaseConfigured() || !isOnline()) {
    await savePendingSubmission({ ...payload, _type: 'submission' });
    return { success: true, trackingId, offline: true };
  }

  try {
    const { error } = await supabase.from('submissions').insert([payload]);
    if (error) throw error;
    return { success: true, trackingId, offline: false };
  } catch {
    await savePendingSubmission({ ...payload, _type: 'submission' });
    return { success: true, trackingId, offline: true };
  }
}

/**
 * Track a request by trackingId or mobile number via Supabase.
 * Falls back to localStorage receipts if Supabase unreachable.
 */
export async function trackViaSupabase({ trackingId, mobile }) {
  if (!isSupabaseConfigured() || !isOnline()) {
    const receipts = JSON.parse(localStorage.getItem('kiosk_receipts') || '[]');
    const matches = receipts.filter((r) =>
      (trackingId && r.trackingId === trackingId) ||
      (mobile && r.ownerMobile === mobile)
    );
    return { results: matches, offline: true };
  }

  try {
    let query = supabase.from('submissions').select('*');
    if (trackingId) query = query.eq('tracking_id', trackingId);
    if (mobile) query = query.eq('form_data->>mobile', mobile);
    const { data, error } = await query.order('submitted_at', { ascending: false }).limit(10);
    if (error) throw error;
    return { results: data || [], offline: false };
  } catch {
    return { results: [], offline: true };
  }
}

/**
 * Create a QR upload token. Online only — token must be readable by the
 * citizen's mobile device for the document-upload flow.
 */
export async function createUploadToken({ trackingId, org }) {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const token = crypto.randomUUID ? crypto.randomUUID() : `tok-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase.from('upload_tokens').insert([{
    token, tracking_id: trackingId, org, expires_at: expiresAt, used: false,
  }]);
  if (error) throw error;
  return { token, expiresAt };
}

/**
 * Drain the existing offline IndexedDB queue → Supabase when network restores.
 * Call once on app load + on 'online' event.
 */
export async function drainOfflineQueueToSupabase() {
  if (!isSupabaseConfigured() || !isOnline()) return { synced: 0, failed: 0 };
  return syncPendingSubmissions(async (submission) => {
    const { error } = await supabase.from('submissions').insert([{
      tracking_id: submission.tracking_id,
      org: submission.org,
      ref_id: submission.ref_id,
      receipt_type: submission.receipt_type,
      consumer_name: submission.consumer_name,
      submitted_at: submission.submitted_at,
      form_data: submission.form_data,
    }]);
    if (error) throw error;
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    drainOfflineQueueToSupabase().then(({ synced }) => {
      if (synced > 0) console.log(`[SupabaseSync] Synced ${synced} offline submissions`);
    });
  });
}
