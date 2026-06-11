---
title: "Colmi R02 setup guide: how to use it and read your data"
metaDescription: "Colmi R02 setup: how to wear it, charge it, and connect it to FitMesh for a unified health dashboard. Step-by-step practical guide."
slug: "colmi-r02-setup"
keywords_target:
  - colmi r02 setup
  - how to use colmi r02
  - colmi r02 instructions
  - colmi r02 configuration
  - colmi r02 how it works
  - colmi r02 guide
faq_json_ld: true
publish_note: "DRAFT — publish when Colmi ring feature ships in FitMesh Sync. Do NOT add to lib/blog/data.ts or sitemap before go-live."
pillar_slug: "colmi-ring-fitmesh"
internal_links:
  - /blog/colmi-ring-fitmesh (full technical guide to BLE and dashboard — read this for deep detail)
  - /blog/tracciare-sonno-anello (how to use the ring for sleep tracking)
  - /blog/migliori-anelli-economici (budget smart ring comparison 2026)
  - /integrations (supported devices)
  - /beta (beta signup, founder offer)
---

# Colmi R02 setup guide: how to use it and read your data

You just received your Colmi R02 and want to understand how it works, how to wear it properly, and how to get the data into FitMesh alongside your smartwatch. This guide covers everything from opening the box to seeing your first unified dashboard.

## What's in the Colmi R02 box

The Colmi R02 packaging is minimal. Inside you'll find:

- **The ring** in the size you ordered
- **The magnetic charger**: a small disc with a magnet that attaches to the flat side of the ring
- **USB-A cable** (some bundles include USB-C, but the power adapter is not included — any standard USB charger works)
- **Quick-start booklet** in multiple languages (content is very basic — for full details it defers to the app)
- Optionally a **sizing kit** if you ordered it to find the right fit before committing to a size

If you have a sizing kit and haven't figured out your size yet, wear each size for 10–15 minutes to make sure it's neither too tight (leaves an impression on the skin after a few minutes) nor too loose (rotates or slides off).

## How to wear the Colmi R02 correctly

**Which finger**: the Colmi R02 works best on the **ring finger** or **middle finger** of your non-dominant hand. These fingers have consistent blood flow and are less exposed to sudden movements during the day. Avoid the index finger (too much movement) and the pinky (often less consistent circulation).

**Orientation**: the side with the optical sensor (the flat or slightly curved inner surface of the ring) should sit on the **underside of your finger** — the side facing your palm. This ensures direct contact between the sensor and your skin. If the ring has a small dot or groove as a position indicator, place that on the underside.

**Fit and finger size**: fingers change slightly in diameter throughout the day — they swell in heat or after exercise, and shrink when cold or right after waking up. If the ring feels slightly different at different times of day, that's normal. The key is that it should be snug enough not to spin freely, but not so tight that it leaves marks.

**Quick check**: after wearing it for 5 minutes, look for red marks on the skin — if you see them, the size is too small. If the ring spins or slides off easily, go one size smaller.

## Charging: how long and how to tell when it's done

**Battery life**: with continuous monitoring active (heart rate, overnight SpO2, steps), the Colmi R02 typically lasts **5–7 days**. With aggressive continuous overnight SpO2 monitoring it can drop to 3–4 days.

**How to charge**: attach the magnetic charger to the flat side of the ring — the magnet holds it in place. Connect the cable to any standard USB adapter (5V/1A is more than enough). You don't need a fast charger.

**How to know it's charging**: most R02 models show an LED that blinks during charging. When the LED turns off or stops blinking, charging is complete.

**Full charge time**: approximately 1–2 hours from empty.

**Recommended routine**: charge every 4–5 days, in the morning during your shower or over breakfast. This way you never risk running out of battery overnight — when your data matters most.

## First sync with FitMesh: step by step

FitMesh Sync connects to the Colmi R02 via **direct Bluetooth** (BLE), without going through the manufacturer's companion app. You don't need to download the Colmi or QRing companion app to use FitMesh — though you can keep it installed if you prefer.

**Step 1 — Install FitMesh Sync**: if you haven't already, download it from the Google Play Store. The beta version is accessible via an invite link from the [/beta](/beta) page.

**Step 2 — Open FitMesh and go to "Devices"**: from the main screen, select the devices menu or tap the "+" button to add a new device.

**Step 3 — Select "Smart ring" then "Colmi R02/R03"**: FitMesh starts a BLE scan. Make sure your phone's Bluetooth is on and the ring is nearby (within 50 cm).

**Step 4 — Pair the ring**: when the Colmi R02 appears in the detected devices list, select it. Pairing takes a few seconds. No PIN is required.

**Step 5 — First data sync**: after pairing, FitMesh automatically downloads the historical data stored in the ring's memory (typically the past 7 days). This first sync can take anywhere from 30 seconds to a few minutes.

**Step 6 — Subsequent syncs**: future syncs happen automatically every time the ring is in range of your phone. You don't need to do anything manually.

For the full technical details on how the BLE connection works, what happens during a sync, and how the data fusion with your smartwatch is handled, read the [complete technical guide to Colmi R02/R03 integration in FitMesh](/blog/colmi-ring-fitmesh).

## Understanding the data in the FitMesh dashboard

Once synced, the FitMesh dashboard shows your ring metrics organized by type:

**Daily data**:
- Steps and distance
- Estimated calories
- Active minutes
- Average heart rate and resting heart rate

**Overnight data** (available each morning after the first sync):
- Total sleep hours
- Sleep stage breakdown (light, deep, REM, awake)
- Overnight HRV (estimated heart rate variability)
- Overnight SpO2 (estimated oxygen saturation)
- Overnight minimum heart rate (resting HR)

**Unified view with your watch**:
If you've already connected a smartwatch to FitMesh (Galaxy Watch, Pixel Watch, Garmin, Amazfit, etc.), the ring's data integrates automatically with watch data on the same timeline. At night the metrics come from the ring; workout sessions and daytime metrics come from the watch. There is no double-counting.

**Trends and history**:
FitMesh shows charts across 7, 30, and 90 days for all key metrics. The value of the data increases week after week — a month of data gives you correlations and patterns that a single reading can't reveal.

## FAQ: Colmi R02

**Is the Colmi R02 waterproof?**
Yes. The Colmi R02 carries an IP68 rating — it resists immersion up to 50 meters in fresh water according to the manufacturer's specifications. You can wear it in the shower and while washing your hands. Avoid prolonged immersion in salt water or chlorinated pools, which can degrade the materials over time.

**Do I need the QRing or Colmi app to use FitMesh?**
No. FitMesh connects directly via BLE and doesn't require the companion app. You can uninstall the OEM app if you don't use it. If you prefer to keep it for comparison, there's no conflict — the two systems operate independently.

**Does the ring work with iPhone?**
FitMesh Sync is currently Android-only. The Colmi R02 technically supports both Android and iOS through the OEM app, but the FitMesh integration requires Android.

**How much historical data is downloaded on first pairing?**
FitMesh typically downloads the last 7 days of data from the ring's memory. Older data may not be available because the ring's internal memory is limited and overwrites older data.

**What happens if the ring runs out of battery overnight?**
Data collected before the battery died is saved in the ring's memory and synced with FitMesh at the next pairing. Data from the period while the battery was dead is not recoverable.

---

FitMesh Sync is in private beta. The first 1,000 users get 1 year of Pro free. Sign up at [fitmesh.fit/beta](/beta).
