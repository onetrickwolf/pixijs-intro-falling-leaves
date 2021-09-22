import * as PIXI from 'pixi.js';
import tmi from 'tmi.js';

import parseEmotesToURLs from './parseEmotesToURLs';
import bttvMapper from './bttvMapper';

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

async function handleMessage(channel: any, tags: { emotes: {}; }, message: string) {
  const messageEmotes = parseEmotesToURLs(tags.emotes, message, bttvMap);
  const messageSprites = await loadEmotesPixi(messageEmotes);

  const messageContainer = new PIXI.Container();
  messageSprites.forEach((emoteSprite, index) => {
    const sprite = emoteSprite;

    messageContainer.addChild(sprite);
    sprite.anchor.set(0.5);
    sprite.x = (config.maxEmoteWidth + config.emotePadding) * index;
    sprite.width = config.maxEmoteWidth;
    sprite.scale.set(Math.min(sprite.scale.x, sprite.scale.y));

    messageContainer.y = config.maxEmoteWidth / 2;
    messageContainer.scale.set(0.5, 0.5);

    app.stage.addChild(messageContainer);
  });
  emoteContainers.push(messageContainer);
}

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
        url = `https://y6ev4yhjw1.execute-api.us-east-1.amazonaws.com/dev?gif=${url}`;
      }
      if (!cache[emoteId]) {
        cache[emoteId] = {}; // Empty object to defer cache in case duplicates are already loading
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
        spriteArray[index] = new PIXI.Sprite(cache[emoteId]);
      });

      loader.destroy();
      return resolve(spriteArray);
    });
  });
}

app.ticker.maxFPS = 120;
app.ticker.add((delta: number) => {
  for (let i = 0; i < emoteContainers.length; i += 1) {
    emoteContainers[i].x += delta;
  }
});

// Cleanup when switching off scene, tickers automatically pause
function sceneHidden() {
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
const bunnyImage = require('../assets/bunny.png');

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
