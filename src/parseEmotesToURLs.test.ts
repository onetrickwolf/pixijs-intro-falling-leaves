import parseEmotesToURLs from './parseEmotesToURLs';

test('FizzBuzz test', () => {
  expect(parseEmotesToURLs({}, 'boop')).toEqual(['1']);
});
