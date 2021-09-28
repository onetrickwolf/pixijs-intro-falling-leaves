import * as PIXI from 'pixi.js';
import tmi from 'tmi.js';
import { gsap } from 'gsap';

import * as dat from 'dat.gui';

// Has to be imported for global mixins even if not used
// eslint-disable-next-line no-unused-vars
import * as pp from 'pixi-projection';

import parseEmotesToURLs from './parseEmotesToURLs';
import bttvMapper from './bttvMapper';

const bunnyImage = require('../assets/bunny.png');

// Set up PixiJS Application
const app = new PIXI.Application({
  resizeTo: window,
  resolution: window.devicePixelRatio || 1,
  backgroundAlpha: 0,
  antialias: true,
});

document.body.appendChild(app.view);
app.view.style.display = 'inline';

// Configurations
const config = {
  channel: 'onetrickwolf',
  maxEmoteWidth: 112,
  emotePadding: 4,
};

Object.freeze(config);

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

const camera = new pp.Camera3d();
camera.setPlanes(1000);

const texture = PIXI.Texture.from('https://static-cdn.jtvnw.net/emoticons/v2/304734759/default/dark/3.0');
const bunny = new pp.Sprite3d(texture);
bunny.anchor.set(0.5, 0.5);
bunny.scale.set(1);
camera.addChild(bunny);

const gui = new dat.GUI({ autoPlace: true });

const bunnyFolder = gui.addFolder('Bunny');
bunnyFolder.add(bunny.position3d, 'x', -1 * (app.screen.width / 2), app.screen.width / 2);
bunnyFolder.add(bunny.position3d, 'y', -1 * (app.screen.height / 2) - 400, app.screen.height / 2 + 400);
bunnyFolder.add(bunny.position3d, 'z', -1000, 1000);
bunnyFolder.add(bunny.euler, 'x', 0, 360 * (Math.PI / 180)).name('euler x');
bunnyFolder.add(bunny.euler, 'y', 0, 360 * (Math.PI / 180)).name('euler y');
bunnyFolder.add(bunny.euler, 'z', 0, 360 * (Math.PI / 180)).name('euler z');
bunnyFolder.open();

const cameraFolder = gui.addFolder('Camera');

const cameraOptions = {
  focus: camera.focus,
  near: camera.near,
  far: camera.far,
  ortographic: false,
};

cameraFolder.add(cameraOptions, 'focus', 0, 1000)
  .onChange((value) => {
    camera.setPlanes(value, camera.near, camera.far, camera.ortographic);
  });
cameraFolder.add(cameraOptions, 'near', 0, 100)
  .onChange((value) => {
    camera.setPlanes(camera.focus, value, camera.far, camera.ortographic);
  });
cameraFolder.add(cameraOptions, 'far', 0, 50000)
  .onChange((value) => {
    camera.setPlanes(camera.focus, camera.near, value, camera.ortographic);
  });
cameraFolder.add(cameraOptions, 'ortographic')
  .onChange((value) => {
    camera.setPlanes(camera.focus, camera.near, camera.far, value);
  });
cameraFolder.add(camera.position3d, 'z', -1000, 1000);
cameraFolder.open();

camera.position.set(app.screen.width / 2, app.screen.height / 2);
app.stage.addChild(camera);

async function handleMessage(channel: any, tags: { emotes: {}; }, message: string) {
  const messageEmotes = parseEmotesToURLs(tags.emotes, message, bttvMap);
  const messageSprites = await loadEmotesPixi(messageEmotes);

  const messageContainer = new pp.Container3d();
  messageSprites.forEach((emoteSprite, index) => {
    const sprite = emoteSprite;

    messageContainer.addChild(sprite);

    sprite.x = (config.maxEmoteWidth + config.emotePadding) * index;
    sprite.width = config.maxEmoteWidth;
    sprite.scale.set(Math.min(sprite.scale.x, sprite.scale.y));

    camera.addChild(messageContainer);
  });

  emoteContainers.push(messageContainer);

  const w = window.innerWidth;
  const h = window.innerHeight;
  messageContainer.position3d.x = gsap.utils.random(-1 * (app.screen.width / 2), app.screen.width / 2);
  messageContainer.position3d.y = (-1 * (app.screen.height / 2)) - 500; // - messageContainer.height;
  messageContainer.position3d.z = gsap.utils.random(0, 400);

  messageContainer.pivot3d.x = gsap.utils.random(0, messageContainer.width);

  const fall = gsap.utils.random(6, 15);
  const eulerZ = gsap.utils.random(4, 8);
  const eulerY = gsap.utils.random(2, 8);

  gsap.to(messageContainer.position3d, {
    duration: fall,
    ease: 'none',
    y: (app.screen.height / 2) + 500, // Not gonna do the math to make sure it's not visible...
    repeat: -1,
  });
  gsap.to(messageContainer.euler, {
    duration: eulerZ,
    ease: 'sine.inOut',
    z: gsap.utils.random(0, 180) * (Math.PI / 180),
    repeat: -1,
    yoyo: true,
  });
  gsap.to(messageContainer.euler, {
    duration: eulerY,
    ease: 'sine.inOut',
    y: gsap.utils.random(0, 360) * (Math.PI / 180),
    repeat: -1,
    yoyo: true,
  });
}

// TODO: Abstract this to it's own module
const cache: any = {}; // Texture cache

function loadEmotesPixi(emotes: any[]): Promise<PIXI.Sprite[]> {
  return new Promise((resolve) => {
    const emoteLoader = new PIXI.Loader();
    const spriteArray: PIXI.Sprite[] = [];

    const cachedQueue: [index:number, emoteId:string][] = [];

    emotes.forEach((emote, index) => {
      let { url, emoteId } = emote;
      emoteId = `emote_${emoteId}`;

      // Default static image loader options
      let loaderOptions: any = {
        loadType: PIXI.LoaderResource.LOAD_TYPE.IMAGE,
        xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BLOB,
        metadata: { emoteIndex: index },
      };

      // Adjust loader options if loading webm
      if (emote.imageType === 'animated') {
        loaderOptions = {
          loadType: PIXI.LoaderResource.LOAD_TYPE.VIDEO,
          metadata: {
            mimeType: 'video/webm',
            emoteIndex: index,
          },
        };
        // Pipe through API to convert GIF to WebM
        url = `https://y6ev4yhjw1.execute-api.us-east-1.amazonaws.com/dev?gif=${url}`;
      }
      if (!cache[emoteId]) {
        cache[emoteId] = 'pending'; // Pending while texture loads
        emoteLoader.add(emoteId, url, loaderOptions);
      } else {
        // Defer loading from cache until after loading is complete in case any non-cached
        // duplicates exist
        cachedQueue.push([index, emoteId]);
      }
    });

    emoteLoader.load((loader, resources) => {
      Object.entries(resources)
        .forEach(([emoteId, resource]) => {
          const isAnimated = (resource.data.localName === 'video');

          // @ts-ignore
          // Abusing meta data a bit to pass ordering informing to simplify
          const index = resource.metadata.emoteIndex;

          let emoteSprite;

          if (isAnimated) {
            const webmTexture = PIXI.Texture.from(resource.data);
            emoteSprite = new PIXI.Sprite(webmTexture);
            (emoteSprite.texture.baseTexture.resource as any).source.loop = true; // https://github.com/pixijs/pixijs/issues/7810
          } else {
            emoteSprite = new PIXI.Sprite(resource.texture);
          }
          cache[emoteId] = emoteSprite.texture;
          spriteArray[index] = emoteSprite;
        });
      cachedQueue.forEach(([index, emoteId]) => {
        // TODO: Multiple messages with the same emote in rapid succession for the first time
        //  leads to trying to pull from cache before cache is ready. The pending solution will
        //  cause a gap in emotes. Would be rare and only happy until emote is loaded. A better
        //  solution may be creating a queue for messages and processing them one by one. This would
        //  ensure proper message order too.
        if (cache[emoteId] !== 'pending') {
          spriteArray[index] = new PIXI.Sprite(cache[emoteId]);
        }
      });

      loader.destroy();
      return resolve(spriteArray);
    });
  });
}

app.ticker.maxFPS = 120;
app.ticker.add((delta: number) => {
  for (let i = 0; i < emoteContainers.length; i += 1) {
    // emoteContainers[i].x += delta;
    // console.log(emoteContainers[i].x);
  }
});
// TODO: Cleanup currently breaks GSAP
// Cleanup when switching off scene, tickers automatically pause
function sceneHidden() {
  gsap.globalTimeline.clear();
  // Destroy all emote sprites so scene is fresh when switching back
  for (let i = 0; i < emoteContainers.length; i += 1) {
    emoteContainers[i].destroy();
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

// Rotating buns for debugging and benchmarking

const bunnyContainer = new PIXI.Container();

app.stage.addChild(bunnyContainer);

setupBunny();
function setupBunny() {
  // Create a new texture
  const texture = PIXI.Texture.from(bunnyImage);

  // Create a 5x5 grid of bunnies
  for (let i = 0; i < 25; i += 1) {
    const bunny = new PIXI.Sprite(texture);
    bunny.anchor.set(0.5);
    bunny.x = (i % 5) * 40;
    bunny.y = Math.floor(i / 5) * 40;
    bunnyContainer.addChild(bunny);
  }

  // Move container to the center
  bunnyContainer.x = app.screen.width / 2;
  bunnyContainer.y = app.screen.height / 2;

  // Center bunny sprite in local container coordinates
  bunnyContainer.pivot.x = bunnyContainer.width / 2;
  bunnyContainer.pivot.y = bunnyContainer.height / 2;

  app.ticker.add((delta: number) => {
    bunnyContainer.rotation -= 0.01 * delta;
  });
}
