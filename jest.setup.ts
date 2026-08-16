// Global setup for Jest — native modules mocked per-test-file as needed,
// à une exception près.
//
// Depuis que le thème est réglable, `useAppColors` lit la préférence de
// l'utilisateur, donc `PreferencesContext`, donc le stockage local. AsyncStorage
// se retrouve ainsi dans l'arbre de *tous* les tests de composants, y compris
// ceux qui ne touchent à aucune donnée. Le mocker fichier par fichier
// reviendrait à recopier la même ligne partout : il est donc simulé ici, une
// fois. Les tests qui manipulent réellement du stockage gardent leur mock
// explicite, qui dit ce qu'ils font.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
