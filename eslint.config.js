// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['StyleSheet'],
              message: 'Use Uniwind className utilities instead of React Native StyleSheet.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='StyleSheet'][property.name='create']",
          message: 'Use Uniwind className utilities instead of StyleSheet.create.',
        },
        {
          selector: "MemberExpression[object.name='StyleSheet'][property.name='hairlineWidth']",
          message: 'Use Uniwind classes/tokens instead of StyleSheet.hairlineWidth.',
        },
      ],
    },
  },
]);
