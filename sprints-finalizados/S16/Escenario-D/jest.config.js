module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|@react-navigation|@notifee|@react-native-firebase|@react-native-google-signin|react-native-vector-icons)/'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/supabase/functions/'
  ]
};
