'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var scrapeCompany = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(page) {
    var s, $, companyInfo, lastFunding;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return scraper.get(baseUrl + page);

          case 2:
            s = _context.sent;
            $ = _cheerio2.default.load(s.body);
            companyInfo = {};

            companyInfo.funding = $("[data-metric='.info-card.fundings'] .info-card-value").first().text();
            lastFunding = $("#fundings-history #view-all-content tr.active").first().find("td").eq(2).text().trim().replace(/(\r\n|\n|\r)/gm, " ");

            companyInfo.exited = lastFunding === 'IPO' || lastFunding === 'Acquired';
            return _context.abrupt('return', companyInfo);

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function scrapeCompany(_x) {
    return _ref.apply(this, arguments);
  };
}();

var scrapePerson = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(page) {
    var _this = this;

    var s, person, $, careers;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return scraper.get(baseUrl + page);

          case 2:
            s = _context3.sent;
            person = {};
            $ = s.$;

            person.name = $(".profile-heading h1").first().text().trim().replace(/(\r\n|\n|\r)/gm, " ");
            person.jobTitle = $(".profile-heading .media-body div:first-of-type").first().text().trim().replace(/(\r\n|\n|\r)/gm, " ");
            person.location = $(".profile-heading .media-body div:last-of-type").first().text().trim().replace(/(\r\n|\n|\r)/gm, " ");
            person.industry = $(".profile-extras .clearfix .callout span").first().text().trim().replace(/(\r\n|\n|\r)/gm, " ");
            careers = $('#careers .profile-module .module-content div.row').toArray();

            person.careers = [];
            _context3.next = 13;
            return Promise.all(careers.map(function () {
              var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(elem) {
                var company, date, d, desc, companyUrl, _ref4, funding, exited;

                return _regenerator2.default.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        company = {
                          current: true
                        };
                        date = $('.date-col .date', elem).first().text().trim().replace(/(\r\n|\n|\r)/gm, " ");

                        if (~date.toLowerCase().indexOf('to')) {
                          company.current = false;
                          d = date.split('to');

                          company.start = d[0].trim();
                          company.end = d[1].trim();
                        }
                        desc = $('.desc-col', elem);

                        company.name = $('.time-header', desc).text().trim().replace(/(\r\n|\n|\r)/gm, " ");
                        companyUrl = $('.time-header a[href^="/companies"]').first().attr('href');

                        company.position = $('.time-description', desc).text().trim().replace(/(\r\n|\n|\r)/gm, " ");

                        if (!(~company.position.toLowerCase().indexOf('founder') && companyUrl)) {
                          _context2.next = 16;
                          break;
                        }

                        _context2.next = 10;
                        return scrapeCompany(companyUrl);

                      case 10:
                        _ref4 = _context2.sent;
                        funding = _ref4.funding;
                        exited = _ref4.exited;

                        company.funding = funding;
                        company.exited = exited;
                        person.careers.push(company);

                      case 16:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, _this);
              }));

              return function (_x3) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 13:
            if (!(person.careers.length === 0)) {
              _context3.next = 15;
              break;
            }

            return _context3.abrupt('return', null);

          case 15:
            return _context3.abrupt('return', person);

          case 16:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function scrapePerson(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var getLinksFromPage = function () {
  var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(page) {
    var _this2 = this;

    var s, pages, $, elems;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return scraper.get(baseUrl + page);

          case 2:
            s = _context6.sent;
            pages = [];
            $ = _cheerio2.default.load(s.body);
            elems = $('a[href^="/dir/people/name/"].btn').toArray();

            if (!(elems.length === 0)) {
              _context6.next = 14;
              break;
            }

            elems = $('a[href^="/people/"]').toArray().filter(function (e) {
              return $(e).parent().text().toLowerCase().indexOf('founder');
            });

            if (!(elems.length === 0)) {
              _context6.next = 10;
              break;
            }

            return _context6.abrupt('return');

          case 10:
            _context6.next = 12;
            return Promise.all(elems.map(function () {
              var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(e) {
                var href, person;
                return _regenerator2.default.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        href = $(e).attr('href');
                        _context4.next = 3;
                        return scrapePerson(href);

                      case 3:
                        person = _context4.sent;

                        pages = person;

                      case 5:
                      case 'end':
                        return _context4.stop();
                    }
                  }
                }, _callee4, _this2);
              }));

              return function (_x5) {
                return _ref6.apply(this, arguments);
              };
            }()));

          case 12:
            _context6.next = 16;
            break;

          case 14:
            _context6.next = 16;
            return Promise.all(elems.map(function () {
              var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(e) {
                var href, links;
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        href = $(e).attr('href');
                        _context5.next = 3;
                        return getLinksFromPage(href);

                      case 3:
                        links = _context5.sent;

                        pages = links;

                      case 5:
                      case 'end':
                        return _context5.stop();
                    }
                  }
                }, _callee5, _this2);
              }));

              return function (_x6) {
                return _ref7.apply(this, arguments);
              };
            }()));

          case 16:
            return _context6.abrupt('return', pages);

          case 17:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function getLinksFromPage(_x4) {
    return _ref5.apply(this, arguments);
  };
}();

var main = function () {
  var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8() {
    var _this3 = this;

    var line, ctitles, i, s, $, elems;
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            line = "";
            ctitles = [];

            for (i = 0; i < 4; i++) {
              ctitles.push(['Job ' + (i + 1) + ' Name', 'Job ' + (i + 1) + ' Position', 'Job ' + 1 + ' Funding', 'Job ' + (i + 1) + ' Exited', 'Job ' + (i + 1) + ' Current'].join(','));
            }
            line = ['Name', 'Current Job Title', 'Location', 'Current Job Industies', ctitles.join(',')].join(',');
            _fs2.default.writeFileSync('data.csv', line + '\n');
            _context8.next = 7;
            return scraper.get(baseUrl + startUrl);

          case 7:
            s = _context8.sent;
            $ = _cheerio2.default.load(s.body);
            elems = $('ul.pagination li').toArray();
            _context8.next = 12;
            return Promise.all(elems.map(function () {
              var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(e) {
                var href, d;
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                  while (1) {
                    switch (_context7.prev = _context7.next) {
                      case 0:
                        href = $('a', e).attr('href');
                        _context7.next = 3;
                        return getLinksFromPage(href);

                      case 3:
                        d = _context7.sent;

                        if (d && d.name) {
                          (function () {
                            var car = [];
                            _ramda2.default.forEach(function (c) {
                              if (car.length < 4) {
                                car.push([c.name, c.position, c.funding, c.exited, c.current].join(','));
                              }
                            }, d.careers);
                            if (car.length < 4) {
                              for (var _i = 0; _i < 4 - car.length; _i++) {
                                car.push(['', '', '', '', ''].join(','));
                              }
                            }
                            var line = [d.name, d.jobTitle, d.location.replace('Location: ', '').replace(/,/g, ''), d.industry.replace(/,/g, ';'), car.join(',')].join(',');
                            console.log(line);
                            _fs2.default.appendFileSync('data.csv', line + '\n');
                          })();
                        }

                      case 5:
                      case 'end':
                        return _context7.stop();
                    }
                  }
                }, _callee7, _this3);
              }));

              return function (_x7) {
                return _ref9.apply(this, arguments);
              };
            }()));

          case 12:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function main() {
    return _ref8.apply(this, arguments);
  };
}();

var execute = function () {
  var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9() {
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;
            _context9.next = 3;
            return main();

          case 3:
            _context9.next = 9;
            break;

          case 5:
            _context9.prev = 5;
            _context9.t0 = _context9['catch'](0);

            console.error(_context9.t0.stack || _context9.t0);
            throw Error(_context9.t0);

          case 9:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this, [[0, 5]]);
  }));

  return function execute() {
    return _ref10.apply(this, arguments);
  };
}();

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _webscrape = require('webscrape');

var _webscrape2 = _interopRequireDefault(_webscrape);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require("babel-core/register");
require("babel-polyfill");

var scraper = (0, _webscrape2.default)();

var baseUrl = 'https://www.vbprofiles.com';
var startUrl = '/dir/people/name/A';

execute();
