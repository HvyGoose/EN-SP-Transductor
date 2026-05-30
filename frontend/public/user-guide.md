# Translator App - User Guide

## Overview

A real-time English ↔ Spanish translator with voice input, text-to-speech output, and hands-free conversation mode. Works on desktop and mobile browsers.

---

## Installation (Mobile)

### iPhone/iPad (iOS)
1. Open the app in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top right
5. The app icon appears on your home screen

### Android
1. Open the app in Chrome
2. Tap the **three dots** menu (top right)
3. Tap **"Add to Home Screen"** or **"Install App"**
4. Tap **"Add"**
5. The app icon appears on your home screen

Once installed, the app opens full-screen like a native app.

---

## Features

### 1. Text Translation (Main Screen)

Type text in either language and get instant translation.

| Element | Function |
|---------|----------|
| **Left Panel** | Source language input |
| **Right Panel** | Translation output |
| **↔ Swap Button** | Switch between English and Spanish |
| **Voice Button** | Record voice to transcribe |
| **Listen Button** | Hear the text spoken aloud |
| **Copy Button** | Copy translation to clipboard |

**How it works:**
- Type in the left panel
- Translation appears automatically after you stop typing (500ms delay)
- Click swap to reverse languages and swap the text

---

### 2. Conversation Mode

Click **"CONVERSATION"** button (top right) to enter conversation mode.

#### Press & Hold Mode (Default)
Best for: Controlled conversations, quiet environments

1. **Hold** the microphone button
2. **Speak** your message
3. **Release** when done
4. Translation plays automatically
5. Repeat for next message

#### Hands-Free Mode
Best for: Natural conversations, when your hands are busy

Toggle to hands-free by clicking the **"Press & Hold"** button to switch modes.

1. **Start speaking** - the app detects your voice automatically
2. **Pause** when finished - the app waits for your set duration
3. **Translation plays** automatically
4. **Continues listening** for the next speaker

---

## Settings (Hands-Free Mode)

### Pause Duration (1-5 seconds)

**What it does:** How long to wait after you stop speaking before translating.

| Setting | Best For |
|---------|----------|
| **1 second** | Fast speakers, quick exchanges |
| **2 seconds** | Normal conversation (default) |
| **3 seconds** | Thoughtful speakers who pause mid-sentence |
| **4-5 seconds** | People who need time to gather thoughts |

**Tip:** If translations cut off mid-sentence, increase this setting.

---

### Noise Filter (Quiet → Noisy)

**What it does:** Adjusts how loud sound must be to count as "speech."

| Setting | Threshold | Best For |
|---------|-----------|----------|
| **Quiet (Low)** | ~10 | Silent rooms, close mic |
| **Normal (Medium)** | ~25 | Home, office (default) |
| **Noisy (High)** | ~40 | Restaurants, outdoors |
| **Max** | ~55 | Very loud environments |

**How to calibrate:**
1. Watch the **audio level bar** at the bottom
2. With no one speaking, note where background noise reaches
3. Set the filter so background noise stays below the threshold
4. Speak normally - your voice should clearly exceed the threshold

**Tip:** If the app translates random noises, increase the filter. If it doesn't detect your speech, decrease it.

---

## Audio Level Bar

The horizontal bar shows real-time audio input level:

- **Empty/Low** = Silence or quiet background
- **Medium** = Soft speech or moderate noise  
- **High/Full** = Clear speech or loud sounds

When the level exceeds your Noise Filter setting, the app considers it "speech" and starts recording.

---

## Troubleshooting

### "Microphone access denied"
- Check browser permissions
- On iOS: Settings → Safari → Microphone
- On Android: Settings → Apps → Chrome → Permissions → Microphone

### App translates background noise
- Increase the **Noise Filter** setting
- Move to a quieter location
- Speak closer to the microphone

### Translation cuts off mid-sentence
- Increase **Pause Duration** setting
- Speak more continuously without long pauses

### No translation happens
- Check that audio level bar responds to your voice
- Decrease **Noise Filter** if it's too high
- Ensure you're pausing long enough (check Pause Duration)

### Hands-free won't start recording
- Speak louder or move closer to mic
- Decrease **Noise Filter** setting
- Check the audio level bar - your voice should clearly spike above background

---

## Tips for Best Results

1. **Speak clearly** - Normal conversational pace works best
2. **Minimize background noise** - Close windows, turn off TV
3. **Consistent distance** - Keep phone/mic at same distance
4. **Natural pauses** - Pause at sentence ends, not mid-thought
5. **Test settings first** - Spend 30 seconds calibrating Noise Filter before a real conversation

---

## Language Support

Currently supports:
- **English** (American accent optimized)
- **Spanish** (Latin American and Castilian)

The app auto-detects which language you're speaking and translates to the other.

---

## Privacy

- Audio is processed in real-time and not stored permanently
- Translation history is kept locally during your session
- No account required
- Works offline for basic UI (translations require internet)

---

## Keyboard Shortcuts (Desktop)

| Key | Action |
|-----|--------|
| `Ctrl/Cmd + Enter` | Swap languages |
| `Escape` | Close conversation mode |

---

## Need Help?

If you encounter issues not covered here, try:
1. Refreshing the page
2. Clearing browser cache
3. Reinstalling the PWA

For the best experience, use the latest version of Chrome, Safari, or Firefox.
