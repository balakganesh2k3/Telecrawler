import { chromium } from 'playwright';

export class CustomCrawler {
  async fetchPage(url) {
    console.log(`Crawling ${url}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      
      // Extract text content
      const textContent = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(script => script.remove());
        
        // Get text from body
        return document.body.innerText;
      });

      // Extract metadata
      const title = await page.title();
      const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
      
      // Extract all images
      const images = await page.evaluate(() => {
        return Array.from(document.images).map(img => ({
          src: img.src,
          alt: img.alt
        }));
      });

      // Extract all links
      const links = await page.evaluate(() => {
        return Array.from(document.links).map(link => ({
          href: link.href,
          text: link.textContent.trim()
        }));
      });

      await browser.close();

      // Format the extracted content
      const content = {
        title,
        description,
        url,
        textContent: textContent.trim(),
        images: images.slice(0, 10), // Limit to first 10 images
        links: links.slice(0, 10)    // Limit to first 10 links
      };

      return content;

    } catch (error) {
      await browser.close();
      throw new Error(`Error crawling ${url}: ${error.message}`);
    }
  }
}