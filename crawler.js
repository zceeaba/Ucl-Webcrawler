var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();

var MAX_PAGES_TO_VISIT = 100;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var foundURL = [];

app.use(bodyParser.urlencoded({extended:true}));
app.get('/', function(req,res){
  res.sendFile(__dirname+'/view.html');
});

app.post('/myaction', function(req,res){
var START_URL = req.body.url;
var SEARCH_WORD = req.body.keyword;
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
pagesToVisit.push(START_URL);
crawl();
foundURL.push(START_URL);
res.redirect('/');
function crawl() {
  if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  numPagesVisited++;

  // Make the request
  console.log("Visiting page " + url);
  request(url, function(error, response, body) {
     // Check status code (200 is HTTP OK)
     console.log("Status code: " + response.statusCode);
     if(response.statusCode !== 200) {
       callback();
       return;
     }
     // Parse the document body
     var $ = cheerio.load(body);
     var isWordFound = searchForWord($, SEARCH_WORD);
     if(isWordFound) {
       console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
     } else {
       collectInternalLinks($);
       // In this short program, our callback is just calling crawl()
       callback();
     }
  });
}

function searchForWord($, word) {
  var bodyText = $('html > body').text().toLowerCase();
  return(bodyText.indexOf(word.toLowerCase()) !== -1);
}

function collectInternalLinks($) {
    var relativeLinks = $("a[href^='/']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
        pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
}
});

app.listen(8080, function(){
  console.log('Server running at http://127.0.0.1:8080/');

});


