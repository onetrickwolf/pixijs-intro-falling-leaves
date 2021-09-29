import Stats from 'stats.js';

export default function setupStats() {
  const stats1 = new Stats();
  stats1.showPanel(0); // Panel 0 = fps
  stats1.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
  document.body.appendChild(stats1.domElement);

  const stats2 = new Stats();
  stats2.showPanel(2); // Panel 2 = mb
  stats2.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
  document.body.appendChild(stats2.domElement);

  const stats3 = new Stats();
  stats3.showPanel(1); // Panel 1 = ms
  stats3.domElement.style.cssText = 'position:absolute;top:0px;left:160px;';
  document.body.appendChild(stats3.domElement);

  function animate() {
    stats1.update();
    stats2.update();
    stats3.update();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
