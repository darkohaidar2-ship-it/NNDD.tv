import xtreamHandler from '../../xtream.js';

export default async function handler(req, res) {
  // Extract dynamic parameters from Vercel query
  const { mac_address, action } = req.query;
  return xtreamHandler(req, res);
}
