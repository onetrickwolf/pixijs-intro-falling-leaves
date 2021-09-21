import * as PIXI from 'pixi.js';
import tmi from 'tmi.js';

const bunnyImage = require('../assets/bunny.png');

const app = new PIXI.Application({
  resizeTo: window,
  resolution: window.devicePixelRatio || 1,
  backgroundAlpha: 0,
});

document.body.appendChild(app.view);

app.view.style.display = 'inline';

const container = new PIXI.Container();

app.stage.addChild(container);

// Create a new texture
const texture = PIXI.Texture.from(bunnyImage);

// Create a 5x5 grid of bunnies
for (let i = 0; i < 25; i += 1) {
  const bunny = new PIXI.Sprite(texture);
  bunny.anchor.set(0.5);
  bunny.x = (i % 5) * 40;
  bunny.y = Math.floor(i / 5) * 40;
  container.addChild(bunny);
}

// Move container to the center
container.x = app.screen.width / 2;
container.y = app.screen.height / 2;

// Center bunny sprite in local container coordinates
container.pivot.x = container.width / 2;
container.pivot.y = container.height / 2;

// Connect to Twitch chat
const client = new tmi.Client({
  channels: ['moonmoon'],
});

client.connect();

let emoteSprites: PIXI.Sprite[] = []; // Array of emote sprites
const cache: any = {}; // Texture cache

function handleMessage(channel: any, tags: { emotes: {}; }) {
  if (tags.emotes) {
    // TODO: emotes are not in order will need to sort them
    const emotes = Object.keys(tags.emotes);
    emotes.forEach((emote) => {
      console.log(emote);
    });
    const emoteId: string = tags.emotes ? Object.keys(tags.emotes)[0] : '440';
    const emoteLoader = new PIXI.Loader();
    let textureUrl: string = `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/3.0`;
    let loaderOptions: any = {
      loadType: PIXI.LoaderResource.LOAD_TYPE.IMAGE,
      xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BLOB,
    };
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

    let emoteSprite;

    const emoteResource = `emote_${emoteId}`;
    if (!cache[emoteResource]) {
      emoteLoader.add(emoteResource, textureUrl, loaderOptions)
        .load((loader, resources) => {
          if (isVideo) {
            const webmTexture = PIXI.Texture.from(resources[emoteResource].data);
            emoteSprite = new PIXI.Sprite(webmTexture);
            (emoteSprite.texture.baseTexture.resource as any).source.loop = true; // https://github.com/pixijs/pixijs/issues/7810
            cache[emoteResource] = webmTexture;
          } else {
            emoteSprite = new PIXI.Sprite(resources[emoteResource].texture);
            cache[emoteResource] = resources[emoteResource].texture;
          }
          app.stage.addChild(emoteSprite);
          emoteSprites.push(emoteSprite);
          loader.destroy();
        });
    } else {
      console.log('Loaded from cache');
      emoteSprite = new PIXI.Sprite(cache[emoteResource]);
      app.stage.addChild(emoteSprite);
      emoteSprites.push(emoteSprite);
    }
  }
}

client.on('message', handleMessage);

app.ticker.maxFPS = 60;
app.ticker.add((delta: number) => {
  container.rotation -= 0.01 * delta;

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
