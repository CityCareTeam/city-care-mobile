export type ChangeKind = "feature" | "improvement" | "fix";

export type Change = {
  kind: ChangeKind;
  /** Portée du commit conventionnel, quand il en avait une. */
  scope?: string;
  text: string;
};

export type ReleaseNote = {
  /** Numéro livré, sans le `v` du tag ni suffixe de pré-version. */
  version: string;
  /** `AAAA-MM-JJ`, date du tag. */
  date: string;
  /** Une phrase de résumé, ajoutée à la main via les surcharges. */
  headline?: string;
  changes: Change[];
};

/** Un palier mineur — `1.5` — et les correctifs qu'il a reçus. */
export type ReleaseGroup = {
  /** `1.5` */
  minor: string;
  /** Version la plus récente du palier, la plus ancienne en dernier. */
  releases: ReleaseNote[];
  /** Date de la version la plus récente du palier. */
  latestDate: string;
  changeCount: number;
};
