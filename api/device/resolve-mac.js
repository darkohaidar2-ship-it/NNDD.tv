import {
  setZeroCacheHeaders,
  getClientIp,
  getDeterministicMacForIp,
  getDeviceByIp,
  getDeviceByMac,
  upsertDevice,
  normalizeMac
} from '../_lib.js';

/**
 * DABIN.TV / KOBIN.Tv - Deterministic IP-Bound Reinstall-Proof MAC Resolver
 * 
 * Binds device MAC address directly to the mobile / client IP address.
 * Even if the user deletes/uninstalls the app and reinstalls it, the MAC
 * address remains 100% identical and automatically persists in the Admin Panel!
 */
export default async function handler(req, res) {
  setZeroCacheHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const clientIp = getClientIp(req);
    
    // Parse query params and body
    const url = new URL(req.url, 'http://localhost');
    let body = {};
    if (req.method === 'POST') {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    }

    const requestedMac = normalizeMac(body.mac_address || body.mac || url.searchParams.get('mac') || '');
    const model = (body.model || url.searchParams.get('model') || '').trim();
    const isMobileHint = Boolean(body.is_mobile || url.searchParams.get('is_mobile') === 'true' || /Android|iPhone|Mobile/i.test(req.headers['user-agent'] || ''));

    const defaultCustomerName = model || (isMobileHint ? 'Android Smartphone' : 'Smart Device');

    let matchedDevice = null;

    // 1. Check if client already has a valid MAC registered
    if (requestedMac && /^00:1A:79:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}$/i.test(requestedMac)) {
      matchedDevice = await getDeviceByMac(requestedMac);
    }

    // 2. If not found by MAC, check if a device exists for this client IP
    if (!matchedDevice && clientIp && clientIp !== '127.0.0.1') {
      matchedDevice = await getDeviceByIp(clientIp);
    }

    // 3. If device already exists, update and return it
    if (matchedDevice) {
      const updated = await upsertDevice({
        ...matchedDevice,
        ip_address: clientIp,
        customer_name: (matchedDevice.customer_name && matchedDevice.customer_name !== 'Smart Device') 
          ? matchedDevice.customer_name 
          : defaultCustomerName,
        is_online: true,
        last_active: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        is_new: false,
        mac_address: updated.mac_address,
        ip_address: clientIp,
        device: updated,
        authorized: updated.status === 'active' && Boolean(updated.xtream_user && updated.xtream_pass)
      });
    }

    // 4. Generate deterministic MAC strictly bound to this IP
    const deterministicMac = requestedMac || getDeterministicMacForIp(clientIp);
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    const newDevice = await upsertDevice({
      mac_address: deterministicMac,
      ip_address: clientIp,
      device_key: pin,
      customer_name: defaultCustomerName,
      customer_phone: '',
      server_url: 'http://line.liondnscloud.ru:80',
      xtream_user: '',
      xtream_pass: '',
      app_expiry_date: null,
      panel_expiry_date: null,
      status: 'pending_activation',
      is_online: true,
      last_active: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      is_new: true,
      mac_address: deterministicMac,
      ip_address: clientIp,
      device: newDevice,
      authorized: false,
      message: 'ئامێرەکەت بە سەرکەوتوویی لەسەر ئەم هێڵە تۆمارکرا و چاوەڕوانی چالاککردنە.'
    });

  } catch (err) {
    console.error('[API /device/resolve-mac error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
