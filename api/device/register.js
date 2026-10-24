import { setZeroCacheHeaders, getDeviceByMac, upsertDevice, normalizeMac } from '../_lib.js';

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
    const { 
      mac_address, 
      device_key, 
      customer_name = '', 
      customer_phone = '',
      device_model = 'Smart TV / Android Box',
      device_ip = ''
    } = body;

    if (!mac_address) {
      return res.status(400).json({ error: 'Missing mac_address parameter' });
    }

    const normMac = normalizeMac(mac_address);
    const existing = await getDeviceByMac(normMac);

    if (existing) {
      // Device already registered - update online presence
      const updated = await upsertDevice({
        ...existing,
        is_online: true,
        last_active: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'Device already registered',
        isNew: false,
        device: {
          id: updated.id,
          mac_address: updated.mac_address,
          device_key: updated.device_key,
          status: updated.status,
          app_expiry_date: updated.app_expiry_date,
          is_online: true
        }
      });
    }

    // Generate random 4-digit device PIN key if not provided
    const pin = device_key || Math.floor(1000 + Math.random() * 9000).toString();

    const newDevice = await upsertDevice({
      mac_address: normMac,
      device_key: pin,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      server_url: 'http://line.liondnscloud.ru:80',
      xtream_user: '',
      xtream_pass: '',
      app_expiry_date: null,
      panel_expiry_date: null,
      status: 'pending_activation',
      is_online: true,
      last_active: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Device registered successfully. Waiting for Admin activation.',
      isNew: true,
      device: {
        id: newDevice.id,
        mac_address: newDevice.mac_address,
        device_key: newDevice.device_key,
        status: 'pending_activation',
        app_expiry_date: null
      }
    });

  } catch (err) {
    console.error('[API /device/register error]:', err);
    return res.status(500).json({ error: err.message });
  }
}
