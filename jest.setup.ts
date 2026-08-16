import { setActiveLanguage } from '@/constants/i18n';

// Global setup for Jest — native modules mocked per-test-file as needed,
// à deux exceptions près.
//
// 1. Depuis que le thème est réglable, `useAppColors` lit la préférence de
//    l'utilisateur, donc `PreferencesContext`, donc le stockage local.
//    AsyncStorage se retrouve ainsi dans l'arbre de *tous* les tests de
//    composants, y compris ceux qui ne touchent à aucune donnée. Le mocker
//    fichier par fichier reviendrait à recopier la même ligne partout : il est
//    donc simulé ici, une fois. Les tests qui manipulent réellement du stockage
//    gardent leur mock explicite, qui dit ce qu'ils font.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// 2. La langue par défaut de l'application est celle de l'appareil, lue via
//    `Intl`. En test, « l'appareil » est la machine qui exécute la suite : elle
//    passait en français sur nos postes et en anglais sur le runner CI, où
//    douze tests attendant des libellés français échouaient — sans qu'une seule
//    ligne de code applicatif soit en cause.
//
//    On fixe donc la locale rapportée, sans toucher au formatage : les dates
//    passent déjà `"fr-FR"` explicitement. Un test qui veut l'autre langue
//    appelle `setActiveLanguage('en')` et le dit.
const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
jest
  .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
  .mockImplementation(function (this: Intl.DateTimeFormat) {
    return { ...resolvedOptions.call(this), locale: 'fr-FR' };
  });

setActiveLanguage('fr');
