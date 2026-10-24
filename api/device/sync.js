import { 
  setZeroCacheHeaders, 
  getDeviceByMac, 
  upsertDevice, 
  normalizeMac, 
  pingLionOtt, 
  sendTelegramAlert,
  getClientIp
} from '../_lib.js';

export default async function handler(req, res) {
  setZeroCacheHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { mac_address } = body;

    if (!mac_address) {
      return res.status(400).json({ error: 'Missing mac_address parameter' });
    }

    const clientIp = getClientIp(req);
    const normMac = normalizeMac(mac_address);
    let device = await getDeviceByMac(normMac);

    if (!device) {
      // Auto-register device on first heartbeat if not in database
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      device = await upsertDevice({
        mac_address: normMac,
        ip_address: clientIp,
        device_key: pin,
        customer_name: body.model || 'Smart Device',
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
        authorized: false,
        status: 'pending_activation',
        mac_address: normMac,
        device_key: pin,
        ip_address: clientIp,
        app_expiry_date: null,
        message: 'ئامێرەکەت تۆمارکرا و چاوەڕوانی چالاککردنە لەلایەن بەڕێوەبەر.'
      });
    }

    // Always update last_active, is_online, and model name if missing
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const resolvedName = device.customer_name || body.model || 'Smart Device';

    // Check device status
    if (device.status === 'banned') {
      await upsertDevice({ ...device, ip_address: clientIp, customer_name: resolvedName, is_online: true, last_active: nowIso });
      return res.status(403).json({
        authorized: false,
        status: 'banned',
        message: 'ئەم ئامێرە ڕاگیراوە (Banned). تکایە پەیوەندی بە پاڵپشتییەوە بکە.'
      });
    }

    if (device.status === 'pending_activation' || !device.xtream_user || !device.xtream_pass) {
      await upsertDevice({ ...device, ip_address: clientIp, customer_name: resolvedName, is_online: true, last_active: nowIso });
      return res.status(200).json({
        authorized: false,
        status: 'pending_activation',
        mac_address: normMac,
        device_key: device.device_key,
        app_expiry_date: device.app_expiry_date,
        message: 'ئەم ئامێرە چاوەڕوانی دیاریکردنی هێڵی سێرڤەرە لەلایەن بەڕێوەبەر.'
      });
    }

    // Check customer 1-year app expiration date
    const appExpiryMs = device.app_expiry_date ? new Date(device.app_expiry_date).getTime() : 0;
    const isAppExpired = appExpiryMs > 0 && appExpiryMs < nowMs;

    if (isAppExpired) {
      const updated = await upsertDevice({
        ...device,
        status: 'expired',
        is_online: true,
        last_active: nowIso
      });

      return res.status(200).json({
        authorized: false,
        status: 'expired',
        mac_address: normMac,
        app_expiry_date: device.app_expiry_date,
        message: 'ماوەی بەشداربوونەکەت بەسەرچووە. تکایە بۆ نوێکردنەوە پەیوەندی بکە.'
      });
    }

    // =========================================================================
    // SMART CREDIT-SAVING ENGINE (Upstream Real-Time Verification)
    // =========================================================================
    // 1. Check panel_expiry_date (1-month internal tracker)
    const panelExpiryMs = device.panel_expiry_date ? new Date(device.panel_expiry_date).getTime() : 0;
    const isPanelDbExpired = panelExpiryMs > 0 && panelExpiryMs < nowMs;

    // 2. Query upstream LionOTT server player_api.php in real-time
    const upstream = await pingLionOtt(device.xtream_user, device.xtream_pass, device.server_url);

    const isUpstreamExpired = !upstream.success || upstream.isExpired || !upstream.isStatusActive;

    // Customer still has valid 1-year app subscription, but 1-month LionOTT line is dead!
    if (isPanelDbExpired || isUpstreamExpired) {
      const updated = await upsertDevice({
        ...device,
        status: 'needs_panel_renewal',
        is_online: true,
        last_active: nowIso
      });

      // Trigger Telegram Alert
      const customerInfo = device.customer_name ? `${device.customer_name} (${device.mac_address})` : device.mac_address;
      const phoneInfo = device.customer_phone ? `\n📱 WhatsApp: ${device.customer_phone}` : '';
      const appExpStr = device.app_expiry_date ? new Date(device.app_expiry_date).toLocaleDateString('en-GB') : '1 Year Active';

      const alertMsg = `🚨 <b>URGENT: Active Customer Just Opened DABIN.tv!</b>\n\n` +
        `👤 <b>Customer:</b> ${customerInfo}${phoneInfo}\n` +
        `📺 <b>MAC:</b> <code>${device.mac_address}</code>\n` +
        `⚠️ <b>Issue:</b> 1-Month LionOTT Line Expired!\n` +
        `📅 <b>Customer App Expiry:</b> ${appExpStr}\n` +
        `⚡ <b>Action Required:</b> Renew 0.1 credit on LionOTT Panel now!`;

      sendTelegramAlert(alertMsg).catch(() => {});

      return res.status(200).json({
        authorized: false,
        status: 'needs_panel_renewal',
        mac_address: normMac,
        app_expiry_date: device.app_expiry_date, // Customer sees their full 1-year date
        message: 'سێرڤەر لە حاڵی نوێکردنەوەدایە، تکایە چەند چرکەیەک چاوەڕوان بە...'
      });
    }

    // Everything is active & valid!
    await upsertDevice({
      ...device,
      status: 'active',
      is_online: true,
      last_active: nowIso
    });

    return res.status(200).json({
      authorized: true,
      status: 'active',
      mac_address: normMac,
      device_key: device.device_key,
      app_expiry_date: device.app_expiry_date, // 1-year date shown to client
      // panel_expiry_date is strictly hidden from client!
      server_url: device.server_url || 'http://line.liondnscloud.ru:80',
      xtream_user: device.xtream_user,
      xtream_pass: device.xtream_pass,
      server_info: {
        active_connections: upstream.activeConnections || 0,
        max_connections: upstream.maxConnections || 1
      }
    });

  } catch (err) {
    console.error('[API /device/sync error]:', err);
    return res.status(500).json({ error: err.message });
  }
}
