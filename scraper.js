import R from 'ramda';
import fs from 'fs';
import Scraper from 'webscrape';
import cheerio from 'cheerio';
require("babel-core/register");
require("babel-polyfill");

const scraper = Scraper();

var baseUrl = 'https://www.vbprofiles.com'
var startUrl = '/dir/people/name/A';

async function scrapeCompany(page) {
  let s = await scraper.get(baseUrl+page);
  let $ = cheerio.load(s.body);
  let companyInfo = {};
  companyInfo.funding = $("[data-metric='.info-card.fundings'] .info-card-value").first().text();
  let lastFunding = $("#fundings-history #view-all-content tr.active").first().find("td").eq(2).text().trim().replace(/(\r\n|\n|\r)/gm," ");
  companyInfo.exited = lastFunding==='IPO' || lastFunding === 'Acquired';
  return companyInfo;
}

async function scrapePerson(page) {
  let s = await scraper.get(baseUrl+page);
  let person = {};
  let $ = s.$
  person.name = $(".profile-heading h1").first().text().trim().replace(/(\r\n|\n|\r)/gm," ");
  person.jobTitle = $(".profile-heading .media-body div:first-of-type").first().text().trim().replace(/(\r\n|\n|\r)/gm," ");
  person.location = $(".profile-heading .media-body div:last-of-type").first().text().trim().replace(/(\r\n|\n|\r)/gm," ");
  person.industry = $(".profile-extras .clearfix .callout span").first().text().trim().replace(/(\r\n|\n|\r)/gm," ");
  let careers = $('#careers .profile-module .module-content div.row').toArray();
  person.careers = [];
  await Promise.all(careers.map(async elem => {
    let company = {
      current: true,
    };
    let date = $('.date-col .date', elem).first().text().trim().replace(/(\r\n|\n|\r)/gm," ");
    if(~date.toLowerCase().indexOf('to')) {
      company.current = false;
      let d = date.split('to')
      company.start = d[0].trim();
      company.end = d[1].trim();
    }
    let desc = $('.desc-col', elem);
    company.name = $('.time-header', desc).text().trim().replace(/(\r\n|\n|\r)/gm," ");
    let companyUrl = $('.time-header a[href^="/companies"]').first().attr('href');
    company.position = $('.time-description', desc).text().trim().replace(/(\r\n|\n|\r)/gm," ");
    if(~company.position.toLowerCase().indexOf('founder') && companyUrl) {
      let { funding, exited } = await scrapeCompany(companyUrl);
      company.funding = funding;
      company.exited = exited;
      person.careers.push(company);
    }
  }));
  if(person.careers.length===0) {
    return null;
  }
  return person;
}

async function getLinksFromPage(page) {
  let s = await scraper.get(baseUrl+page);
  let pages = [];
  let $ = cheerio.load(s.body);
  let elems = $('a[href^="/dir/people/name/"].btn').toArray();
  if(elems.length===0) {
    elems = $('a[href^="/people/"]').toArray().filter(function(e) { return $(e).parent().text().toLowerCase().indexOf('founder') });
    if(elems.length===0) return;
    await Promise.all(elems.map(async e => {
      let href = $(e).attr('href');
      let person = await scrapePerson(href);
      pages = person;
    }));
  } else {
    let sel_elems = [];
    let used_ind = [];
    for(let i = 0; i < 10; i++) {
      let index = Math.floor(Math.random()*elems.length);
      if(!~used_ind.indexOf(index)) {
        used_ind.push(index);
        sel_elems.push(elems[index]);
      }
    }
    await Promise.all(sel_elems.map(async e => {
      let href = $(e).attr('href');
      let links = await getLinksFromPage(href);
      pages = links;
    }));
  }
  return pages;
}

async function main() {
  let line = "";
  let ctitles = [];
  for(var i=0;i<4;i++) {
    ctitles.push([`Job ${i+1} Name`, `Job ${i+1} Position`, `Job ${1} Funding`, `Job ${i+1} Exited`, `Job ${i+1} Current`].join(','));
  }
  line = ['Name', 'Current Job Title', 'Location', 'Current Job Industies', ctitles.join(',')].join(',');
  fs.writeFileSync('data.csv', line+'\n');
  const s = await scraper.get(baseUrl+startUrl);
  var $ = cheerio.load(s.body);
  let elems = $('ul.pagination li').toArray();
  await Promise.all(elems.map(async e => {
    let href = $('a', e).attr('href');
    let d = await getLinksFromPage(href);
    if(d && d.name) {
      let car = [];
      R.forEach((c) => {
        if(car.length < 4) {
          car.push([c.name, c.position, c.funding, c.exited, c.current].join(','));
        }
      }, d.careers)
      if(car.length < 4) {
        for(let i = 0; i<4-car.length;i++) {
          car.push(['','','','',''].join(','));
        }
      }
      let line = [d.name, d.jobTitle, d.location.replace('Location: ', '').replace(/,/g, ''), d.industry.replace(/,/g, ';'), car.join(',')].join(',');
      console.log(line);
      fs.appendFileSync('data.csv', line+'\n');
    }
  }));
}

async function execute() {
  try {
    await main();
  } catch (e) {
    console.error(e.stack || e);
    throw Error(e);
  }
}

execute();
