import * as PIXI from 'pixi.js';
import tmi from 'tmi.js';

import parseEmotesToURLs from './parseEmotesToURLs';
import bttvMapper from './bttvMapper';

// Set up PixiJS Application
const app = new PIXI.Application({
  resizeTo: window,
  resolution: window.devicePixelRatio || 1,
  backgroundAlpha: 0,
});

document.body.appendChild(app.view);
app.view.style.display = 'inline';

// Configurations
const config = {
  channel: 'onetrickwolf',
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

function handleMessage(channel: any, tags: { emotes: {}; }, message: string) {
  const emotes = parseEmotesToURLs(tags.emotes, message, bttvMap);
  console.log(emotes);
  // processEmotes(emotes);
}

let emoteSprites: PIXI.Sprite[] = []; // Array of emote sprites
const cache: any = {}; // Texture cache

function processEmotes(emotes: string[]) {
  const emoteLoader = new PIXI.Loader();

  let loaderOptions: any = {
    loadType: PIXI.LoaderResource.LOAD_TYPE.IMAGE,
    xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BLOB,
  };

  const cachedEmotes = [];

  emotes.forEach((emote) => {
    const emoteId: string = emote;
    let textureUrl: string = `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/3.0`;
    let isVideo: boolean = false;

    if (emoteId.includes('emotesv2_')) {
      textureUrl = `https://y6ev4yhjw1.execute-api.us-east-1.amazonaws.com/dev?gif=https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`;
      loaderOptions = {
        loadType: PIXI.LoaderResource.LOAD_TYPE.VIDEO,
        // xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BLOB,
        metadata: { mimeType: 'video/webm' },
      };
      isVideo = true;
    }

    const emoteResource = `emote_${emoteId}`;

    if (!cache[emoteResource]) {
      emoteLoader.add(emoteResource, textureUrl, loaderOptions);
    } else {
      cachedEmotes.push(cache[emoteResource]);
    }
  });

  emoteLoader.load((loader, resources) => {
    console.log(resources);
    loader.destroy();
    // if (isVideo) {
    //   const webmTexture = PIXI.Texture.from(resources[emoteResource].data);
    //   emoteSprite = new PIXI.Sprite(webmTexture);
    //   (emoteSprite.texture.baseTexture.resource as any).source.loop = true; // https://github.com/pixijs/pixijs/issues/7810
    //   cache[emoteResource] = webmTexture;
    // } else {
    //   emoteSprite = new PIXI.Sprite(resources[emoteResource].texture);
    //   cache[emoteResource] = resources[emoteResource].texture;
    // }
    // app.stage.addChild(emoteSprite);
    // emoteSprites.push(emoteSprite);
    // loader.destroy();
  });

  let emoteSprite;

  // if (!cache[emoteResource]) {
  //   emoteLoader.load((loader, resources) => {
  //     if (isVideo) {
  //       const webmTexture = PIXI.Texture.from(resources[emoteResource].data);
  //       emoteSprite = new PIXI.Sprite(webmTexture);
  //       (emoteSprite.texture.baseTexture.resource as any).source.loop = true; // https://github.com/pixijs/pixijs/issues/7810
  //       cache[emoteResource] = webmTexture;
  //     } else {
  //       emoteSprite = new PIXI.Sprite(resources[emoteResource].texture);
  //       cache[emoteResource] = resources[emoteResource].texture;
  //     }
  //     app.stage.addChild(emoteSprite);
  //     emoteSprites.push(emoteSprite);
  //     loader.destroy();
  //   });
  // } else {
  //   console.log('Loaded from cache');
  //   emoteSprite = new PIXI.Sprite(cache[emoteResource]);
  //   app.stage.addChild(emoteSprite);
  //   emoteSprites.push(emoteSprite);
  // }
}

app.ticker.maxFPS = 60;
app.ticker.add((delta: number) => {
  bunnyContainer.rotation -= 0.01 * delta;

  for (let i = 0; i < emoteSprites.length; i += 1) {
    emoteSprites[i].x += delta;
  }
});

// Cleanup when switching off scene, tickers automatically pause
function sceneHidden() {
  // Destroy all emote sprites so scene is fresh when switching back
  for (let i = 0; i < emoteSprites.length; i += 1) {
    emoteSprites[i].destroy();
  }
  emoteSprites = [];
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
}
