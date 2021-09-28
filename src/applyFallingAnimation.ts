import { gsap } from 'gsap';
import { Container3d } from 'pixi-projection';

export default function applyFallingAnimation(
  container: Container3d, width: number, height: number,
): void {
  const messageContainer = container;

  const xMin = -(width / 2);
  const xMax = width / 2;
  const yMin = -(height / 2) - 500; // Visible math too hard...just minus 500 :)
  const yMax = (height / 2) + 500;
  const zMin = 0;
  const zMax = 400;

  messageContainer.position3d.x = gsap.utils.random(xMin, xMax);
  messageContainer.position3d.y = yMin;
  messageContainer.position3d.z = gsap.utils.random(zMin, zMax);

  messageContainer.pivot3d.x = gsap.utils.random(0, messageContainer.width);

  const fall = gsap.utils.random(6, 15);
  const eulerZ = gsap.utils.random(4, 8);
  const eulerY = gsap.utils.random(2, 8);

  gsap.to(messageContainer.position3d, {
    duration: fall,
    ease: 'none',
    y: yMax, // Not gonna do the math to make sure it's not visible...
    onComplete: () => {
      messageContainer.destroy();
    },
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
