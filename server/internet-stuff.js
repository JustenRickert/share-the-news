const selectors = ["article h1", "h1"];

async function findHeadline(page) {
  for (let s of selectors) {
    const headline = await page
      .$eval(s, node => node.textContent)
      .catch(() => null);
    if (headline) return headline;
  }
}

export async function retrieveHeadlineFromInternet(puppeteerBrowser, href) {
  const page = await puppeteerBrowser.newPage();
  await page.goto(href);
  const headline = await findHeadline(page);
  await page.close();
  return headline;
}
