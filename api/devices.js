import { 
  setZeroCacheHeaders, 
  getAllDevices, 
  upsertDevice, 
  deleteDeviceByMac, 
  wipeAllDevicesFromDb,
  normalizeMac,
  getClientIp
} from './_lib.js';

export default async function handler(req, res) {
  setZeroCacheHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Retrieve all registered devices
  if (req.method === 'GET') {
    try {
      const devices = await getAllDevices();
      return res.status(200).json({
        success: true,
        count: devices.length,
        devices
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message, devices: [] });
    }
  }

  // POST: Create or Update a device
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const mac = body.mac_address || body.mac;
      if (!mac) {
        return res.status(400).json({ error: 'Missing mac_address parameter' });
      }

      const clientIp = getClientIp(req);
      const device = await upsertDevice({
        ...body,
        ip_address: body.ip_address || body.deviceIp || clientIp,
        mac_address: normalizeMac(mac),
        is_online: body.is_online !== undefined ? body.is_online : true,
        last_active: new Date().toISOString()
      });

      return res.status(200).json({ success: true, device });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE: Delete single device or wipe all
  if (req.method === 'DELETE') {
    try {
      const url = new URL(req.url, 'http://localhost');
      const wipeAll = url.searchParams.get('all') === 'true';
      const macParam = url.searchParams.get('mac') || url.searchParams.get('mac_address');

      if (wipeAll) {
        await wipeAllDevicesFromDb();
        return res.status(200).json({ success: true, message: 'All devices wiped successfully' });
      }

      let targetMac = macParam;
      if (!targetMac && req.body) {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        targetMac = body.mac_address || body.mac;
      }

      if (!targetMac) {
        return res.status(400).json({ error: 'Missing mac_address parameter' });
      }

      await deleteDeviceByMac(targetMac);
      return res.status(200).json({ success: true, deleted: normalizeMac(targetMac) });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
