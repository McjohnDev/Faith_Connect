# React Native Background Music Implementation Guide

## Overview

This guide explains how to implement background music during live audio/video meetings in React Native using **Agora.io's Audio Mixing** feature. This approach ensures:

- ✅ Background music works seamlessly with Agora RTC calls
- ✅ Music continues playing when app goes to background
- ✅ Music is automatically included in recordings
- ✅ Works on both iOS and Android
- ✅ No need for separate background audio management

## Why Agora Audio Mixing?

React Native has limitations for background audio, especially when combined with live RTC calls. Agora's built-in audio mixing solves this by:

1. **Native Integration**: Audio mixing happens at the Agora SDK level, not React Native
2. **Background Support**: Works automatically with Agora's background audio handling
3. **Recording**: Music is automatically mixed into recordings
4. **Performance**: Optimized native implementation

## Prerequisites

1. **Agora React Native SDK**: `react-native-agora`
   ```bash
   npm install react-native-agora
   ```

2. **Background Audio Permissions** (already configured for Agora RTC):
   - iOS: `UIBackgroundModes` with `audio` (already set)
   - Android: Foreground service (Agora handles this)

## Implementation Steps

### 1. Install Agora React Native SDK

```bash
npm install react-native-agora
cd ios && pod install && cd .. # iOS only
```

### 2. Start Audio Mixing (Host/Co-Host/Music Host)

```typescript
import RtcEngine, { 
  IRtcEngine, 
  AudioMixingStateCode,
  AudioMixingReasonCode 
} from 'react-native-agora';

// After joining the Agora channel
const startBackgroundMusic = async (
  engine: IRtcEngine,
  trackUrl: string,
  volume: number = 50,
  loop: boolean = true
) => {
  try {
    // Start audio mixing
    // Parameters:
    // - filePath: Local file path or URL
    // - loopback: false (send to remote)
    // - replace: true (replace current audio)
    // - cycle: loop count (-1 for infinite)
    // - startPos: start position in milliseconds
    const result = await engine.startAudioMixing(
      trackUrl,      // File path or URL
      false,         // loopback (false = send to remote)
      true,          // replace (true = replace current audio)
      loop ? -1 : 1, // cycle (-1 = infinite loop)
      0              // startPos (0 = from beginning)
    );

    if (result === 0) {
      // Set volume (0-100)
      await engine.setAudioMixingVolume(Math.round(volume));
      console.log('Background music started');
    } else {
      console.error('Failed to start audio mixing:', result);
    }
  } catch (error) {
    console.error('Error starting audio mixing:', error);
  }
};
```

### 3. Stop Audio Mixing

```typescript
const stopBackgroundMusic = async (engine: IRtcEngine) => {
  try {
    await engine.stopAudioMixing();
    console.log('Background music stopped');
  } catch (error) {
    console.error('Error stopping audio mixing:', error);
  }
};
```

### 4. Update Volume

```typescript
const updateMusicVolume = async (
  engine: IRtcEngine,
  volume: number // 0-100
) => {
  try {
    await engine.setAudioMixingVolume(Math.round(volume));
    console.log(`Music volume set to ${volume}%`);
  } catch (error) {
    console.error('Error updating volume:', error);
  }
};
```

### 5. Listen to Audio Mixing Events

```typescript
// Set up event listeners
engine.addListener('AudioMixingStateChanged', (state, reason) => {
  switch (state) {
    case AudioMixingStateCode.AudioMixingStatePlaying:
      console.log('Audio mixing started playing');
      break;
    case AudioMixingStateCode.AudioMixingStatePaused:
      console.log('Audio mixing paused');
      break;
    case AudioMixingStateCode.AudioMixingStateStopped:
      console.log('Audio mixing stopped');
      break;
    case AudioMixingStateCode.AudioMixingStateFailed:
      console.error('Audio mixing failed:', reason);
      break;
  }
});

engine.addListener('AudioMixingFinished', () => {
  console.log('Audio mixing finished (if not looping)');
  // If looping, this won't fire
});
```

### 6. Complete Example: Meeting Component

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { View, Button, Slider } from 'react-native';
import RtcEngine, { IRtcEngine } from 'react-native-agora';

interface BackgroundMusicState {
  isEnabled: boolean;
  trackUrl?: string;
  volume: number;
  isLooping: boolean;
}

const MeetingScreen = ({ meetingId, agoraToken, channelName, agoraUid }) => {
  const engineRef = useRef<IRtcEngine | null>(null);
  const [musicState, setMusicState] = useState<BackgroundMusicState>({
    isEnabled: false,
    volume: 50,
    isLooping: true
  });

  useEffect(() => {
    // Initialize Agora engine
    const initAgora = async () => {
      const engine = await RtcEngine.create(AGORA_APP_ID);
      await engine.enableAudio();
      await engine.joinChannel(agoraToken, channelName, agoraUid, {
        clientRoleType: 1 // 1 = broadcaster, 2 = audience
      });

      // Set up audio mixing listeners
      engine.addListener('AudioMixingStateChanged', (state, reason) => {
        if (state === AudioMixingStateCode.AudioMixingStatePlaying) {
          setMusicState(prev => ({ ...prev, isEnabled: true }));
        } else if (state === AudioMixingStateCode.AudioMixingStateStopped) {
          setMusicState(prev => ({ ...prev, isEnabled: false }));
        }
      });

      engineRef.current = engine;
    };

    initAgora();

    return () => {
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        RtcEngine.destroy();
      }
    };
  }, []);

  const handleStartMusic = async (trackUrl: string) => {
    if (!engineRef.current) return;

    // Call backend API to start music
    await fetch(`/api/v1/meetings/${meetingId}/music/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        source: 'url',
        trackUrl,
        volume: musicState.volume,
        isLooping: musicState.isLooping
      })
    });

    // Start audio mixing locally
    await startBackgroundMusic(
      engineRef.current,
      trackUrl,
      musicState.volume,
      musicState.isLooping
    );
  };

  const handleStopMusic = async () => {
    if (!engineRef.current) return;

    // Call backend API
    await fetch(`/api/v1/meetings/${meetingId}/music/stop`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Stop audio mixing locally
    await engineRef.current.stopAudioMixing();
  };

  const handleVolumeChange = async (volume: number) => {
    if (!engineRef.current) return;

    setMusicState(prev => ({ ...prev, volume }));

    // Call backend API
    await fetch(`/api/v1/meetings/${meetingId}/music/volume`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ volume })
    });

    // Update local volume
    await engineRef.current.setAudioMixingVolume(Math.round(volume));
  };

  return (
    <View>
      {/* Music Controls (only for host/co-host/music_host) */}
      {canControlMusic && (
        <View>
          <Button
            title={musicState.isEnabled ? "Stop Music" : "Start Music"}
            onPress={() => 
              musicState.isEnabled 
                ? handleStopMusic() 
                : handleStartMusic('https://example.com/music.mp3')
            }
          />
          
          {musicState.isEnabled && (
            <Slider
              value={musicState.volume}
              minimumValue={0}
              maximumValue={100}
              onValueChange={handleVolumeChange}
            />
          )}
        </View>
      )}
    </View>
  );
};
```

## Music Source Options

### 1. URL (Remote File)
```typescript
const trackUrl = 'https://cdn.example.com/music/prayer-music.mp3';
await engine.startAudioMixing(trackUrl, false, true, -1, 0);
```

### 2. Local File (Bundled)
```typescript
// iOS: Add file to Xcode project
// Android: Add to android/app/src/main/assets/
const trackUrl = Platform.OS === 'ios' 
  ? 'prayer-music.mp3'  // In bundle
  : 'file:///android_asset/prayer-music.mp3';
```

### 3. Downloaded File
```typescript
import RNFS from 'react-native-fs';

// Download file first
const downloadPath = `${RNFS.DocumentDirectoryPath}/music.mp3`;
await RNFS.downloadFile({
  fromUrl: 'https://example.com/music.mp3',
  toFile: downloadPath
}).promise;

// Use local path
await engine.startAudioMixing(downloadPath, false, true, -1, 0);
```

## Background Audio Configuration

### iOS (Info.plist)
```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
```

### Android (AndroidManifest.xml)
Agora SDK automatically handles foreground service for background audio. No additional configuration needed.

## Important Notes

1. **Permissions**: Only host, co-host, or music_host can control music (enforced by backend)

2. **Synchronization**: When a participant joins, they should:
   - Check if music is playing: `GET /api/v1/meetings/:meetingId/music`
   - If playing, start audio mixing with the same track URL

3. **Recording**: Music is automatically included in Agora Cloud Recording - no additional setup needed

4. **Volume Control**: 
   - `setAudioMixingVolume()` controls music volume (0-100)
   - Participant audio volume is separate (use `adjustAudioMixingPlayoutVolume()` for local playback)

5. **Error Handling**: Always check return codes and handle errors gracefully

## API Endpoints Reference

- `POST /api/v1/meetings/:meetingId/music/start` - Start background music
- `POST /api/v1/meetings/:meetingId/music/stop` - Stop background music
- `PUT /api/v1/meetings/:meetingId/music/volume` - Update volume (0-100)
- `GET /api/v1/meetings/:meetingId/music` - Get current music state

## Testing

1. **Test Background Playback**:
   - Start music in meeting
   - Put app in background
   - Music should continue playing

2. **Test Volume Control**:
   - Start music
   - Adjust volume slider
   - Verify volume changes in real-time

3. **Test Recording**:
   - Start meeting with music
   - Record meeting
   - Verify music is included in recording

## Troubleshooting

**Music doesn't play in background:**
- Verify `UIBackgroundModes` includes `audio` in Info.plist
- Check Agora SDK version (should be latest)
- Ensure app has audio permissions

**Music not synced across participants:**
- All participants must use the same track URL
- Check network connectivity
- Verify backend API calls are successful

**Volume control not working:**
- Verify volume value is 0-100
- Check if audio mixing is active
- Ensure proper error handling

## Resources

- [Agora React Native SDK Docs](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-native)
- [Audio Mixing Guide](https://docs.agora.io/en/video-calling/develop/integrate-audio-mixing?platform=react-native)
- [Background Audio](https://docs.agora.io/en/video-calling/develop/run-in-background?platform=react-native)

