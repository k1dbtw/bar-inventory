# Bar Inventory

A native iOS app for bartenders to track bar stock, expiration dates, and write-offs during a shift — designed to be usable one-handed in 1–3 seconds per action.

Built with **SwiftUI + SwiftData**, fully offline, no backend, no third-party dependencies.

**Don't own a Mac?** See [SIDELOADING.md](SIDELOADING.md) — GitHub Actions builds an installable `.ipa` on every push, no Xcode required on your end.

## Requirements

- Xcode 16 or later
- iOS 17.0+ deployment target
- A Mac to build and run (Xcode Simulator or a physical iPhone)

## Getting it onto your iPhone

1. Open `BarInventory.xcodeproj` in Xcode.
2. Select the `BarInventory` target, go to **Signing & Capabilities**, and pick your personal Apple ID as the team (Xcode will manage provisioning automatically for free/personal accounts).
3. Plug in your iPhone (or select it wirelessly), choose it as the run destination, and press **Run**.
4. On first launch on-device, go to **Settings → General → VPN & Device Management** on the iPhone and trust your developer certificate if prompted.

The bundle identifier is `com.shoganai.barinventory` — change it in the target's Signing & Capabilities tab if it collides with something else on your account.

### If the project doesn't open cleanly

This `.xcodeproj` was authored by hand (this environment has no macOS/Xcode to verify the build), using Xcode 16's newer "file system synchronized groups" format so every file under `BarInventory/` is picked up automatically without listing each one individually. If Xcode complains when opening it:

1. Create a new project: **File → New → Project → iOS → App**, name it `BarInventory`, interface **SwiftUI**, storage **SwiftData**, bundle ID `com.shoganai.barinventory`.
2. Delete the generated placeholder `Item.swift`/`ContentView.swift`.
3. Drag the `BarInventory/Models`, `Persistence`, `Notifications`, `Utilities`, `Views`, and `BarInventoryApp.swift` from this repo into the new project (checking "Copy items if needed" and adding to the target).
4. Replace the generated `Assets.xcassets` with the one from this repo, or just copy the `AccentColor.colorset` into your generated catalog.
5. Build & run.

## Architecture

- **Models** (`Models/`) — `Product` and `HistoryEntry` are the two SwiftData models. Enums (`ProductCategory`, `MeasurementUnit`, `WriteOffReason`, `HistoryChangeType`) drive icons, colors, and default step sizes.
- **Persistence** (`Persistence/`) — `PersistenceController` builds the on-disk `ModelContainer`; `SampleData` seeds an in-memory container for previews.
- **InventoryActions** (`Utilities/InventoryActions.swift`) — the single place that mutates a `Product`; every mutation is paired with a `HistoryEntry` so the audit trail can never drift from the data.
- **Notifications** (`Notifications/NotificationManager.swift`) — schedules per-product expiration reminders, fires an instant local notification the moment a product crosses into low stock, and an optional daily check-in reminder.
- **Views** (`Views/`) — one folder per screen (`Home`, `AddEditProduct`, `Dashboard`, `History`, `Settings`) plus `Components` for shared UI (cards, chips, badges) and `Root` for the tab bar.

## Product behavior

- **No silent deletes.** "Deleting" a product from Home archives it (with a confirmation dialog) and keeps all of its history. Archived products live under **Settings → Archived Products**, where they can be restored or permanently deleted (a second, explicit confirmation).
- **Quick actions everywhere.** Swipe a row for +1 / −1 / Write Off. Tap a row to open the quantity sheet with large +/− buttons sized to the product's unit. Long-press for a context menu (Adjust / Edit / Archive).
- **Write-offs require a reason** (Expired / Spoiled / Broken / Mistake / Other) so the History and Dashboard write-off stats stay meaningful.
- **Home surfaces what matters first**: an "Expiring Soon" carousel, a "Low Stock" carousel, then the full product list grouped by category — configurable in Settings (expiration window, reminder lead time).

## Notifications

Bar Inventory only uses **local** notifications — nothing leaves the device:

- An expiration reminder fires N days (configurable, default 2) before a tracked product's expiration date.
- A low-stock alert fires the instant a product's quantity drops to or below its threshold.
- An optional daily reminder nudges you to open the app and do a stock check.

All three are opt-in from **Settings → Notifications**.
