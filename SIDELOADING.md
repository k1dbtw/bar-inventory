# Installing Bar Inventory without a Mac

This repo builds an unsigned `.ipa` automatically via GitHub Actions (macOS runners, free), which you then sideload onto your iPhone with **AltStore** or **SideStore** using a free Apple ID — no Mac, no $99/year Apple Developer account.

## One-time setup

1. **A computer running Windows, Linux, or macOS** (this is only used to install AltStore *once* — it does not need to be a Mac).
2. **A free Apple ID** (your regular iCloud account works — you don't need a paid developer account).
3. Install **AltServer** on that computer:
   - Windows/Mac: [altstore.io](https://altstore.io)
   - Linux: use a community AltServer-Linux build (search "AltServer-Linux" on GitHub), or use **SideStore**, which has its own Linux-friendly pairing flow — see [sidestore.io](https://sidestore.io).
4. On your iPhone, connect to the **same Wi-Fi** as that computer.
5. From AltServer's tray/menu-bar icon: **Install AltStore → [your iPhone]**, then sign in with your Apple ID when prompted. This creates a free signing certificate through Apple's developer API — nothing is sent anywhere else.
6. On the iPhone, go to **Settings → General → VPN & Device Management** and trust the certificate for your Apple ID.
7. AltStore now appears as an app on your home screen.

## Getting the app onto your phone

1. In this repo on GitHub, open the **Actions** tab → the latest **"Build IPA for sideloading"** run → download the **`BarInventory-ipa`** artifact (it's a zip containing `BarInventory.ipa`).
2. Install it one of two ways:
   - **From the computer**: open AltServer's tray icon → **Install** → pick your iPhone → select the downloaded `BarInventory.ipa`. It installs over Wi-Fi, no cable needed.
   - **From the phone**: AirDrop or transfer `BarInventory.ipa` to the iPhone (e.g. via the Files app), open it, and choose **AltStore**. Or open AltStore → **My Apps → +** and pick the file.
3. Bar Inventory appears as a normal app icon on your home screen.

## Keeping it working

Apps signed with a free Apple ID expire after **7 days** and need to be refreshed, or they stop opening. AltStore does this automatically in the background as long as:
- The AltStore app is opened at least once a week while your iPhone is on the same Wi-Fi as the computer running AltServer, **or**
- You've enabled AltStore's wireless "Background Refresh" in its settings (no cable, no need to keep AltServer permanently running — just briefly, periodically).

If a refresh is missed and the app icon greys out, just open AltStore and pull to refresh, or reinstall the latest `.ipa` the same way as above.

## Getting updates

Every time new code is pushed to this repo's branch, GitHub Actions rebuilds the `.ipa` automatically. To update your phone:
1. Download the newest `BarInventory-ipa` artifact from the Actions tab.
2. Install it the same way as above (step 2 in "Getting the app onto your phone").

Since the app keeps the same bundle identifier, iOS treats this as an **update**, not a fresh install — your products and history in SwiftData are preserved.

## SideStore, if you want less manual upkeep

[SideStore](https://sidestore.io) is a fork of AltStore built to reduce how often you need a companion computer nearby — after the same one-time AltServer pairing above, it can refresh itself over the network using Apple's push service instead of requiring AltServer to be running. Worth switching to if the weekly refresh becomes annoying.
