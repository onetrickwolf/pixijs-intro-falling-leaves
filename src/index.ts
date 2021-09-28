import * as PIXI from 'pixi.js';
import tmi from 'tmi.js';

// Has to be imported for global mixins even if not used
// eslint-disable-next-line no-unused-vars
import * as pp from 'pixi-projection';

import parseEmotes from './parseEmotes';
import bttvMapper from './bttvMapper';
import applyFallingAnimation from './applyFallingAnimation';
import loadEmotesPixi from './loadEmotesWithPixi';

// Configurations
const config = {
  channel: 'onetrickwolf',
  maxEmoteWidth: 112,
  emotePadding: 4,
};
Object.freeze(config);

// Set up PixiJS Application
const app = new PIXI.Application({
  resizeTo: window,
  resolution: window.devicePixelRatio || 1,
  backgroundAlpha: 0,
  antialias: true,
});

document.body.appendChild(app.view);
app.view.style.display = 'inline';

// Set up pixi-projection camera
const camera = new pp.Camera3d();
camera.setPlanes(1000);
camera.position.set(app.screen.width / 2, app.screen.height / 2);
app.stage.addChild(camera);

// Connect to Twitch chat
const client = new tmi.Client({
  channels: [config.channel],
});
client.connect();

let bttvMap: any = {};

client.on('connected', async () => {
  const response = await fetch(`https://gif-emotes.opl.io/channel/username/${config.channel}.js`);
  bttvMap = bttvMapper(await response.json());

  client.on('message', handleMessage);
});

// Handle messages from chat
async function handleMessage(channel: any, tags: { emotes: {}; }, message: string) {
  const messageEmotes = parseEmotes(tags.emotes, message, bttvMap);
  const messageSprites = await loadEmotesPixi(messageEmotes);

  const messageContainer = new pp.Container3d();

  messageSprites.forEach((emoteSprite, index) => {
    const sprite = emoteSprite;

    messageContainer.addChild(sprite);

    sprite.x = (config.maxEmoteWidth + config.emotePadding) * index;
    sprite.width = config.maxEmoteWidth;
    sprite.scale.set(Math.min(sprite.scale.x, sprite.scale.y));
  });

  applyFallingAnimation(messageContainer, app.screen.width, app.screen.height);

  camera.addChild(messageContainer);
}

// Cleanup when switching off scene, tickers automatically pause
function sceneHidden() {
  // Remove listeners
  client.removeAllListeners('message');
  // TODO: Would ideally close the connection to Twitch fully but this may cause issues if the
  //  promises are not handled carefully
}

// What to do when switching to scene
function sceneVisible() {
  client.on('message', handleMessage);
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') {
    sceneHidden();
  } else {
    sceneVisible();
  }
});
