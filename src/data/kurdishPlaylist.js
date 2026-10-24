// KOBIN TV Official Base Channel Template (Channel 1 Only - All other channels imported from upstream server)
export const KURDISH_PLAYLIST_CHANNELS = [
  {
    "number": 1,
    "id": "ch-dabin-tv-custom",
    "tvgId": "KobinTV.iq",
    "name": "KOBIN TV HD",
    "nameEn": "KOBIN TV HD",
    "nameKu": "کەناڵی کۆبین تیڤی HD",
    "category": "KOBIN TV",
    "url": "custom://kobin-broadcast",
    "backupUrl": "custom://kobin-broadcast",
    "logo": "/kobin-logo.png",
    "fallbackLogo": "/kobin-logo.png",
    "isCustomDabinChannel": true,
    "quality": "1080p FHD",
    "is4K": false,
    "isLocked": false,
    "isFavorite": true,
    "serverId": "srv-kobin-official",
    "description": "کەناڵی فەرمی KOBIN TV HD - پەخشی فەرمی پلاتفۆرمی کۆبین تیڤی",
    "epg": {
      "currentShow": "پەخشی فەرمی KOBIN TV HD",
      "nextShow": "بەرنامەکانی کۆبین تیڤی",
      "timeSlot": "24/7",
      "progress": 50
    },
    "xtreamSearchAliases": [
      "kobin",
      "kobin tv",
      "کۆبین",
      "dabin",
      "dabin tv"
    ]
  }
];

export const INITIAL_CHANNEL_COUNT = KURDISH_PLAYLIST_CHANNELS.length;
