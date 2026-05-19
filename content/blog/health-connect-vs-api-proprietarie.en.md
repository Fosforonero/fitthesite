---
title: "Health Connect vs proprietary APIs: what changes for your data"
description: "Health Connect is Android's health hub. Manufacturers' proprietary APIs still exist and are sometimes richer. When one is better than the other, and why the difference isn't only technical."
date: "2026-05-19"
author: "FitMesh team"
tags: ["technical", "health-connect", "android", "digital-health"]
---

If you've ever connected a smartwatch to a third-party app, you've encountered two paths: going through **Health Connect** (Android's health hub) or going through a **proprietary API** from the manufacturer (Samsung Health Data SDK, Apple HealthKit on iOS, the Garmin Health SDK, etc.). The two paths lead to different places, even when they look the same.

This article digs into the technical differences, why they impact the data you see in your dashboard, and when one choice is better than the other.

## What Health Connect is

**Health Connect** is an Android service developed by Google in collaboration with Samsung. Launched in beta in 2022, stable on Android 14 (2023), pre-installed from 14 onward. It's an **encrypted local database** on the phone acting as a standardized middleman for all health data.

Apps can:

- **Write** (typically smartwatch companion apps, Bluetooth scales, fitness apps)
- **Read** (typically dashboards, aggregators, medical apps)
- **Delete** (user has granular control per app + per data type)

The protocol is standardized: a metric like "heart rate" always has the same schema (value, timestamp, source), regardless of who wrote it. That's the value: **it makes ecosystems talk to each other**.

## What a proprietary API is

A proprietary API is instead direct integration with a single manufacturer's SDK. Examples:

- **Samsung Health Data SDK** (Android) — access to data collected by Samsung Health, including data NOT exposed to Health Connect
- **Apple HealthKit** (iOS) — Apple equivalent, the only way to access health data on iOS
- **Garmin Health API** (cloud-side) — Garmin Connect data, accessible after OAuth + Garmin partner approval
- **Strava API**, **Oura API**, **Suunto API** — similar pattern to Garmin, OAuth cloud-side

Proprietary APIs typically give you **richer data** but force **a separate integration for each manufacturer**.

## The practical differences

### 1. Data richness

Health Connect has a standardized schema covering common metrics (steps, heart rate, sleep, calories, distance, weight, cycle, SpO₂, HRV). But not all sources fill all fields. Real examples:

- **Mi Fitness** (Xiaomi) writes steps, average heart rate, total sleep, calories. Doesn't write SpO₂ or HRV even though the watch measures them.
- **Garmin Connect** writes steps, sleep, heart rate but not VO₂ max or detailed workouts.
- **Samsung Health** writes everything to Health Connect except some advanced metrics (running segments by HR zone, swimming detail) that stay only in the proprietary SDK.

So: for a dashboard wanting **maximum depth on Galaxy Watch**, direct integration with the Samsung Health Data SDK brings more value than Health Connect-only. For a dashboard wanting **maximum cross-brand coverage**, Health Connect is the base and proprietary SDKs are the "bonus" for top brands.

### 2. Privacy and where data lives

Health Connect is **local on the phone**, encrypted by the Android Keystore. Apps writing to it don't see what other apps write (unless the user grants explicit read permission). When you delete data from Health Connect, it's actually deleted.

Cloud-side APIs (Garmin, Strava, Oura) **go through the manufacturer's cloud**. The third-party dashboard receives data via the manufacturer's cloud, which has already read and stored your data. Even if you delete data from the dashboard, the data stays in the manufacturer's cloud.

For privacy-first users, Health Connect is structurally cleaner. Cloud-side APIs require **trusting also the original manufacturer's cloud**.

### 3. Real-time and update cadence

- **Health Connect**: updates when companion apps write. Typically every 5–15 minutes, but depends on the companion app's policy. No push event to the consumer.
- **Proprietary SDKs** (Samsung, Apple): can push reactively to new data with callbacks. Better for real-time dashboards.
- **Cloud APIs** (Garmin, Strava): have webhooks for push notifications, but there's cloud latency (a few minutes). For intraday data typically less fresh than Health Connect.

### 4. User setup

- **Health Connect**: user grants permissions once. The dashboard works as long as Health Connect works.
- **Proprietary Android SDKs**: same thing, in-app permissions.
- **Cloud OAuth APIs**: user must log in with the manufacturer (Strava, Garmin) and authorize access. More friction, but necessary for cloud-first ecosystems.

### 5. Approval and developer overhead

Accessing Health Connect just requires a free Google library. No approval.

To access the **Garmin Health API**, you must submit a request to Garmin with use case and wait 2–4 weeks for approval. Same for **Fitbit Web API** and other big cloud-side providers. This limits which dashboards can use that data.

## When to use what

Summarizing the choices:

| Scenario | Recommended path |
|---|---|
| Cross-brand dashboard on Android | Health Connect as base |
| Maximum depth on Galaxy Watch | Health Connect + Samsung Health Data SDK |
| Real-time dashboard during workout | Specific proprietary SDK (Samsung, Apple) |
| Privacy-first / GDPR strict | Health Connect (avoid cloud-side if possible) |
| Aggregating Strava/Garmin data in dashboard | Cloud OAuth API (only path) |
| iOS | HealthKit (only path for Apple Watch) |

## How FitMesh Sync does it

For transparency, FitMesh Sync's technical choices (2026):

- **Android**: primary integration with **Health Connect** (covers 13+ brands). For Galaxy Watch, additionally direct read from **Samsung Health Data SDK** to get nightly SpO₂, continuous HRV, granular sleep stages that the Samsung Health → Health Connect bridge doesn't expose in full.
- **iOS**: on the roadmap for late 2026, **HealthKit** integration.
- **Strava, Oura, Suunto**: cloud-side OAuth integration arriving in 2026 for those who want to see workouts from these platforms alongside Health Connect data.
- **Garmin**: API approval in progress (2–4 weeks expected).

The philosophy is: **use Health Connect as universal base + proprietary SDKs as bonus for data richness on specific brands, avoid cloud-side where possible** to minimize involved third parties.

## In summary

Health Connect isn't "better" or "worse" than proprietary APIs. It's **a standard base** that greatly simplifies cross-brand development and has structural advantages on privacy. Proprietary APIs remain necessary for:

1. Brand-specific data richness (Samsung, Apple, Garmin)
2. Cloud-first platforms like Strava, Oura, Fitbit
3. iOS (HealthKit is the only path)

A well-built dashboard should use Health Connect as the base and add proprietary SDKs when they bring real value — not for fashion or marketing.
