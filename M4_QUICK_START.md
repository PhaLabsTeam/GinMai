# 🚀 M4 Quick Start Guide

## ✅ You're Ready to Start M4!

**Testing Complete:** 96% pass rate, testing infrastructure verified safe
**Backlog Created:** Navigation issues tracked for later
**M4 Plan:** Comprehensive implementation plan ready

---

## 🎯 M4 Overview

**Goal:** Add push notifications and reliability features

**4 Main Features:**
1. **Push Notifications** - Real notifications (not just in-app)
2. **Running Late Reminders** - 10 min before meal prompts
3. **Reliability Signals** - No-show tracking and trust indicators
4. **Enhanced Matching** - Better "eat again" logic

**Estimated Time:** 14-19 hours total

---

## 📋 Implementation Order (Recommended)

### Phase 1: Push Notifications (4-6 hours) ⭐ START HERE

**Why first:** Foundation for everything else, biggest UX impact

**Steps:**
1. Install Expo notifications package
2. Configure app.json
3. Request notification permissions
4. Store push tokens in database
5. Create notification service
6. Send test notifications

**Start here:** Task 1.1 in `M4_IMPLEMENTATION_PLAN.md`

---

### Phase 2: Running Late Reminders (3-4 hours)

**Why second:** Builds on push notifications, high user value

**Steps:**
1. Schedule local notifications 10 min before meal
2. Create "Running late?" UI
3. Notify participants when someone is late

---

### Phase 3: Reliability Signals (3-4 hours)

**Why third:** Independent feature, builds trust

**Steps:**
1. Add reliability columns to database
2. Track meals completed and no-shows
3. Display reliability scores and badges

---

### Phase 4: Enhanced Matching (4-5 hours)

**Why last:** Nice-to-have, can iterate later

**Steps:**
1. Create matches table
2. Track mutual "eat again" selections
3. Show connections screen

---

## 🏁 First Task: Setup Expo Notifications

**Let's start with the most important feature!**

### Step 1: Install Package

```bash
cd /Users/soporte_it/ginmai/app
npx expo install expo-notifications
```

### Step 2: Configure app.json

Open `app/app.json` and add notifications plugin:

```json
{
  "expo": {
    "name": "GinMai",
    "slug": "ginmai",
    // ... existing config ...
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#F97316",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#F97316"
    }
  }
}
```

### Step 3: Request Permissions

Create `app/src/hooks/useNotifications.ts`:

```typescript
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
    });
  }, []);

  return { expoPushToken, permissionStatus };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F97316',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push token:', token);

  return token;
}
```

### Step 4: Use in App

Update `app/App.tsx` to request permissions on startup:

```typescript
import { useNotifications } from './src/hooks/useNotifications';

export default function App() {
  const { expoPushToken } = useNotifications();

  useEffect(() => {
    if (expoPushToken) {
      console.log('Got push token:', expoPushToken);
      // TODO: Store in database
    }
  }, [expoPushToken]);

  // ... rest of app
}
```

### Step 5: Test

```bash
# Start the app
cd app
npx expo start --ios

# Check console for:
# "Push token: ExponentPushToken[xxxxx]"
```

---

## 📚 Documentation

**Full Implementation Plan:** `M4_IMPLEMENTATION_PLAN.md`
- Complete breakdown of all 4 features
- Database migrations
- File structure
- Testing strategy

**Backlog (Navigation Issues):** `BACKLOG.md`
- Issues #1 and #2 tracked for later
- Can fix alongside M4 or after

---

## ✅ Checklist for Today

- [ ] Install expo-notifications package
- [ ] Configure app.json
- [ ] Create useNotifications hook
- [ ] Request permissions on app startup
- [ ] Get push token and log it
- [ ] Test on iOS simulator
- [ ] Commit initial notification setup

---

## 🆘 Need Help?

**Common Issues:**

1. **"Failed to get push token"**
   - Make sure you're testing on a real device (simulator has limitations)
   - Check iOS settings → Notifications → GinMai

2. **"Module not found: expo-notifications"**
   - Run: `npx expo install expo-notifications`
   - Restart Metro bundler

3. **"Android build fails"**
   - Add notification channel configuration (see Step 3 above)

---

## 📊 Progress Tracking

Create tasks as you go:

```bash
# Example: Track your progress
echo "- [x] Installed expo-notifications" >> M4_PROGRESS.md
echo "- [x] Configured app.json" >> M4_PROGRESS.md
echo "- [ ] Created notification service" >> M4_PROGRESS.md
```

---

## 🎯 Next Steps After Setup

Once you have push notifications working:

1. **Store push tokens in database**
   - Add `push_token` column to users table
   - Update user record when token received

2. **Create notification service**
   - Handle foreground/background notifications
   - Route to correct screen on tap

3. **Send test notification**
   - Create utility to send push notifications
   - Test notification delivery

**See `M4_IMPLEMENTATION_PLAN.md` for detailed steps!**

---

**Ready? Let's implement push notifications! 🚀**

Start with: `npx expo install expo-notifications`
