# Graph Report - NNDD TV  (2026-10-25)

## Corpus Check
- 126 files · ~522,662 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2562 nodes · 8666 edges · 123 communities (112 shown, 11 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 844 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5b8352d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 122|Community 122]]
- [[_COMMUNITY_Community 123|Community 123]]

## God Nodes (most connected - your core abstractions)
1. `log()` - 210 edges
2. `push()` - 152 edges
3. `q()` - 91 edges
4. `constructor()` - 74 edges
5. `trigger()` - 74 edges
6. `O()` - 70 edges
7. `then()` - 60 edges
8. `join()` - 60 edges
9. `t()` - 59 edges
10. `ol()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `subscribeToClientDeviceHotSwap()` --calls--> `setInterval()`  [INFERRED]
  src/data/dabinRealtimeService.js → android/app/src/main/assets/public/assets/index-B6aroFDF.js
- `pingLionOtt()` --calls--> `clearTimeout()`  [INFERRED]
  api/_lib.js → android/app/src/main/assets/public/assets/index-B6aroFDF.js
- `handler()` --calls--> `clearTimeout()`  [INFERRED]
  api/proxy.js → android/app/src/main/assets/public/assets/index-B6aroFDF.js
- `handler()` --calls--> `clearTimeout()`  [INFERRED]
  api/xtream.js → android/app/src/main/assets/public/assets/index-B6aroFDF.js
- `fetchXtreamAPI()` --calls--> `clearTimeout()`  [INFERRED]
  src/data/serverImporter.js → android/app/src/main/assets/public/assets/index-B6aroFDF.js

## Import Cycles
- None detected.

## Communities (123 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (47): appendExecutor(), audioBlocking(), calculateAppendTimeoutTime(), changeMediaPlaybackRate(), clearAssetPlayers(), clearInterstitial(), computeLatency(), createCaptionsTrack() (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (78): advanceAfterAssetEnded(), advanceAssetBuffering(), advanceInPlace(), advanceSchedule(), assetsBuffered(), attachMedia(), attachPrimary(), bufferAssetPlayer() (+70 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (64): handler(), abort(), abortInternal(), appendTimeoutHandler(), cancelCeremony(), _cancelPendingDisconnect(), cancelRefEvent(), ccENM() (+56 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (44): generateMagMacAddress(), addDeviceTransaction(), addResellerLog(), assignServerToDevice(), createNewTicket(), deleteResellerDevice(), getDomains(), getLogs() (+36 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (66): addCues(), addData(), attachTransferred(), backSpace(), bufferCreated(), ccAOF(), ccAON(), ccBS() (+58 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (65): applyRequestReport(), Au(), bf(), bl(), bu(), cl(), cm(), createRequestReport() (+57 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (61): cancelTimeout(), canPush(), channel(), clearHeartbeats(), connect(), connectionState(), connectWithFallback(), Ey() (+53 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (60): _adminDeletePasskey(), _adminListPasskeys(), _approveAuthorization(), _createCustomProvider(), createNewAbortSignal(), _createOAuthClient(), createUser(), cs() (+52 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (28): getSavedKobinSession(), KurdLocalTvApp(), PaginatedChannelGrid(), useDevice(), cacheAllChannelLogos(), clearCachedLogos(), fetchImageAsBase64(), getCachedLogo() (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (53): add(), ajax(), append(), appendParams(), batchSend(), cloneRequestState(), containedBy(), contains() (+45 more)

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (49): aa(), abortCurrentFrag(), abortRequests(), addAsGap(), backtrack(), clearElementaryStreamInfo(), dr(), filterParsedLevels() (+41 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (24): addListener(), addWindowListener(), clearAllCookies(), clearCookies(), delete(), get(), hide(), patch() (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (36): handler(), handler(), handler(), deleteCustomCategory(), deleteDeviceByMac(), fetchCloudDevices(), getAllDevices(), getCategoryOverrides() (+28 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (49): ac(), Ai(), al(), ao(), bo(), componentDidCatch(), Do(), Ei() (+41 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (42): D(), j(), A(), b(), byteLength(), c(), D(), E() (+34 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (44): _appendCues(), Bd(), blockAudio(), bufferedInfo(), bufferedRanges(), bufferFragmentData(), bufferInfo(), cacheSet() (+36 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (44): bucketLifecycleUrl(), cb(), createBucket(), createIndex(), createSignedUploadUrl(), createSignedUrl(), createSignedUrls(), deleteBucket() (+36 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (43): addStart(), assignMediaSource(), Ba(), bm(), ca(), decimalInteger(), decimalResolution(), decryptdata() (+35 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (29): ChannelManagerTab(), KURDISH_PLAYLIST_CHANNELS, classifyChannelCategory(), DEFAULT_SERVER_CONFIG, fetchSeriesEpisodes(), fetchServerCategoriesWithCounts(), fetchXtreamAPI(), getXtreamCategories() (+21 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (43): af(), ah(), bh(), br(), cf(), ch(), configureTransmuxer(), df() (+35 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (43): appendFrame(), as(), computeInitPts(), ds(), emit(), errored(), es(), fs() (+35 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (25): p(), x(), _(), bn(), _bufferInitSegment(), cn(), dw(), Hn() (+17 more)

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (34): dependencies, autoprefixer, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor/core, @capacitor/device, @distube/ytdl-core (+26 more)

### Community 23 - "Community 23"
Cohesion: 0.06
Nodes (35): addGroupId(), constructor(), createController(), createFragmentLoader(), createPlaylistLoader(), cue(), decimalFloatingPoint(), duration() (+27 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (33): _acquireLock(), _autoRefreshTokenTick(), bx(), _callRefreshToken(), _debug(), dispose(), Ex(), exchangeCodeForSession() (+25 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (22): KobinLogo, DURATION_PRESETS, DeviceActivationModal(), assignLineToDevice(), autoRegisterClientDevice(), calculateSavingsMetrics(), checkLionOttUpstream(), DEFAULT_SEED_DEVICES (+14 more)

### Community 26 - "Community 26"
Cohesion: 0.14
Nodes (33): am(), explain(), fm(), get(), getCacheAge(), getResponseHeader(), gf(), gm() (+25 more)

### Community 27 - "Community 27"
Cohesion: 0.10
Nodes (33): audioForwardBufferInfo(), canReplayCached(), checkRetryDate(), clearTrackerIfNeeded(), doTick(), doTickIdle(), exceedsMaxBuffer(), _getAudioCodec() (+25 more)

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (32): bc(), bi(), canParse(), Cc(), co(), ec(), ev(), fc() (+24 more)

### Community 29 - "Community 29"
Cohesion: 0.10
Nodes (31): afterBufferFlushed(), bufferedEnd(), checkAppendProgress(), currentTime(), detectEvictedFragments(), detectPartialFragments(), fragBuffered(), fragBufferedComplete() (+23 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (26): k(), ye(), Bt(), cp(), dt(), en(), fn(), gn() (+18 more)

### Community 31 - "Community 31"
Cohesion: 0.08
Nodes (29): audioTrack(), cr(), createTracksInGroup(), er(), findTrackId(), flushAudioIfNeeded(), getDeliveryDirectives(), getVariantIndex() (+21 more)

### Community 32 - "Community 32"
Cohesion: 0.08
Nodes (29): bandwidthEstimate(), canEstimate(), deriveNextAutoLevel(), firstAutoLevel(), getAutoLevelKey(), getBwEstimate(), getEstimate(), getEstimateTTFB() (+21 more)

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (39): c(), i(), l(), n(), r(), s(), ae(), at() (+31 more)

### Community 34 - "Community 34"
Cohesion: 0.13
Nodes (27): ac3(), audioStsd(), avc1(), box(), esds(), hdlr(), hvc1(), initSegment() (+19 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (26): Bp(), ef(), Fi(), Gd(), gi(), Hd(), Id(), Jd() (+18 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (21): alignPlaylists(), checkLiveUpdate(), checkOfflineStatus(), checkRetry(), clearTimer(), getCurrentTime(), loadingPlaylist(), loadPlaylist() (+13 more)

### Community 37 - "Community 37"
Cohesion: 0.16
Nodes (20): DabinChannelPlayer(), DabinStudioTab(), TICKER_FONTS, TICKER_SPEEDS, TICKER_STYLES, calculateCurrentBroadcastState(), DEFAULT_DABIN_BROADCAST_CONFIG, DEFAULT_TIMELINE_ITEMS (+12 more)

### Community 38 - "Community 38"
Cohesion: 0.16
Nodes (21): ICON_OPTIONS, bulkSaveCategoryOverrides(), DEFAULT_SEED_CHANNEL_OVERRIDES, DEFAULT_SEED_CUSTOM_BOUQUETS, DEFAULT_SEED_OVERRIDES, deleteChannelOverride(), deleteCustomCategory(), fetchUpstreamCategoryStreams() (+13 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (21): catch(), _clear(), clearKeyUriToKeyIdMap(), decryptAvcSample(), fetchRequest(), findBestLevel(), gateProgress(), getAvcEncryptedData() (+13 more)

### Community 40 - "Community 40"
Cohesion: 0.17
Nodes (15): A(), C(), ce(), D(), de(), fe(), me(), O() (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.09
Nodes (22): NNDD TV — تەواوی بەڵگەنامەکان و ڕێبەری زیرەکی دەستکرد (AI Context & Architecture Guide), تایبەتمەندییەکان:, ١. پوختەی پڕۆژەکە (Project Overview), ٢. مێژووی داواکارییەکانی بەکارهێنەر و یاسا چەسپاوەکان (User Requirements & Established Rules), ٣. سیستەمی چەند سێرڤەری (Multi-Server IPTV Engine), ٤. سیستەمی سینەما و زنجیرەکان (VOD & Cinema System), ٥. پێکهاتەی پەڕگەکان (Key Project Structure), ٦. فەرمانەکانی دروستکردن و دیپلۆی (Build & Deploy Commands) (+14 more)

### Community 42 - "Community 42"
Cohesion: 0.12
Nodes (20): addBufferListener(), appendChangeType(), blockUntilOpen(), bufferSnapShot(), clearBufferAppendTimeoutId(), createSourceBuffers(), executeNext(), isPending() (+12 more)

### Community 43 - "Community 43"
Cohesion: 0.11
Nodes (19): apply(), bv(), db(), filterReplacedPrimary(), getOpenApiSpec(), getStreamType(), kv(), observe() (+11 more)

### Community 44 - "Community 44"
Cohesion: 0.24
Nodes (14): approveRequest(), detectDeviceInfo(), getCanvasFingerprint(), getDeterministicHardwareSignature(), getDeterministicMacFromIp(), getDeterministicMagMacAddress(), getOrCreateDeviceIdentity(), getOrCreateDeviceKey() (+6 more)

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (15): y(), Aw(), bw(), Cw(), ew(), from(), jw(), kw() (+7 more)

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (17): adjacentTraversal(), currentLevel(), currentProgramDateTime(), followingBufferedFrag(), getBufferedAt(), getBufferedFrag(), getFragAtPos(), getLevelDetails() (+9 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (16): ad(), current(), currentOp(), dd(), getFlushOp(), isAudioBlocked(), isMSESupported(), od() (+8 more)

### Community 48 - "Community 48"
Cohesion: 0.18
Nodes (16): assertFieldSize(), _binaryDecode(), binaryEncode(), _binaryEncodeUserBroadcastPush(), decode(), decodeBroadcast(), decodePush(), decodeReply() (+8 more)

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (16): be(), da(), fl(), hl(), ia(), il(), jo(), ll() (+8 more)

### Community 50 - "Community 50"
Cohesion: 0.09
Nodes (28): ActivationRequestsTab, BouquetBuilderTab, ChannelManagerTab, DabinRealtimeAdminDashboard, DabinResellerPanel, DabinStudioTab, ICON_MAP, PermissionsWorkspace() (+20 more)

### Community 51 - "Community 51"
Cohesion: 0.12
Nodes (15): Apple TV Dark-Cinema Glassmorphic Design System (NNDD Ultra-Cinema), بەڵگەنامەی ڕیڤیوی دیزاین (/REVIEW): سیستەمی دیزاینی سینەمایی ئەپڵ تیڤی, ١. ناوی فەرمی و شێوازی دیزاینەکە (Style Nomenclature), ١٠. تەختەکلیلی ۳ زمانی مەجازی (Tri-Lingual Virtual Keyboard), ١١. کۆنترۆڵی ڕووکار و سکڕۆڵی ڕێکخستن (Settings Scale Controls & Remote Scroll), ١٢. قوفڵی لاندسکەیپی مۆبایل (Mobile Landscape Lock Floating Pill), ١٣. لۆگۆی فەرمی و شوناسی بینراوی DABIN.Tv (Official Brand Identity & Logo Standard), ٢. سیستەمی کۆد و ڕەنگەکان (Color Tokens & Semantics) (+7 more)

### Community 52 - "Community 52"
Cohesion: 0.20
Nodes (16): createNamespace(), createNamespaceIfNotExists(), createTable(), createTableIfNotExists(), dropNamespace(), dropTable(), ib(), listNamespaces() (+8 more)

### Community 53 - "Community 53"
Cohesion: 0.28
Nodes (16): ebsp2rbsp(), loadWord(), readBits(), readBoolean(), readEG(), readPPS(), readSliceType(), readSPS() (+8 more)

### Community 54 - "Community 54"
Cohesion: 0.06
Nodes (31): DABIN_OFFICIAL_CHANNEL, ensureDabinChannelFirst(), getDbItem(), loadPersistentChannels(), loadPersistentVod(), openNnddDatabase(), savePersistentChannels(), savePersistentVod() (+23 more)

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (12): background_color, categories, description, display, icons, id, name, orientation (+4 more)

### Community 56 - "Community 56"
Cohesion: 0.15
Nodes (12): background_color, categories, description, display, icons, id, name, orientation (+4 more)

### Community 57 - "Community 57"
Cohesion: 0.16
Nodes (14): an(), ap(), createLevel(), getTrackCodec(), Jn(), jp(), kn(), ln() (+6 more)

### Community 58 - "Community 58"
Cohesion: 0.19
Nodes (14): calculateOptimalSwitchPoint(), capLevelToPlayerSize(), checkFPS(), checkFPSInterval(), detectPlayerSize(), getMaxLevel(), getMaxLevelByMediaSize(), nextLevel() (+6 more)

### Community 59 - "Community 59"
Cohesion: 0.19
Nodes (13): decrypt(), decryptPayload(), demuxSampleAes(), expandKey(), getValidChunk(), logOnce(), Ni(), onWebCryptoError() (+5 more)

### Community 60 - "Community 60"
Cohesion: 0.26
Nodes (13): demux(), extractID3Track(), extractRemainingSamples(), flush(), handleFlushResult(), handlePacket(), parseAC3PES(), parseFragment() (+5 more)

### Community 61 - "Community 61"
Cohesion: 0.18
Nodes (12): attemptKeySystemAccess(), filterAndSortMediaOptions(), getKeyFormatPromise(), getKeySystemAccess(), getKeySystemForKeyPromise(), getKeySystemSelectionPromise(), getSelectedKeySystemFormats(), loadClear() (+4 more)

### Community 62 - "Community 62"
Cohesion: 0.35
Nodes (4): MainActivity, BridgeActivity, Bundle, Override

### Community 63 - "Community 63"
Cohesion: 0.18
Nodes (10): 1. Landscape Lock (قوفڵ کردنی لاند سکەیپ), 2. 5-Second Zapping Delay & Dual-Player Preload (زواپینگ بەس ٥ چرکەیی بە پلەیەر لە باکگراوند), 3. Double-Press OK for Channel Drawer (دوو جار ئۆکەی بۆ داخستنی لیستی کەناڵ), 4. Data Saver Mode (مۆدی کەم کردنەوەی مەسروفی ئینتەرنێت), 5. Tri-Lingual Virtual On-Screen Keyboard (تەختە کلیکی کوردی، ئینگلیزی و عەرەبی), 6. Dashboard 30s Sleep State to 5 Pure White Small Wave Dots (خەوتنی داشبۆرد بۆ پێنچ خاڵی سپی و وردی شەپۆل دار پاش ٣٠ چرکە), 7. PIN 0000 Lock for Channel Editing, Moving & Deletion, 8. Dashboard & Channel List Custom Scale Controls in Settings (بچووک/گەورەکردنی داشبۆرد و لیستی کەناڵەکان) (+2 more)

### Community 64 - "Community 64"
Cohesion: 0.23
Nodes (12): bs(), em(), fetchJwk(), getClaims(), resetContiguity(), resetInitialTimestamp(), resetNextTimestamp(), resetTimeStamp() (+4 more)

### Community 65 - "Community 65"
Cohesion: 0.24
Nodes (11): addKeyIdForUri(), appendBlocker(), attemptSetMediaKeys(), blockBuffers(), loadInternal(), loadKeyEME(), loadKeyHTTP(), lp() (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.24
Nodes (10): applyTransformOptsToQuery(), build(), download(), getPublicUrl(), invoke(), listBucketOptionsToQueryString(), _listOAuthClients(), listUsers() (+2 more)

### Community 67 - "Community 67"
Cohesion: 0.25
Nodes (7): appId, appName, server, allowNavigation, androidScheme, cleartext, webDir

### Community 68 - "Community 68"
Cohesion: 0.25
Nodes (7): appId, appName, server, allowNavigation, androidScheme, cleartext, webDir

### Community 69 - "Community 69"
Cohesion: 0.31
Nodes (10): _getCodeChallengeAndMethod(), _getUrlForProvider(), _handleProviderSignIn(), _maybeAppendFlowIdToRedirect(), resend(), resetPasswordForEmail(), signInWithOAuth(), signInWithOtp() (+2 more)

### Community 70 - "Community 70"
Cohesion: 0.28
Nodes (9): createInternalLoader(), _doFragLoad(), doFragPartsLoad(), load(), loadedEndOfParts(), _loadInitSegment(), loadInitSegmentIfNeeded(), onAudioTrackLoading() (+1 more)

### Community 71 - "Community 71"
Cohesion: 0.25
Nodes (8): addDirectives(), assignAssetListError(), getUrlWithDirectives(), loadAssetList(), loadSteeringManifest(), Lr(), Nr(), Rr()

### Community 72 - "Community 72"
Cohesion: 0.36
Nodes (8): cd(), createTrack(), onFragParsingMetadata(), onLevelPtsUpdated(), resetInitSegment(), updateDateRangeCues(), updateId3CueEnds(), Wd()

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (6): NNDD TV (Kurdish Live TV & Cinema Application), 🌟 تایبەتمەندییە سەرەکییەکان (Key Features), 🚀 دامەزراندن و بەگەڕخستن (Installation & Development), دروستکردنی فایلی ئەپڵیکەیشنی ئەندرۆید (APK):, 🌐 ماڵپەڕی فەرمی و پەخشی ڕاستەوخۆ:, 🤖 ڕێبەری زیرەکی دەستکرد (AI Context & Architecture)

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (5): apkUrl, build, notes, releaseDate, version

### Community 75 - "Community 75"
Cohesion: 0.33
Nodes (5): movies, moviesCount, series, seriesCount, updatedAt

### Community 76 - "Community 76"
Cohesion: 0.25
Nodes (8): detectEnvironment(), getWebSocketConstructor(), _initializeOptions(), isWebSocketSupported(), Jy(), onHeartbeat(), _wrapHeartbeatCallback(), Yy()

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (6): _authenticate(), _challenge(), _challengeAndVerify(), dc(), _register(), _verify()

### Community 78 - "Community 78"
Cohesion: 0.33
Nodes (6): createVideoSample(), getLastNalUnit(), getNALuType(), parseNALu(), parsePES(), pushAccessUnit()

### Community 79 - "Community 79"
Cohesion: 0.40
Nodes (5): decryptAacSample(), decryptAacSamples(), decryptAvcSamples(), decryptBuffer(), isSync()

### Community 80 - "Community 80"
Cohesion: 0.22
Nodes (3): ErrorBoundary, DeviceContext, DeviceProvider()

### Community 81 - "Community 81"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 82 - "Community 82"
Cohesion: 0.33
Nodes (5): apkUrl, build, notes, releaseDate, version

### Community 83 - "Community 83"
Cohesion: 0.33
Nodes (5): movies, moviesCount, series, seriesCount, updatedAt

### Community 84 - "Community 84"
Cohesion: 0.40
Nodes (5): extractVideoId(), handler(), INVIDIOUS_INSTANCES, PIPED_INSTANCES, streamCache

### Community 85 - "Community 85"
Cohesion: 0.50
Nodes (5): filterInitData(), generateRequest(), generateRequestWithPreferredKeySession(), getUsableKeyPromise(), Ou()

### Community 86 - "Community 86"
Cohesion: 0.40
Nodes (5): flushBackBuffer(), getEarliestElementaryStreamStart(), getLoopBackBufferFlushEnd(), onFragChanged(), trimBuffers()

### Community 87 - "Community 87"
Cohesion: 0.40
Nodes (5): _handleTokenChanged(), _isManualToken(), _performAuth(), setAuth(), _setAuthSafely()

### Community 88 - "Community 88"
Cohesion: 0.40
Nodes (5): isFilterValueEqual(), isSamePostgresFilter(), removeChannel(), unsubscribe(), _updatePostgresBindings()

### Community 93 - "Community 93"
Cohesion: 0.50
Nodes (4): Ar(), createIFramePlayer(), createImageIFramePlayer(), createInstance()

### Community 94 - "Community 94"
Cohesion: 0.50
Nodes (4): autoLevelCapping(), checkMaxAutoUpdated(), Ir(), maxHdcpLevel()

### Community 95 - "Community 95"
Cohesion: 0.83
Nodes (4): clone(), syncDiff(), syncState(), toNullProtoObj()

### Community 96 - "Community 96"
Cohesion: 0.50
Nodes (4): closedCaptionsForLevel(), extractCea608Data(), initCea608Parsers(), onFragParsingUserdata()

### Community 97 - "Community 97"
Cohesion: 0.83
Nodes (4): Dy(), onJoinPayload(), onLeavePayload(), wy()

### Community 98 - "Community 98"
Cohesion: 1.00
Nodes (3): gv(), hv(), mv()

## Knowledge Gaps
- **192 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `appId` (+187 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `clearTimeout()` connect `Community 2` to `Community 0`, `Community 65`, `Community 66`, `Community 1`, `Community 36`, `Community 6`, `Community 40`, `Community 42`, `Community 12`, `Community 14`, `Community 18`, `Community 50`, `Community 24`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `setInterval()` connect `Community 1` to `Community 0`, `Community 2`, `Community 6`, `Community 10`, `Community 17`, `Community 24`, `Community 25`, `Community 58`, `Community 29`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `subscribeToClientDeviceHotSwap()` connect `Community 25` to `Community 8`, `Community 1`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `push()` (e.g. with `hs()` and `us()`) actually correct?**
  _`push()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 77 inferred relationships involving `q()` (e.g. with `_adminDeletePasskey()` and `_adminListPasskeys()`) actually correct?**
  _`q()` has 77 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `constructor()` (e.g. with `Ep()` and `gc()`) actually correct?**
  _`constructor()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _192 weakly-connected nodes found - possible documentation gaps or missing edges._