import  puppeteer from 'puppeteer';

const pageLoadTimeout = 12000;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.106 Safari/537.36';
const urls = [
    'https://www.airbnb.co.uk/rooms/19278160?s=51&source_impression_id=p3_1581895059_ZtPZKGelgDcZ6zFT', 
    'https://www.airbnb.co.uk/rooms/3707463?adults=1&children=0&infants=0&source_impression_id=p3_1581896202_jLzEAJB%2FlZzv0b52', 
    'https://www.airbnb.co.uk/rooms/6905701?adults=1&children=0&infants=0&source_impression_id=p3_1581895108_Y9lTHN%2BVIcPOmLpd'
];
const pageLoadedSelectors = ['#amenities','[data-plugin-in-point-id="AMENITIES_DEFAULT"]'];
const propertyNameSelectors = ['div[data-testid="title-default"] div > h1'];
const propertyTypeSelectors = ['div[data-plugin-in-point-id="HIGHLIGHTS_DEFAULT"] section > div > div > div:nth-child(2) > div:nth-child(1)'];
const amenitiesSelectors = ['div[data-plugin-in-point-id="AMENITIES_DEFAULT"] section > div > div:nth-child(2) > div > div'];


(async () => {

    const browser = await puppeteer.launch({
        headless : false,
        defaultViewport: null,
    });

    const results = await Promise.all(urls.map(async (url) => {
        try {
            return await scrapePage(browser, url);
        } catch (error) {
            return error;
        }
    }));
    
    console.log('results: ', results);
  
    await browser.close();

})();

async function scrapePage(browser, url){
    const page = await configurePage(browser);
    const loaded = await loadPage(page, url, pageLoadedSelectors);

    if(loaded){
        const propertyName = await getSelectorValue(page, propertyNameSelectors);
        const propertyType = await getSelectorValue(page, propertyTypeSelectors);
        const propertyAmenities = await getAmenities(page, amenitiesSelectors);
        
        return {url, propertyName, propertyType, propertyAmenities};
    }else{
        //:TODO
    }
}

async function configurePage(browser){
    const page = await browser.newPage();
        
    page.userAgent = userAgent;
    
    await page.setViewport({
        width: 1080,
        height: 768,
    });

    return page;
}

async function loadPage(page, url, pageLoadedSelectors){
    await page.goto(url);

    for (const pageLoadedSelector of pageLoadedSelectors){
        try {
            await page.waitForSelector(pageLoadedSelector, {timeout : pageLoadTimeout});
            console.log('page loaded using selector: ', pageLoadedSelector);
            return true
        } catch (error) {
            if (error.name === 'TimeoutError'){
                console.log(`selector ${pageLoadedSelector} not found`);
            }
        }
    }
}

async function getSelectorValue(page, selectors){
    for (const selector of selectors){
        try {
            await page.waitForSelector(selector, {timeout : pageLoadTimeout});
            const data = await page.$(selector);
            const dataHandler = data &&  await data;
            const propertyValue = dataHandler &&  await dataHandler.getProperty('textContent');
            const jsonValue = propertyValue && await propertyValue.jsonValue();
            
            if (jsonValue) return jsonValue;
        } catch (error) {
            console.log(error);
        }
    }
}

async function getAmenities(page, selectors){
    for (const selector of selectors){
        try {
            const data = await page.$$(selector);
            const elementHandles = data && await data;
            let amenities = [];
            for (const elementHandle of elementHandles){
                const propertyValue = await elementHandle.getProperty('textContent');
                const jsonValue = propertyValue && await propertyValue.jsonValue();
                if (jsonValue) amenities.push(jsonValue);
            }
           if (elementHandles) return amenities;
        } catch (error) {
            console.log(error);
        }
    }
}

