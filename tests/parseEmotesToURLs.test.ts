import parseEmotesToURLs from '../src/parseEmotesToURLs';
import bttvMapper from '../src/bttvMapper';

const bttvMapSample = bttvMapper(require('./bttvMock.json'));

const emoteSample1 = JSON.parse('{"301948071":["0-6"],"301948074":["8-14"]}');
const messageSample1 = 'moon2EE moon2LL';

test('Non-animated Twitch emotes', () => {
  expect(parseEmotesToURLs(emoteSample1, messageSample1)).toMatchSnapshot();
});

const emoteSample2 = JSON.parse('{"emotesv2_553fbd45762b4387b204c53285a93dbb":["0-7"],"emotesv2_447df256f3b1412b9fa0dfd3e9b6d84c":["9-17"]}');
const messageSample2 = 'moon2JAM moon2SPIN';

test('Animated Twitch emotes', () => {
  expect(parseEmotesToURLs(emoteSample2, messageSample2)).toMatchSnapshot();
});

const emoteSample3 = JSON.parse('{"304734759":["0-8","20-28"],"emotesv2_447df256f3b1412b9fa0dfd3e9b6d84c":["10-18"]}');
const messageSample3 = 'moon2CUTE moon2SPIN moon2CUTE';

test('Duplicate Twitch emotes', () => {
  expect(parseEmotesToURLs(emoteSample3, messageSample3)).toMatchSnapshot();
});

const emoteSample4 = { };
const messageSample4 = 'lulWut HYPERCLAP';

test('BTTV emotes', () => {
  expect(parseEmotesToURLs(emoteSample4, messageSample4, bttvMapSample)).toMatchSnapshot();
});

const emoteSample5 = JSON.parse('{"304734759":["0-8","17-25"]}');
const messageSample5 = 'moon2CUTE catJAM moon2CUTE';

test('BTTV emotes mixed', () => {
  expect(parseEmotesToURLs(emoteSample5, messageSample5, bttvMapSample)).toMatchSnapshot();
});

// TODO: BTTV emotes
