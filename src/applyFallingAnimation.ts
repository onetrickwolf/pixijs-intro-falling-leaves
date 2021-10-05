import { gsap } from 'gsap';
import { Container3d, Sprite3d } from 'pixi-projection';

export default function applyFallingAnimation(
  container: Container3d | Sprite3d,
  width: number,
  height: number,
  repeat: number = 0,
  randomDelay: boolean = false,
  speed: number = 10,
): void {
  const messageContainer = container;

  const getRandom = weightedRandom([0, width / 2, width], 'sine.out');

  const weight = getRandom();

  const xMin = -(width / 2) + (weight * gsap.utils.random(0.1, 1));
  const xMax = width / 2;
  const yMin = -(height / 2) - 400; // Visible math too hard...just plus or minus a bunch :)
  const yMax = (height / 2) + 400;
  const zMin = 0;
  const zMax = 400;

  messageContainer.position3d.x = gsap.utils.random(xMin, xMax, 1);
  messageContainer.position3d.y = yMin;
  messageContainer.position3d.z = gsap.utils.random(zMin, zMax, 1);

  messageContainer.zIndex = 150;

  messageContainer.pivot3d.x = gsap.utils.random(0, messageContainer.width, 1);

  const fall = speed; // gsap.utils.random(12, 20);
  const eulerZ = gsap.utils.random(4, 8);
  const eulerXY = gsap.utils.random(2, 8);

  gsap.to(messageContainer.position3d, {
    duration: fall,
    ease: 'none',
    y: yMax,
    repeat,
    onComplete: () => {
      messageContainer.parent.removeChild(messageContainer);
      messageContainer.destroy({ children: true, baseTexture: true });
    },
    onRepeat: () => {
      messageContainer.position3d.x = gsap.utils.random(xMin, xMax, 1);
      // @ts-ignore
      messageContainer.vx = 0;
    },
  }).delay(randomDelay ? gsap.utils.random(-12, 12) : 0);

  // TODO: No idea why I have to do and if else here, if I set the repeat in any other way it starts
  //  to glitch...

  if (repeat !== -1) {
    gsap.to(messageContainer.euler, {
      duration: eulerZ,
      ease: 'sine.inOut',
      z: () => gsap.utils.random(0, 180) * (Math.PI / 180),
      repeat: (fall / eulerZ) - 1,
      repeatRefresh: true,
      yoyo: true,
    });
    gsap.to(messageContainer.euler, {
      duration: eulerXY,
      ease: 'sine.inOut',
      x: () => gsap.utils.random(0, 360) * (Math.PI / 180),
      y: () => gsap.utils.random(0, 360) * (Math.PI / 180),
      repeat: (fall / eulerXY) - 1,
      repeatRefresh: true,
      yoyo: true,
    });
  } else {
    gsap.to(messageContainer.euler, {
      duration: eulerZ,
      ease: 'sine.inOut',
      z: () => gsap.utils.random(0, 180) * (Math.PI / 180),
      repeat: -1,
      repeatRefresh: true,
      yoyo: true,
    });
    gsap.to(messageContainer.euler, {
      duration: eulerXY,
      ease: 'sine.inOut',
      x: () => gsap.utils.random(0, 360) * (Math.PI / 180),
      y: () => gsap.utils.random(0, 360) * (Math.PI / 180),
      repeat: -1,
      repeatRefresh: true,
      yoyo: true,
    });
  }
}

function weightedRandom(collection: string | any[], ease: string | gsap.EaseFunction) {
  return gsap.utils.pipe(
    Math.random, // random number between 0 and 1
    gsap.parseEase(ease), // apply the ease
    gsap.utils.mapRange(0, 1, -0.5, collection.length - 0.5),
    gsap.utils.snap(1), // snap to the closest integer
    (i) => collection[i], // return that element from the array
  );
}
