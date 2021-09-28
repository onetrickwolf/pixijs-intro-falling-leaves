import * as PIXI from 'pixi.js';

const cache: any = {}; // Texture cache

export default function loadEmotesPixi(emotes: any[]): Promise<PIXI.Sprite[]> {
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
        // TODO: Multiple messages with the same animated emote in rapid succession for the first
        //  time leads to trying to pull from cache before cache is ready. The pending solution will
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
