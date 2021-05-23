const puppeteer = require('puppeteer');
const https = require('https');
const assert = require('assert');
const axios = require('axios');

(async () => {
    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: true,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    const url = "http://localhost:8080";
    await page.goto(url);

    await page.waitForTimeout(1000)
    await page.type('#authorization-endpoint-input', "https://localhost:8443/cas/oauth2.0/authorize");
    await page.type('#client-id-input', "f28ace49");
    await page.type('#scope-input', "profile");
    await click(page, "form button")
    await page.waitForTimeout(3000)

    await page.type('#username', "casuser");
    await page.type('#password', "Mellon");
    await page.keyboard.press('Enter');
    await page.waitForNavigation();

    await page.waitForTimeout(3000)
    await page.type('#token-endpoint-input', "https://localhost:8443/cas/oauth2.0/token");
    await page.type('#client-secret-input', "8f278d1b975f");
    await click(page, "form button")
    await page.waitForTimeout(3000)

    let element = await page.$('#access-token-input');
    const token = await page.evaluate(element => element.value, element);
    assert(token != null)


    const instance = axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        })
    });

    const params = new URLSearchParams()
    params.append('access_token', token)

    instance
        .post('https://localhost:8443/cas/oauth2.0/profile', params)
        .then(res => {
            console.log(res.data);
            let result = res.data;
            assert(result.id === "casuser");
            assert(result.client_id === "f28ace49");
            assert(result.service === "http://localhost:8080");
        })
        .catch(error => {
            throw error;
        })
    
    await browser.close();
})();

async function click(page, button) {
    await page.evaluate((button) => {
        let buttons = document.querySelectorAll(button);
        buttons[buttons.length - 1].click();
    }, button);
}
