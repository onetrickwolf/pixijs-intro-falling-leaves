import parseEmotesToURLs from './parseEmotesToURLs';

const emoteSample1 = JSON.parse('{"301948071":["0-6"],"301948074":["8-14"]}');
const messageSample1 = 'moon2EE moon2LL';

test('Non-animated Twitch emotes have proper URLs and order', () => {
  expect(parseEmotesToURLs(emoteSample1, messageSample1)).toMatchSnapshot();
});

const emoteSample2 = JSON.parse('{"emotesv2_553fbd45762b4387b204c53285a93dbb":["0-7"],"emotesv2_447df256f3b1412b9fa0dfd3e9b6d84c":["9-17"]}');
const messageSample2 = 'moon2JAM moon2SPIN';

test('Animated Twitch emotes have proper URLs and order', () => {
  expect(parseEmotesToURLs(emoteSample2, messageSample2)).toMatchSnapshot();
});

const emoteSample3 = JSON.parse('{"304734759":["0-8","20-28"],"emotesv2_447df256f3b1412b9fa0dfd3e9b6d84c":["10-18"]}');
const messageSample3 = 'moon2CUTE moon2SPIN moon2CUTE';

test('Duplicate Twitch emotes have proper URLs and order', () => {
  expect(parseEmotesToURLs(emoteSample3, messageSample3)).toMatchSnapshot();
});

// TODO: BTTV emotes
