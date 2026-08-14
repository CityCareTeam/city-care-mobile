// Généré par `npm run changelog` — ne pas modifier à la main.
// Pour reformuler une version à destination des utilisateurs, passez par
// `constants/changelog-overrides.ts`.

import type { Change, ReleaseNote } from "@/types/changelog";

export const GENERATED_CHANGELOG: ReleaseNote[] = [
  {
    "version": "1.5.4",
    "date": "2026-06-16",
    "changes": [
      {
        "kind": "fix",
        "text": "Add silent auto-refresh polling for incidents list, status and votes"
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
        "text": "Use merge with theirs strategy for dev sync after release"
      },
      {
        "kind": "fix",
        "text": "Ci et suppression du code mort"
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
        "kind": "fix",
        "scope": "ci",
        "text": "Add push trigger on main/dev for coverage and auto-tag"
      },
      {
        "kind": "improvement",
        "text": "Centralise shared logic across services, hooks and constants"
      },
      {
        "kind": "feature",
        "scope": "tests",
        "text": "Add unit test suite with coverage reporting"
      },
      {
        "kind": "feature",
        "text": "Dashboard role-based redesign + refactor (useRole hook, shared constants, IncidentRow, pagination, tab icon)"
      },
      {
        "kind": "feature",
        "text": "Incidents — suppression admin, style bottom sheet, fix marker iOS"
      },
      {
        "kind": "feature",
        "text": "Incidents — signalement form, map screen, changement de statut agent/admin"
      }
    ]
  }
];

/** Dernière version publiée au moment de la génération. */
export const LAST_RELEASED_VERSION = "1.5.4";

/** Changements accumulés depuis, donc embarqués par les pré-versions. */
export const UNRELEASED_CHANGES: Change[] = [
  {
    "kind": "fix",
    "scope": "release",
    "text": "Build release notes from git history"
  },
  {
    "kind": "fix",
    "scope": "release",
    "text": "Label pre-release builds and auto-increment versionCode"
  },
  {
    "kind": "fix",
    "scope": "ui",
    "text": "Remove grey slab on Android surfaces and make the tab indicator draggable"
  },
  {
    "kind": "fix",
    "scope": "notifications",
    "text": "Require an explicit tap to delete and virtualise the list"
  },
  {
    "kind": "fix",
    "text": "Refresh screens on focus and recover after network loss"
  },
  {
    "kind": "fix",
    "scope": "map",
    "text": "Use majority status for cluster colour and flag dense areas"
  },
  {
    "kind": "fix",
    "scope": "map",
    "text": "Repair marker rasterisation and restore missing pins when zoomed"
  }
];
