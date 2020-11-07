/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

const chai = require('chai');
const { defaultBefore, defaultAfter } = require('../defaults');

const { expect } = chai;

/**
 * Special method built due to Puppeteer limitations: looks for the first row matching an ID in a table
 * @param {Object} table An HTML element representing the entire flp table
 * @param {Object} page An object representing the browser page being used by Puppeteer
 * @return {String} The ID of the first matching row with data
 */
async function getFirstRow(table, page) {
    for (const child of table) {
        const id = await page.evaluate((element) => element.id, child);
        if (id.startsWith('row')) {
            return id;
        }
    }
}

module.exports = () => {
    let page;
    let browser;
    let url;

    let table;
    let firstRowId;

    before(async () => {
        [page, browser, url] = await defaultBefore(page, browser);
    });
    after(async () => {
        [page, browser] = await defaultAfter(page, browser);
    });

    it('flp detail loads correctly', async () => {
        await page.goto(`${url}/?page=flp-detail&id=1`, { waitUntil: 'networkidle0' });

        const postExists = await page.$('h2');
        expect(Boolean(postExists)).to.be.true;

        const title = await page.evaluate((element) => element.innerText, postExists);
        expect(title).to.equal('Flp #1');
    });

    it('can navigate to the log panel', async () => {
        await page.click('#logs-tab');
        await page.waitForTimeout(100);
        const redirectedUrl = await page.url();
        expect(String(redirectedUrl).startsWith(`${url}/?page=flp-detail&id=1&panel=logs`)).to.be.true;
    });

    it('can navigate to the main panel', async () => {
        await page.click('#main-tab');
        await page.waitForTimeout(100);
        const redirectedUrl = await page.url();
        expect(String(redirectedUrl).startsWith(`${url}/?page=flp-detail&id=1&panel=main`)).to.be.true;
    });

    it('can navigate to the log panel', async () => {
        await page.click('#logs-tab');
        await page.waitForTimeout(100);
        const redirectedUrl = await page.url();
        expect(String(redirectedUrl).startsWith(`${url}/?page=flp-detail&id=1&panel=logs`)).to.be.true;
    });

    it('can navigate to a log detail page', async () => {
        table = await page.$$('tr');
        firstRowId = await getFirstRow(table, page);

        // We expect the entry page to have the same id as the id from the flp overview
        await page.click(`#${firstRowId}`);
        await page.waitForTimeout(100);
        const redirectedUrl = await page.url();
        expect(String(redirectedUrl).startsWith(`${url}/?page=log-detail&id=1`)).to.be.true;
    });

    it('notifies if a specified flp id is invalid', async () => {
        // Navigate to a flp detail view with an id that cannot exist
        await page.goto(`${url}/?page=flp-detail&id=abc`, { waitUntil: 'networkidle0' });

        // We expect there to be an error message
        const error = await page.$('.alert');
        expect(Boolean(error)).to.be.true;
        const message = await page.evaluate((element) => element.innerText, error);
        expect(message).to.equal('Invalid Attribute: "params.flpId" must be a number');
    });

    it('notifies if a specified flp id is not found', async () => {
        // Navigate to a flp detail view with an id that cannot exist
        await page.goto(`${url}/?page=flp-detail&id=999`, { waitUntil: 'networkidle0' });

        // We expect there to be an error message
        const error = await page.$('.alert');
        expect(Boolean(error)).to.be.true;
        const message = await page.evaluate((element) => element.innerText, error);
        expect(message).to.equal('Flp with this id (999) could not be found');
    });

    it('can return to the overview page if an error occurred', async () => {
        // We expect there to be a button to return to the overview page
        const returnButton = await page.$('.btn-primary');
        const returnButtonText = await page.evaluate((element) => element.innerText, returnButton);
        expect(returnButtonText).to.equal('Return to Overview');

        // We expect the button to return the user to the overview page when pressed
        await returnButton.click();
        await page.waitForTimeout(100);
        const redirectedUrl = await page.url();
        expect(String(redirectedUrl).startsWith(`${url}/?page=flp-overview`)).to.be.true;
    });
};
