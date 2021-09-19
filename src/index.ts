import * as PIXI from 'pixi.js';

const app = new PIXI.Application({
  width: 800, height: 600, backgroundColor: 0x1099bb, resolution: window.devicePixelRatio || 1,
});

document.body.appendChild(app.view);

const button = new PIXI.Graphics()
  .beginFill(0x0, 0.5)
  .drawRoundedRect(0, 0, 100, 100, 10)
  .endFill()
  .beginFill(0xffffff)
  .moveTo(36, 30)
  .lineTo(36, 70)
  .lineTo(70, 50);

button.x = (app.screen.width - button.width) / 2;
button.y = (app.screen.height - button.height) / 2;

button.interactive = true;
button.buttonMode = true;

app.stage.addChild(button);

function onPlayVideo() {
  const container = new PIXI.Container();

  const loaderOptions = {
    loadType: PIXI.LoaderResource.LOAD_TYPE.VIDEO,
    // xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BLOB,
    metadata: { mimeType: 'video/webm' },
  };

  app.loader.add('video', 'https://upload.wikimedia.org/wikipedia/commons/8/87/Schlossbergbahn.webm', loaderOptions)
    .load((loader, resources) => {
      const texture = PIXI.Texture.from(resources.video.data);
      const video = new PIXI.Sprite(texture);

      // TS2339: Property 'source' does not exist on type 'Resource'.
      // @ts-ignore
      video.texture.baseTexture.resource.source.loop = true;

      container.addChild(video);
    });

  app.stage.addChild(container);
}

button.on('pointertap', onPlayVideo);
