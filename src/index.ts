import * as PIXI from 'pixi.js';

const bunnyImage = require('../assets/bunny.png');

const app = new PIXI.Application({
  width: 800, height: 600, backgroundColor: 0x1099bb, resolution: window.devicePixelRatio || 1,
});

document.body.appendChild(app.view);

const container = new PIXI.Container();

// PIXI.Texture.fromURL('https://pixijs.io/examples/examples/assets/video.mp4')
//   .then((texture) => {
//     console.log('this ran');
//     const sprite = new PIXI.Sprite(texture);
//     container.addChild(sprite);
//   })
//   .catch((err) => console.log(err));

// const horse = PIXI.Texture.from('https://upload.wikimedia.org/wikipedia/commons/8/87/Schlossbergbahn.webm');
// const horseSprite = new PIXI.Sprite(horse);
// container.addChild(horseSprite);

const loaderOptions = {
  loadType: PIXI.LoaderResource.LOAD_TYPE.VIDEO,
  // xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BLOB,
  metadata: { mimeType: 'video/webm' },
};

app.loader.add('catJAM', 'https://y6ev4yhjw1.execute-api.us-east-1.amazonaws.com/dev?gif=https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x', loaderOptions).load((loader, resources) => {
  const texture = PIXI.Texture.from(resources.catJAM.data);
  const cat = new PIXI.Sprite(texture);

  // @ts-ignore
  console.log(cat.texture.baseTexture.resource.source.loop);
  // @ts-ignore
  cat.texture.baseTexture.resource.source.loop = true;

  // @ts-ignore
  cat.texture.baseTexture.resource.autoPlay = false;
  container.addChild(cat);
});

app.loader.onProgress.add((loader, resource) => {
  console.log(loader);
  console.log(resource);
}); // called once per loaded/errored file
app.loader.onError.add((loader, resource) => {
  console.log(loader);
  console.log(resource);
}); // called once per errored file
// app.loader.onLoad.add(() => {}); // called once per loaded file
// app.loader.onComplete.add(() => {}); // called once when the queued resources all load.

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

// Listen for animate update
app.ticker.add((delta: number) => {
  // rotate the container!
  // use delta to create frame-independent transform
  container.rotation -= 0.01 * delta;
});
