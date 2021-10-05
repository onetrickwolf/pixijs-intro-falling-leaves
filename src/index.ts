import * as PIXI from 'pixi.js';
import tmi from 'tmi.js';
import { Layer, Stage } from '@pixi/layers';
import {
  diffuseGroup, normalGroup, lightGroup, PointLight, AmbientLight, DirectionalLight,
} from 'pixi-lights';

import './style.css';

// Has to be imported for global mixins even if not used
// eslint-disable-next-line no-unused-vars
import * as pp from 'pixi-projection';

import { gsap } from 'gsap';
import { RoughEase } from 'gsap/EasePack';
import parseEmotes from './parseEmotes';
import bttvMapper from './bttvMapper';
import applyFallingAnimation from './applyFallingAnimation';
import loadEmotesPixi from './loadEmotesWithPixi';
import setupStats from './setupStats';

gsap.registerPlugin(RoughEase);

const searchParams = new URLSearchParams(window.location.search);

if (searchParams.has('debug')) { setupStats(); }

// Configurations
const config = {
  channel: searchParams.has('channel') ? searchParams.get('channel') : 'moonmoon',
  maxEmotes: 2,
  maxEmoteWidth: 112,
  emotePadding: 4,
  width: 1920,
  height: 1080,
};
Object.freeze(config);

// Set up PixiJS Application
const app = new PIXI.Application({
  width: 1920,
  height: 1080,
  resolution: window.devicePixelRatio || 1,
  backgroundAlpha: 0,
  antialias: true,
});

app.stage = new Stage();

document.body.appendChild(app.view);
app.view.style.display = 'inline';

/**-------------------------
 * Lighting
 --------------------------*/

// Set up bg
const bg = require('../assets/bg.png');
const bgN = require('../assets/bg_n.png');
//
// const bgTexture = PIXI.Texture.from(bg);
// const bgSprite = new PIXI.Sprite(bgTexture);
//
// app.stage.addChild(bgSprite);

// Add the background diffuse color
const diffuse = PIXI.Sprite.from(bg);
diffuse.parentGroup = diffuseGroup;

// Add the background normal map
const normals = PIXI.Sprite.from(bgN);
normals.parentGroup = normalGroup;

// Create the point light
const light = new PointLight(0xffffff, 0.8);
light.x = 1178;
light.y = 1020;

const light2 = new PointLight(0xffffff, 2);
light2.x = 270;
light2.y = 385;

const light3 = new PointLight(0x4d4d59, 0.1);
light3.x = 1340;
light3.y = 915;

gsap.to([light3], {
  duration: 2,
  ease: "rough({ template: none.out, strength: 1, points: 20, taper: 'none', randomize: true, clamp: false})",
  brightness: 1.4,
  repeat: -1,
  yoyo: true,
});

gsap.to([light], {
  duration: 2,
  ease: "rough({ template: none.out, strength: 1, points: 20, taper: 'none', randomize: true, clamp: false})",
  brightness: 1.4,
  repeat: -1,
  yoyo: true,
});

app.stage.addChild(new AmbientLight(0xffffff, 0.6));
app.stage.addChild(new DirectionalLight(0x4d4d59, 5, new PIXI.Point(1, 1)));

const background = new PIXI.Container();
background.addChild(
  normals,
  diffuse,
  light,
  light2,
  light3,
);

app.stage.addChild(
  // put all layers for deferred rendering of normals
  new Layer(diffuseGroup),
  new Layer(normalGroup),
  new Layer(lightGroup),
  // Add the lights and images
  background,
);

/**-------------------------
 * Leaves
 --------------------------*/

// Set up pixi-projection camera
const camera = new pp.Camera3d();
camera.setPlanes(1000);
camera.position.set(app.screen.width / 2, app.screen.height / 2);
camera.sortableChildren = true;
app.stage.addChild(camera);

// Set up standard leaves
const leafImage1 = require('../assets/leaf1.png');
const leafImage2 = require('../assets/leaf2.png');

const leafTexture1 = PIXI.Texture.from(leafImage1);
const leafTexture2 = PIXI.Texture.from(leafImage2);

for (let i = 0; i < 75; i += 1) {
  const texture = i % 2 === 0 ? leafTexture1 : leafTexture2;
  const leaf = new pp.Sprite3d(texture);
  leaf.scale3d.x = 0.1;
  leaf.scale3d.y = 0.1;
  applyFallingAnimation(leaf, app.screen.width, app.screen.height, -1, true, 20);
  leaf.zIndex = 0;
  camera.addChild(leaf);
}

for (let i = 0; i < 20; i += 1) {
  const texture = i % 2 === 0 ? leafTexture1 : leafTexture2;
  const leaf = new pp.Sprite3d(texture);
  leaf.scale3d.x = 0.3;
  leaf.scale3d.y = 0.3;
  applyFallingAnimation(leaf, app.screen.width, app.screen.height, -1, true, 15);
  leaf.zIndex = 100;
  camera.addChild(leaf);
}

for (let i = 0; i < 5; i += 1) {
  const texture = i % 2 === 0 ? leafTexture1 : leafTexture2;
  const leaf = new pp.Sprite3d(texture);
  leaf.scale3d.x = 0.6;
  leaf.scale3d.y = 0.6;
  applyFallingAnimation(leaf, app.screen.width, app.screen.height, -1, true, 7);
  leaf.zIndex = 200;
  camera.addChild(leaf);
}

/**-------------------------
 * Twitch Chat
 --------------------------*/

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

function resize(): void {
  // current screen size
  const screenWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  // uniform scale for our game
  const scale = Math.min(screenWidth / config.width, screenHeight / config.height);

  // the "uniformly englarged" size for our game
  const enlargedWidth = Math.floor(scale * config.width);
  const enlargedHeight = Math.floor(scale * config.height);

  // margins for centering our game
  const horizontalMargin = (screenWidth - enlargedWidth) / 2;
  const verticalMargin = (screenHeight - enlargedHeight) / 2;

  // now we use css trickery to set the sizes and margins
  app.view.style.width = `${enlargedWidth}px`;
  app.view.style.height = `${enlargedHeight}px`;
  app.view.style.marginLeft = app.view.style.marginRight = `${horizontalMargin}px`;
  app.view.style.marginTop = app.view.style.marginBottom = `${verticalMargin}px`;
}

window.addEventListener('resize', resize);

resize();
