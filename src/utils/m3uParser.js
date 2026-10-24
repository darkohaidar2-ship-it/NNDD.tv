/**
 * DABIN.tv - Intelligent M3U Line & Xtream Credentials Auto-Parser
 * 
 * Automatically parses various IPTV M3U / Xtream link formats:
 * - http://line.liondnscloud.ru:80/get.php?username=292c8215&password=adef5d6e&type=m3u_plus&output=ts
 * - http://line.liondnscloud.ru:80/live/292c8215/adef5d6e/1234.ts
 * - http://line.liondnscloud.ru:80/player_api.php?username=292c8215&password=adef5d6e
 * - line.liondnscloud.ru:80:292c8215:adef5d6e
 */

export function parseM3uUrl(rawInput = '') {
  const result = {
    isValid: false,
    serverUrl: 'http://line.liondnscloud.ru:80',
    username: '',
    password: '',
    output: 'ts',
    type: 'm3u_plus',
    raw: (rawInput || '').trim()
  };

  if (!rawInput || typeof rawInput !== 'string') return result;
  const str = rawInput.trim();

  // Pattern 1: Standard /get.php or /player_api.php with query parameters
  if (str.includes('get.php') || str.includes('player_api.php') || (str.includes('username=') && str.includes('password='))) {
    try {
      // Ensure protocol is present
      const fullUrl = str.startsWith('http://') || str.startsWith('https://') ? str : `http://${str}`;
      const urlObj = new URL(fullUrl);
      
      const host = `${urlObj.protocol}//${urlObj.host}`;
      const username = urlObj.searchParams.get('username') || '';
      const password = urlObj.searchParams.get('password') || '';
      const output = urlObj.searchParams.get('output') || (str.includes('.m3u8') ? 'm3u8' : 'ts');
      const type = urlObj.searchParams.get('type') || 'm3u_plus';

      if (username && password) {
        return {
          isValid: true,
          serverUrl: host,
          username,
          password,
          output,
          type,
          raw: str
        };
      }
    } catch (e) {}
  }

  // Pattern 2: Stream path format: http://host:port/live/username/password/stream_id.ts
  const liveRegex = /(https?:\/\/[^\/]+)\/(?:live|movie|series)\/([^\/\s]+)\/([^\/\s]+)/i;
  const liveMatch = str.match(liveRegex);
  if (liveMatch) {
    return {
      isValid: true,
      serverUrl: liveMatch[1],
      username: liveMatch[2],
      password: liveMatch[3],
      output: str.endsWith('.m3u8') ? 'm3u8' : 'ts',
      type: 'm3u_plus',
      raw: str
    };
  }

  // Pattern 3: Colon separated: host:port:username:password OR host:username:password
  const parts = str.split(':').map(p => p.trim());
  if (parts.length >= 3) {
    if (parts.length === 4 && /^\d+$/.test(parts[1])) {
      // host:port:user:pass
      return {
        isValid: true,
        serverUrl: `http://${parts[0]}:${parts[1]}`,
        username: parts[2],
        password: parts[3],
        output: 'ts',
        type: 'm3u_plus',
        raw: str
      };
    } else if (parts.length === 3) {
      // host:user:pass
      return {
        isValid: true,
        serverUrl: parts[0].startsWith('http') ? parts[0] : `http://${parts[0]}`,
        username: parts[1],
        password: parts[2],
        output: 'ts',
        type: 'm3u_plus',
        raw: str
      };
    }
  }

  return result;
}
