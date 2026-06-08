const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8081/index.html');
  await page.waitForTimeout(1000);
  const img = await page.$('.node-media img');
  if(img) {
    console.log('Image found, clicking...');
    await img.click();
    await page.waitForTimeout(500);
    const lightbox = await page.$('.image-lightbox');
    const isHidden = await lightbox.evaluate(el => el.hidden);
    const hasClass = await lightbox.evaluate(el => el.classList.contains('is-open'));
    const isVisible = await lightbox.isVisible();
    console.log('Lightbox hidden property:', isHidden, 'hasClass is-open:', hasClass, 'isVisible:', isVisible);
  } else {
    console.log('Image not found!');
  }
  await browser.close();
})();
