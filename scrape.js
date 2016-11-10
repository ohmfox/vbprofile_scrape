let fs = require('fs');
let request = require('request-promise-native');
let cheerio = require('cheerio');
let R = require('ramda')

const options = {
  headers: {'user-agent': 'node.js'}
}

let req = request.defaults(options);

let indent = [];

async function scrapeCompany(page) {
  try {
    let response = await req.get(baseUrl+page);
    if(response) {
      let companyInfo = {};
      let $ = cheerio.load(response);
      companyInfo.funding = $("[data-metric='.info-card.fundings'] .info-card-value").first().text();
      let lastFunding = $("#fundings-history #view-all-content tr.active").first().find("td").eq(2).text().trim().replace(/(\r\n|\n|\r)/gm," ");
      companyInfo.exited = lastFunding==='IPO' || lastFunding === 'Acquired';
      return companyInfo;
    } else {
      return null;
    }
  } catch (e) {
    throw Error(e);
  }
}

async function scrapePerson(page) {
  try {
    let response = await req.get(baseUrl+page);
    if(response) {
      let person = {};
      let $ = cheerio.load(response);
      person.name = $(".profile-heading h1").first().text().trim();
      person.jobTitle = $(".profile-heading .media-body div:first-of-type").first().text().trim().replace(/(\r\n|\n|\r)/gm," ");
      person.location = $(".profile-heading .media-body div:last-of-type").first().text().trim().replace(/(\r\n|\n|\r)/gm," ");
      person.industry = $(".profile-extras .clearfix .callout span").first().text().trim().replace(/(\r\n|\n|\r)/gm," ");
      let careers = $('#careers .profile-module .module-content div.row').toArray();
      person.careers = [];
      for(let i = 0; i<careers.length; i++) {
        let elem = $(careers[i]);
        let company = {
          current: true,
        };
        let date = $('.date-col .date', elem).first().text().trim().replace(/(\r\n|\n|\r)/gm," ");
        if(~date.toLowerCase().indexOf('to')) {
          company.current = false;
          let d = date.split('to')
          company.start = d[0];
          company.end = d[1];
        }
        let desc = $('.desc-col', elem);
        company.name = $('.time-header', desc).text().trim().replace(/(\r\n|\n|\r)/gm," ");
        let companyUrl = $('.time-header a[href^="/companies"]').first().attr('href');
        company.position = $('.time-description', desc).text().trim().replace(/(\r\n|\n|\r)/gm," ");
        if(~company.position.toLowerCase().indexOf('founder') && companyUrl) {
          company.info = await scrapeCompany(companyUrl);
          person.careers.push(company);
        }
      }
      console.log(person);
      if(person.careers.length===0) {
        return null;
      }
      return person;
    } else {
      return null;
    }
  } catch (e) {
    throw Error(e);
  }
}

async function getLinksFromPage(page) {
  try {
    let response = await req.get(baseUrl+page);
    if(response) {
      let pages = [];
      let $ = cheerio.load(response);
      let elems = $('a[href^="/dir/people/name/a"].btn').toArray();
      if(elems.length===0) {
        elems = $('a[href^="/people/"]').toArray();
        for(let e = 0; e < elems.length; e++) {
          let href = $(elems[e]).attr('href');
          let person = await scrapePerson(href);
        }
      } else {
        for(let e = 0; e < elems.length; e++) {
          let href = $(elems[e]).attr('href');
          let links = await getLinksFromPage(href);
          pages[$(elems[e]).text()] = {
            href,
            links
          };
        }
      }
      if(elems.length===0) return null;
      return pages;
    } else {
      return null;
    }
  } catch(e) {
    throw Error(e);
  }
}
