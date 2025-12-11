# Background Music Solution for React Native

## Problem Statement

React Native has limitations for background audio/video playback, especially when combined with live RTC calls. We need to ensure background music can play during live audio and video meetings.

## Solution: Agora Audio Mixing

We use **Agora.io's built-in Audio Mixing** feature, which:

✅ **Works seamlessly with Agora RTC** - No conflicts with live audio/video  
✅ **Native background support** - Handled at SDK level, not React Native  
✅ **Automatic recording inclusion** - Music mixed into recordings automatically  
✅ **Cross-platform** - Works on both iOS and Android  
✅ **Performance optimized** - Native implementation, not JavaScript  

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
│                                                           │
│  ┌──────────────┐         ┌──────────────────┐        │
│  │  Agora SDK   │────────▶│  Audio Mixing API │        │
│  │  (RTC Call)  │         │  (Native Layer)   │        │
│  └──────────────┘         └──────────────────┘        │
│         │                           │                    │
│         └───────────┬───────────────┘                    │
│                     │                                    │
│              ┌──────▼──────┐                            │
│              │ Audio Mixer │                            │
│              │  (Native)   │                            │
│              └─────────────┘                            │
└─────────────────────────────────────────────────────────┘
         │                           │
         │                           │
    ┌────▼────┐                ┌────▼────┐
    │  iOS    │                │ Android │
    │  Audio  │                │  Audio  │
    │ Session │                │ Service │
    └─────────┘                └─────────┘
```

## Implementation

### Backend API Endpoints

1. **Start Music**: `POST /api/v1/meetings/:meetingId/music/start`
   - Body: `{ source, trackUrl, volume?, isLooping? }`
   - Permissions: Host, Co-Host, or Music Host only

2. **Stop Music**: `POST /api/v1/meetings/:meetingId/music/stop`
   - Permissions: Host, Co-Host, or Music Host only

3. **Update Volume**: `PUT /api/v1/meetings/:meetingId/music/volume`
   - Body: `{ volume: 0-100 }`
   - Permissions: Host, Co-Host, or Music Host only

4. **Get State**: `GET /api/v1/meetings/:meetingId/music`
   - Returns current music state (for participants joining mid-meeting)

### React Native Implementation

Uses Agora's `startAudioMixing()` API:

```typescript
// Start background music
await engine.startAudioMixing(
  trackUrl,      // File path or URL
  false,         // loopback (false = send to remote)
  true,          // replace (true = replace current audio)
  -1,            // cycle (-1 = infinite loop)
  0              // startPos (0 = from beginning)
);

// Set volume
await engine.setAudioMixingVolume(50); // 0-100

// Stop music
await engine.stopAudioMixing();
```

## Key Benefits

1. **No React Native Limitations**: Audio mixing happens at native SDK level
2. **Background Support**: Agora handles background audio automatically
3. **Recording Ready**: Music automatically included in Agora Cloud Recording
4. **Synchronized**: All participants hear the same music
5. **Performance**: Native implementation, optimized for real-time

## Platform Support

### iOS
- Uses `AVAudioSession` (handled by Agora SDK)
- Requires `UIBackgroundModes` with `audio` in Info.plist
- Works in background automatically

### Android
- Uses foreground service (handled by Agora SDK)
- No additional configuration needed
- Works in background automatically

## Music Sources Supported

1. **Remote URL**: `https://cdn.example.com/music.mp3`
2. **Local File**: Bundled with app
3. **Downloaded File**: Downloaded to device storage

## Testing Checklist

- [ ] Music starts when host clicks "Start Music"
- [ ] Music plays to all participants
- [ ] Volume control works (0-100)
- [ ] Music continues in background
- [ ] Music stops when host clicks "Stop Music"
- [ ] New participants hear music if already playing
- [ ] Music included in recording
- [ ] Permission checks work (only host/co-host/music_host can control)

## Next Steps

1. **WebSocket Events**: Add real-time events for music state changes
2. **Redis Storage**: Store music state in Redis for fast access
3. **Music Library**: Integrate with creator marketplace for music tracks
4. **Playlist Support**: Allow multiple tracks in sequence

## Documentation

- **Implementation Guide**: `docs/REACT-NATIVE-BACKGROUND-MUSIC.md`
- **API Reference**: See README.md for endpoint details
- **Agora Docs**: https://docs.agora.io/en/video-calling/develop/integrate-audio-mixing

