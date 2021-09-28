import * as PIXI from 'pixi.js';
import tmi from 'tmi.js';

import './style.css';

// Has to be imported for global mixins even if not used
// eslint-disable-next-line no-unused-vars
import * as pp from 'pixi-projection';

import parseEmotes from './parseEmotes';
import bttvMapper from './bttvMapper';
import applyFallingAnimation from './applyFallingAnimation';
import loadEmotesPixi from './loadEmotesWithPixi';

// Configurations
const config = {
  channel: 'hasanabi',
  maxEmotes: 2,
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

// Set up standard leaves
const leafImage1 = require('../assets/leaf.webp');
const leafImage2 = require('../assets/leaf.png');

const leafTexture1 = PIXI.Texture.from(leafImage1);
const leafTexture2 = PIXI.Texture.from(leafImage2);

for (let i = 0; i < 40; i += 1) {
  const texture = i % 2 === 0 ? leafTexture1 : leafTexture2;
  const leaf = new pp.Sprite3d(texture);
  leaf.scale3d.x = 0.2;
  leaf.scale3d.y = 0.2;
  applyFallingAnimation(leaf, app.screen.width, app.screen.height, -1, true);
  camera.addChild(leaf);
}

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

let emoteContainers: PIXI.Container[] = []; // Array of emote sprites

// Handle messages from chat
async function handleMessage(channel: any, tags: { emotes: {}; }, message: string) {
  const messageEmotes = parseEmotes(tags.emotes, message, bttvMap);
  const messageSprites = await loadEmotesPixi(messageEmotes.slice(0, config.maxEmotes));

  const messageContainer = new pp.Container3d();

  messageSprites.forEach((emoteSprite, index) => {
    const sprite = emoteSprite;

    messageContainer.addChild(sprite);

    sprite.x = (config.maxEmoteWidth + config.emotePadding) * index;
    sprite.width = config.maxEmoteWidth;
    sprite.scale.set(Math.min(sprite.scale.x, sprite.scale.y));
  });

  applyFallingAnimation(messageContainer, app.screen.width, app.screen.height);

  emoteContainers.push(messageContainer);

  camera.addChild(messageContainer);
}

// Cleanup when switching off scene, tickers automatically pause
function sceneHidden() {
  // Destroy all emote sprites so scene is fresh when switching back
  for (let i = 0; i < emoteContainers.length; i += 1) {
    emoteContainers[i].visible = false;
  }
  emoteContainers = [];
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
