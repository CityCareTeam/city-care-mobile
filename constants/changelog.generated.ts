// Généré par `npm run changelog` — ne pas modifier à la main.
// Pour reformuler une version à destination des utilisateurs, passez par
// `constants/changelog-overrides.ts`.

import type { Change, ReleaseNote } from "@/types/changelog";

export const GENERATED_CHANGELOG: ReleaseNote[] = [
  {
    "version": "1.5.5",
    "date": "2026-08-15",
    "changes": [
      {
        "kind": "fix",
        "text": "Carte, rafraîchissement automatique et notes de version"
      },
      {
        "kind": "fix",
        "scope": "map",
        "text": "Repair marker rasterisation and restore missing pins when zoomed"
      },
      {
        "kind": "fix",
        "scope": "map",
        "text": "Use majority status for cluster colour and flag dense areas"
      },
      {
        "kind": "fix",
        "text": "Refresh screens on focus and recover after network loss"
      },
      {
        "kind": "fix",
        "scope": "notifications",
        "text": "Require an explicit tap to delete and virtualise the list"
      },
      {
        "kind": "fix",
        "scope": "ui",
        "text": "Remove grey slab on Android surfaces and make the tab indicator draggable"
      },
      {
        "kind": "fix",
        "scope": "release",
        "text": "Label pre-release builds and auto-increment versionCode"
      },
      {
        "kind": "fix",
        "scope": "release",
        "text": "Build release notes from git history"
      },
      {
        "kind": "fix",
        "scope": "tests",
        "text": "Decouple pending-changes test from git state"
      },
      {
        "kind": "fix",
        "scope": "ci",
        "text": "Fail the audit only on unreviewed advisories"
      },
      {
        "kind": "fix",
        "scope": "release",
        "text": "Predict the next version from pending commits"
      },
      {
        "kind": "fix",
        "scope": "release",
        "text": "Use an explicit sentinel for the production channel"
      },
      {
        "kind": "fix",
        "scope": "release",
        "text": "Commit the synced changelog before building"
      },
      {
        "kind": "fix",
        "scope": "ui",
        "text": "Stop the tab bar crashing when releasing the indicator"
      },
      {
        "kind": "fix",
        "scope": "build",
        "text": "Fail early when the Google Maps key is missing"
      },
      {
        "kind": "fix",
        "scope": "ci",
        "text": "Commit the version plan alongside the release notes"
      },
      {
        "kind": "fix",
        "scope": "photos",
        "text": "Keep the storage port when rewriting photo URLs in dev"
      }
    ]
  },
  {
    "version": "1.5.4",
    "date": "2026-06-16",
    "changes": [
      {
        "kind": "fix",
        "text": "Add silent auto-refresh polling for incidents list, status and votes"
      },
      {
        "kind": "fix",
        "text": "Reload silence to 15s"
      }
    ]
  },
  {
    "version": "1.5.3",
    "date": "2026-06-15",
    "changes": [
      {
        "kind": "fix",
        "text": "Clear push token on logout to prevent multi-account notification leak"
      }
    ]
  },
  {
    "version": "1.5.2",
    "date": "2026-06-15",
    "changes": [
      {
        "kind": "fix",
        "text": "Add Firebase FCM config for Android push notifications"
      },
      {
        "kind": "fix",
        "text": "Add Firebase FCM config for Android push notification"
      }
    ]
  },
  {
    "version": "1.5.1",
    "date": "2026-06-15",
    "changes": [
      {
        "kind": "fix",
        "text": "Add \"Le mien\" badge on community incidents"
      }
    ]
  },
  {
    "version": "1.5.0",
    "date": "2026-06-15",
    "changes": [
      {
        "kind": "feature",
        "text": "Add vote for citizen"
      },
      {
        "kind": "fix",
        "text": "Photo upload timeout and silent error on incident report"
      },
      {
        "kind": "fix",
        "text": "Security patch"
      },
      {
        "kind": "feature",
        "text": "Incident vote (soutien) for citizens"
      }
    ]
  },
  {
    "version": "1.4.2",
    "date": "2026-06-15",
    "changes": [
      {
        "kind": "fix",
        "text": "Input display"
      },
      {
        "kind": "fix",
        "text": "Input padding"
      }
    ]
  },
  {
    "version": "1.4.1",
    "date": "2026-06-15",
    "changes": [
      {
        "kind": "fix",
        "text": "Chat in détail incident"
      },
      {
        "kind": "fix",
        "text": "Chat in detail incident"
      }
    ]
  },
  {
    "version": "1.4.0",
    "date": "2026-06-15",
    "changes": [
      {
        "kind": "feature",
        "text": "Add chat, add notifs, refonte app and fix photo incident"
      },
      {
        "kind": "fix",
        "text": "City extraction, description in my incidents and photo zoom in detail modal"
      },
      {
        "kind": "feature",
        "text": "Edit profile, change password & delete account with full UI rework"
      },
      {
        "kind": "fix",
        "text": "Validation champs formulaires (caractères spéciaux, longueur max) & décompte description signalement"
      },
      {
        "kind": "fix",
        "text": "Resolve TypeScript strict literal type errors on coords and map delta"
      },
      {
        "kind": "fix",
        "text": "Username char validation & add tests for easter-egg, user-location, color-scheme-web"
      },
      {
        "kind": "improvement",
        "text": "Reorganise architecture & fix session expiry redirect"
      },
      {
        "kind": "feature",
        "text": "In-app notification center, push token & preferences"
      },
      {
        "kind": "feature",
        "text": "Server-side map clustering, replace react-native-map-clustering"
      },
      {
        "kind": "feature",
        "text": "Incident chat (SignalR), notification fixes & message_count badge"
      },
      {
        "kind": "improvement",
        "text": "SOLID split, modal redesign & map marker fixes"
      },
      {
        "kind": "feature",
        "text": "Notifications UX overhaul & swipe-to-delete"
      },
      {
        "kind": "feature",
        "text": "Refonte UI complète et déduplication des composants partagés"
      },
      {
        "kind": "fix",
        "text": "Image in app"
      },
      {
        "kind": "fix",
        "text": "App photo"
      }
    ]
  },
  {
    "version": "1.3.0",
    "date": "2026-06-12",
    "changes": [
      {
        "kind": "feature",
        "text": "Photos, profile management, form validation & architecture cleanup"
      },
      {
        "kind": "feature",
        "text": "Add photo option dans les signalement"
      },
      {
        "kind": "feature",
        "text": "Photo upload, refonte UI detail & liste incidents"
      },
      {
        "kind": "fix",
        "text": "City extraction, description in my incidents and photo zoom in detail modal"
      },
      {
        "kind": "feature",
        "text": "Edit profile, change password & delete account with full UI rework"
      },
      {
        "kind": "fix",
        "text": "Validation champs formulaires (caractères spéciaux, longueur max) & décompte description signalement"
      },
      {
        "kind": "fix",
        "text": "Resolve TypeScript strict literal type errors on coords and map delta"
      },
      {
        "kind": "fix",
        "text": "Username char validation & add tests for easter-egg, user-location, color-scheme-web"
      },
      {
        "kind": "improvement",
        "text": "Reorganise architecture & fix session expiry redirect"
      }
    ]
  },
  {
    "version": "1.2.14",
    "date": "2026-06-11",
    "changes": [
      {
        "kind": "fix",
        "scope": "map",
        "text": "Render custom pins on Android and center map on user location"
      }
    ]
  },
  {
    "version": "1.2.13",
    "date": "2026-06-11",
    "changes": [
      {
        "kind": "fix",
        "text": "Pins maps android"
      },
      {
        "kind": "fix",
        "text": "Pins map"
      }
    ]
  },
  {
    "version": "1.2.12",
    "date": "2026-06-11",
    "changes": [
      {
        "kind": "fix",
        "text": "MapPin back to View-based with larger triangle"
      }
    ]
  },
  {
    "version": "1.2.11",
    "date": "2026-06-11",
    "changes": [
      {
        "kind": "fix",
        "text": "Rewrite MapPin with react-native-svg for clean Android rendering and imag splash"
      },
      {
        "kind": "fix",
        "text": "Rewrite MapPin with react-native-svg for clean Android rendering"
      },
      {
        "kind": "fix",
        "text": "Use fond-splash.png on Android with cover mode, drop incorrect imageWidth"
      }
    ]
  },
  {
    "version": "1.2.10",
    "date": "2026-06-10",
    "changes": [
      {
        "kind": "fix",
        "text": "Render MapPin with react-native-svg to fix Android"
      }
    ]
  },
  {
    "version": "1.2.9",
    "date": "2026-06-10",
    "changes": [
      {
        "kind": "fix",
        "text": "Message error and placement bouton signaler"
      },
      {
        "kind": "fix",
        "text": "Bouton de signalement + token"
      },
      {
        "kind": "fix",
        "text": "Messages errors"
      },
      {
        "kind": "fix",
        "text": "Resolve insets declaration order in explore and update tests for new error message"
      },
      {
        "kind": "fix",
        "text": "ThrowFromResponse falls back correctly on empty JSON body"
      }
    ]
  },
  {
    "version": "1.2.8",
    "date": "2026-06-10",
    "changes": [
      {
        "kind": "fix",
        "text": "Resolve Android network issues, auth token decoding, tab bar insets and pipeline improvements"
      }
    ]
  },
  {
    "version": "1.2.7",
    "date": "2026-06-10",
    "changes": [
      {
        "kind": "fix",
        "text": "Mode debug add + injection du trafic réseaux"
      }
    ]
  },
  {
    "version": "1.2.6",
    "date": "2026-06-10",
    "changes": [
      {
        "kind": "fix",
        "text": "Debug endpoint"
      }
    ]
  },
  {
    "version": "1.2.5",
    "date": "2026-06-10",
    "changes": [
      {
        "kind": "fix",
        "text": "Bonne URL de connexion pour la prod avec /api"
      }
    ]
  },
  {
    "version": "1.2.4",
    "date": "2026-06-10",
    "changes": [
      {
        "kind": "fix",
        "text": "Add port url prod"
      },
      {
        "kind": "fix",
        "text": "Test update"
      }
    ]
  },
  {
    "version": "1.2.3",
    "date": "2026-06-10",
    "changes": [
      {
        "kind": "fix",
        "text": "Config url prod"
      }
    ]
  },
  {
    "version": "1.2.2",
    "date": "2026-06-10",
    "changes": [
      {
        "kind": "fix",
        "text": "Config apk avec la prod"
      },
      {
        "kind": "fix",
        "text": "Config avec la prod no OK"
      }
    ]
  },
  {
    "version": "1.2.1",
    "date": "2026-06-09",
    "changes": [
      {
        "kind": "fix",
        "text": "Pipeline and suppression du code more et optimisation"
      },
      {
        "kind": "fix",
        "text": "Add CI/CD step to sync dev with main branch"
      },
      {
        "kind": "fix",
        "text": "Downgrade version to 1.2.0 in package-lock.json"
      },
      {
        "kind": "fix",
        "text": "Downgrade version from 1.2.2 to 1.2.0"
      },
      {
        "kind": "fix",
        "text": "Use merge with theirs strategy for dev sync after release"
      },
      {
        "kind": "fix",
        "text": "Ci et suppression du code mort"
      },
      {
        "kind": "fix",
        "text": "Alignment de dev après le release push sur main"
      },
      {
        "kind": "fix",
        "text": "Connexion avec le back en prod"
      },
      {
        "kind": "fix",
        "text": "Add json-summary reporter to generate coverage-summary.json"
      }
    ]
  },
  {
    "version": "1.2.0",
    "date": "2026-06-09",
    "changes": [
      {
        "kind": "fix",
        "text": "Upgrade Node.js version from 20 to 22 in CI/CD"
      },
      {
        "kind": "feature",
        "text": "Semantic-release and auto release pipeline and liquide glasse"
      },
      {
        "kind": "feature",
        "text": "Semantic-release and auto release pipeline"
      },
      {
        "kind": "feature",
        "text": "Liquid  bottom tab bar and filter  with spring animation"
      },
      {
        "kind": "fix",
        "text": "Move semantic-release plugins to devDeps and sync lockfile on release"
      }
    ]
  },
  {
    "version": "1.1.2",
    "date": "2026-06-09",
    "changes": [
      {
        "kind": "fix",
        "text": "Production config alignée avec prod"
      },
      {
        "kind": "feature",
        "scope": "auth",
        "text": "Login, register, logout, token storage"
      },
      {
        "kind": "feature",
        "text": "Incidents — signalement form, map screen, changement de statut agent/admin"
      },
      {
        "kind": "feature",
        "text": "Incidents — suppression admin, style bottom sheet, fix marker iOS"
      },
      {
        "kind": "feature",
        "text": "Dashboard role-based redesign + refactor (useRole hook, shared constants, IncidentRow, pagination, tab icon)"
      },
      {
        "kind": "feature",
        "scope": "tests",
        "text": "Add unit test suite with coverage reporting"
      },
      {
        "kind": "improvement",
        "text": "Centralise shared logic across services, hooks and constants"
      },
      {
        "kind": "fix",
        "scope": "ci",
        "text": "Add push trigger on main/dev for coverage and auto-tag"
      },
      {
        "kind": "fix",
        "scope": "ci",
        "text": "Use GH_PAT to trigger build workflow on tag push"
      },
      {
        "kind": "fix",
        "scope": "ci",
        "text": "Trigger EAS build on push to main"
      },
      {
        "kind": "fix",
        "scope": "eas",
        "text": "Add android package name for production build"
      },
      {
        "kind": "improvement",
        "text": "Centralise user auth state in AuthContext"
      },
      {
        "kind": "improvement",
        "text": "Centralise all UI strings in constants/strings"
      },
      {
        "kind": "feature",
        "text": "Add dark mode theme support"
      },
      {
        "kind": "feature",
        "scope": "test",
        "text": "Add new tests"
      },
      {
        "kind": "fix",
        "text": "Enforce linear incident status flow (one transition at a time)"
      },
      {
        "kind": "feature",
        "text": "Add production API URL and cleartext traffic config"
      },
      {
        "kind": "fix",
        "text": "Center map on selected incident and cluster nearby markers"
      },
      {
        "kind": "fix",
        "text": "Custom MapPin with active state and remove expo-maps"
      },
      {
        "kind": "feature",
        "text": "Dark mode, AuthContext, tests, prod config & new branding (v1.1.0)"
      }
    ]
  },
  {
    "version": "1.1.1",
    "date": "2026-05-30",
    "changes": [
      {
        "kind": "fix",
        "text": "Map clustering, MapPin active state & pipeline cleanup"
      },
      {
        "kind": "fix",
        "text": "Center map on selected incident and cluster nearby markers"
      },
      {
        "kind": "fix",
        "text": "Custom MapPin with active state and remove expo-maps"
      },
      {
        "kind": "fix",
        "scope": "eas",
        "text": "Add android package name for production build"
      },
      {
        "kind": "feature",
        "text": "Dark mode, AuthContext, tests, prod config & new branding (v1.1.0)"
      },
      {
        "kind": "fix",
        "text": "Enforce linear incident status flow (one transition at a time)"
      },
      {
        "kind": "feature",
        "text": "Add production API URL and cleartext traffic config"
      }
    ]
  },
  {
    "version": "1.1.0",
    "date": "2026-05-29",
    "changes": [
      {
        "kind": "feature",
        "text": "Dark mode, AuthContext, tests, prod config & new branding (v1.1.0)"
      },
      {
        "kind": "fix",
        "text": "Enforce linear incident status flow (one transition at a time)"
      },
      {
        "kind": "feature",
        "text": "Add production API URL and cleartext traffic config"
      },
      {
        "kind": "fix",
        "scope": "eas",
        "text": "Add android package name for production build"
      }
    ]
  },
  {
    "version": "1.0.0",
    "date": "2026-05-23",
    "changes": [
      {
        "kind": "fix",
        "scope": "ci",
        "text": "Trigger EAS build on push to main"
      },
      {
        "kind": "feature",
        "scope": "auth",
        "text": "Login, register, logout, token storage"
      },
      {
        "kind": "feature",
        "text": "Incidents — signalement form, map screen, changement de statut agent/admin"
      },
      {
        "kind": "feature",
        "text": "Incidents — suppression admin, style bottom sheet, fix marker iOS"
      },
      {
        "kind": "feature",
        "text": "Dashboard role-based redesign + refactor (useRole hook, shared constants, IncidentRow, pagination, tab icon)"
      },
      {
        "kind": "feature",
        "scope": "tests",
        "text": "Add unit test suite with coverage reporting"
      },
      {
        "kind": "improvement",
        "text": "Centralise shared logic across services, hooks and constants"
      },
      {
        "kind": "fix",
        "scope": "ci",
        "text": "Add push trigger on main/dev for coverage and auto-tag"
      },
      {
        "kind": "fix",
        "scope": "ci",
        "text": "Use GH_PAT to trigger build workflow on tag push"
      }
    ]
  }
];

/** Dernière version publiée au moment de la génération. */
export const LAST_RELEASED_VERSION = "1.5.5";

/** Changements accumulés depuis, donc embarqués par les pré-versions. */
export const UNRELEASED_CHANGES: Change[] = [
  {
    "kind": "feature",
    "scope": "moderation",
    "text": "Citizens can report content, agents get a queue"
  },
  {
    "kind": "feature",
    "scope": "legal",
    "text": "Terms of use, and an acceptance box at signup"
  },
  {
    "kind": "feature",
    "scope": "privacy",
    "text": "A policy in the app, and real consent for location"
  },
  {
    "kind": "fix",
    "scope": "weather",
    "text": "Honour the location switch"
  },
  {
    "kind": "improvement",
    "scope": "news",
    "text": "Keep the chevron, and lift the share block out of the flow"
  },
  {
    "kind": "improvement",
    "scope": "news",
    "text": "Put the share in a block at the top-right corner"
  },
  {
    "kind": "improvement",
    "scope": "news",
    "text": "Move the share button out of the right edge"
  },
  {
    "kind": "feature",
    "text": "Show status comments, let location be switched off, recentre the map"
  },
  {
    "kind": "feature",
    "text": "Share an event, and give every icon-only button a voice"
  },
  {
    "kind": "fix",
    "scope": "news",
    "text": "Put the description back on the cards"
  },
  {
    "kind": "feature",
    "scope": "news",
    "text": "Group events by period, and gather every notification in one place"
  },
  {
    "kind": "feature",
    "text": "Count down to events, and let the map notice undo its own filters"
  },
  {
    "kind": "feature",
    "text": "Alert when a report appears nearby, and make notification taps open it"
  },
  {
    "kind": "feature",
    "scope": "settings",
    "text": "Sounds, vibration, default feed order and a way to clear local data"
  },
  {
    "kind": "fix",
    "scope": "report",
    "text": "Dismiss the modal instead of stacking a tab over it"
  },
  {
    "kind": "feature",
    "text": "Colour the distance, and show it on a report's details"
  },
  {
    "kind": "feature",
    "scope": "home",
    "text": "Put what distinguishes a row at the top of it"
  },
  {
    "kind": "fix",
    "scope": "home",
    "text": "Actually pass the distance down to the row"
  },
  {
    "kind": "feature",
    "text": "Show how far a report is, and let the guide be swiped"
  },
  {
    "kind": "fix",
    "scope": "report",
    "text": "Stop the duplicate lookup from disturbing the map"
  },
  {
    "kind": "feature",
    "text": "Warn about duplicates, open directions, and search an address on the map"
  },
  {
    "kind": "fix",
    "scope": "updates",
    "text": "Name the channel next to the build rank, not just the rank"
  },
  {
    "kind": "feature",
    "scope": "updates",
    "text": "Give each of the three facts the shape of what it is"
  },
  {
    "kind": "feature",
    "scope": "updates",
    "text": "Give the update window a state, not just a colour"
  },
  {
    "kind": "feature",
    "text": "Catch render errors, and rebuild the update banner on the app's own idiom"
  },
  {
    "kind": "feature",
    "text": "Open news items, and keep the map's last known state"
  },
  {
    "kind": "fix",
    "scope": "home",
    "text": "Give agents and admins the same exact breakdown as citizens"
  },
  {
    "kind": "feature",
    "scope": "news",
    "text": "Read the Haut-Bugey tourist office agenda for the plateau"
  },
  {
    "kind": "feature",
    "scope": "news",
    "text": "Query a point on the map instead of a city agenda"
  },
  {
    "kind": "feature",
    "scope": "news",
    "text": "Add Dijon, Nantes and Toulouse, and widen the coverage radius"
  },
  {
    "kind": "feature",
    "scope": "news",
    "text": "Pick the city from the map, starting with Lyon and Rennes"
  },
  {
    "kind": "fix",
    "scope": "ui",
    "text": "Make the tab pill fit its label, and say when the news key is missing"
  },
  {
    "kind": "feature",
    "scope": "news",
    "text": "Add a what's-on tab fed by the Lyon metropolitan agenda"
  },
  {
    "kind": "fix",
    "scope": "map",
    "text": "Move follow and share out of the sheet header"
  },
  {
    "kind": "feature",
    "scope": "home",
    "text": "Add a followed tab to manage bookmarks"
  },
  {
    "kind": "feature",
    "scope": "app",
    "text": "Alert on followed changes, keep filters, swipe to mark read"
  },
  {
    "kind": "feature",
    "scope": "incidents",
    "text": "Show the bookmark in lists, and stop assuming a single city"
  },
  {
    "kind": "fix",
    "scope": "home",
    "text": "Search my reports by description, and count the whole city"
  },
  {
    "kind": "feature",
    "scope": "home",
    "text": "Merge the duplicated stats and report vote failures"
  },
  {
    "kind": "feature",
    "scope": "home",
    "text": "Show the full picture in the personal record"
  },
  {
    "kind": "fix",
    "scope": "map",
    "text": "Pull the scope filters out of the category scroller"
  },
  {
    "kind": "feature",
    "scope": "incidents",
    "text": "Follow a report you did not create"
  },
  {
    "kind": "feature",
    "scope": "report",
    "text": "Keep several drafts instead of overwriting the last one"
  },
  {
    "kind": "feature",
    "scope": "home",
    "text": "Show a personal record above my reports"
  },
  {
    "kind": "feature",
    "scope": "app",
    "text": "Add a first-run guide, replayable from the side menu"
  },
  {
    "kind": "feature",
    "scope": "ui",
    "text": "Filter the map to my reports, and show skeletons while loading"
  },
  {
    "kind": "feature",
    "scope": "incidents",
    "text": "Search and sort the feed, and add haptics to key gestures"
  },
  {
    "kind": "fix",
    "scope": "i18n",
    "text": "Translate dates and relative durations"
  },
  {
    "kind": "fix",
    "scope": "ui",
    "text": "Ease off the notifications title size"
  },
  {
    "kind": "feature",
    "scope": "ui",
    "text": "Animate the clock digits and restore the tinted notifications header"
  },
  {
    "kind": "fix",
    "scope": "ui",
    "text": "Keep a real view under the gesture detector"
  },
  {
    "kind": "feature",
    "scope": "ui",
    "text": "Make the notifications header a page title"
  },
  {
    "kind": "fix",
    "scope": "ui",
    "text": "Drive the edge gesture from the UI thread, and reshape the header"
  },
  {
    "kind": "feature",
    "scope": "ui",
    "text": "Mount the menu above the tabs and rebuild the notifications header"
  },
  {
    "kind": "fix",
    "scope": "report",
    "text": "Enlarge the discard-draft target and confirm the loss"
  },
  {
    "kind": "feature",
    "scope": "ui",
    "text": "Pair the role badge with the name and split the notifications header"
  },
  {
    "kind": "feature",
    "scope": "home",
    "text": "Rebuild the header block and name the city"
  },
  {
    "kind": "feature",
    "scope": "home",
    "text": "Show current weather under the date"
  },
  {
    "kind": "feature",
    "scope": "ui",
    "text": "Show a clock opposite the logo on the home header"
  },
  {
    "kind": "fix",
    "scope": "tests",
    "text": "Pin the locale so the suite stops depending on the machine"
  },
  {
    "kind": "fix",
    "scope": "i18n",
    "text": "Make the label tables enumerable again"
  },
  {
    "kind": "feature",
    "scope": "incidents",
    "text": "Share a report through the system share sheet"
  },
  {
    "kind": "feature",
    "scope": "ui",
    "text": "Group notifications by day and simplify the language choice"
  },
  {
    "kind": "feature",
    "scope": "i18n",
    "text": "Finish translating the components and business vocabulary"
  },
  {
    "kind": "feature",
    "scope": "i18n",
    "text": "Translate the report, sign-in and sign-up screens"
  },
  {
    "kind": "feature",
    "scope": "i18n",
    "text": "Translate the tab screens"
  },
  {
    "kind": "feature",
    "scope": "i18n",
    "text": "Add French and English dictionaries with a language setting"
  },
  {
    "kind": "fix",
    "scope": "ui",
    "text": "Give modal headers a tinted band and the house accent bar"
  },
  {
    "kind": "feature",
    "scope": "app",
    "text": "Swipe from the right to open the menu, and flag a pending draft"
  },
  {
    "kind": "fix",
    "scope": "ui",
    "text": "Take the light theme down to beige and drop the yellow dividers"
  },
  {
    "kind": "feature",
    "scope": "app",
    "text": "Open the menu from the right edge and soften the light theme"
  },
  {
    "kind": "feature",
    "scope": "app",
    "text": "Add a side menu for release notes, updates and settings"
  },
  {
    "kind": "fix",
    "scope": "ui",
    "text": "Stop the refresh control from swallowing the whole screen"
  },
  {
    "kind": "fix",
    "scope": "release",
    "text": "Quote publish arguments so the update message survives Windows"
  },
  {
    "kind": "fix",
    "scope": "release",
    "text": "Refresh the changelog when publishing an update"
  },
  {
    "kind": "fix",
    "scope": "ui",
    "text": "Dress the pull-to-refresh in the app's colours"
  },
  {
    "kind": "fix",
    "scope": "tests",
    "text": "Import the native runtime manifest by relative path"
  },
  {
    "kind": "fix",
    "scope": "release",
    "text": "Pin the OTA runtime version instead of fingerprinting it"
  },
  {
    "kind": "feature",
    "scope": "offline",
    "text": "Keep drafts, cache the feed and queue reports without network"
  },
  {
    "kind": "feature",
    "scope": "incidents",
    "text": "Page the community feed instead of capping it at 50"
  },
  {
    "kind": "feature",
    "scope": "release",
    "text": "Ship JS fixes over the air with expo-updates"
  },
  {
    "kind": "fix",
    "scope": "ui",
    "text": "Move the build rank inside the channel badge"
  },
  {
    "kind": "fix",
    "scope": "release",
    "text": "Number pre-releases beta.1, beta.2 instead of a timestamp"
  },
  {
    "kind": "fix",
    "scope": "tests",
    "text": "Decouple the changelog tests from the released version"
  }
];
