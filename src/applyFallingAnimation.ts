import { gsap } from 'gsap';
import { Container3d, Sprite3d } from 'pixi-projection';

export default function applyFallingAnimation(
  container: Container3d | Sprite3d,
  width: number,
  height: number,
  repeat: number = 0,
  randomDelay: boolean = false,
): void {
  const messageContainer = container;

  const xMin = -(width / 2);
  const xMax = width / 2;
  const yMin = -(height / 2) - 400; // Visible math too hard...just plus or minus a bunch :)
  const yMax = (height / 2) + 400;
  const zMin = 0;
  const zMax = 400;

  messageContainer.position3d.x = gsap.utils.random(xMin, xMax);
  messageContainer.position3d.y = yMin;
  messageContainer.position3d.z = gsap.utils.random(zMin, zMax);

  messageContainer.pivot3d.x = gsap.utils.random(0, messageContainer.width);

  const fall = gsap.utils.random(12, 20);
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
