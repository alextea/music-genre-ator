var express     = require('express');
var nunjucks    = require('nunjucks');
var path        = require('path');
var screenshot  = require('./utils/screenshot');
var app         = express();

nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: true
});

app.set({'views': './views'});

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/styles', express.static(path.join(__dirname, 'public/styles')));

var words = require('./words.json');

var getRandomWord = function(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function weightedRand(spec) {
  var i, j, table=[];
  for (i in spec) {
    // The constant 10 below should be computed based on the
    // weights in the spec for a correct and optimal table size.
    // E.g. the spec {0:0.999, 1:0.001} will break this impl.
    for (j=0; j<spec[i]*10; j++) {
      table.push(i);
    }
  }

  return table[Math.floor(Math.random() * table.length)];
}

function generateGenre() {
  var numberOfAdjectivesWeighting = {
    1: 0.7,
    2: 0.25,
    3: 0.05
  }

  var numberOfNounsWeighting = {
    1: 0.8,
    2: 0.15,
    3: 0.05
  }

  var numberOfAdjectives = weightedRand(numberOfAdjectivesWeighting);
  var numberOfNouns = weightedRand(numberOfNounsWeighting);
  var adjectives = [], nouns = [];

  for (var i = 0; i < numberOfAdjectives; i++) {
    adjectives.push(getRandomWord(words.adjectives));
  }

  for (var i = 0; i < numberOfNouns; i++) {
    nouns.push(getRandomWord(words.nouns));
  }

  var genre = adjectives.join(" ") + " " + nouns.join(" ");
  genre = genre.replace(/\-\s/, "-");

  return genre;
}

function textToSlug(text) {
  var slug = text
              .toLowerCase()
              .replace(/[^a-z0-9\s]*/g, '')
              .replace(/\s+/g, '-');

  return slug;
}

function buildUrlQueryString(url, query) {
  url = url + "?";
  for (q in query) {
    url += q + "=" + encodeURIComponent(query[q]) + "&";
  }

  url = url.slice(0, -1);
  return url;
}

app.get('/', function (req, res) {
  var genre = generateGenre();
  console.log(genre);

  var slug = textToSlug(genre);

  res.redirect('/'+slug);
});

app.get('/screenshot/:genre', function (req, res) {
  res.render('screenshot.html', { genre: req.params.genre });
})

app.get('/:genre', function (req, res) {
  var genre = req.params.genre;

  var twitterUrl = "https://twitter.com/intent/tweet";
  var twitterQuery = {
    text: "My new favourite genre is " + genre,
    url: "https://musicgenre.site",
    hashtags: "musicgenreator",
    via: "alex_tea"
  }

  var twitterShareLink = buildUrlQueryString(twitterUrl, twitterQuery);

  var faceBookUrl = "https://www.facebook.com/dialog/share?";

  var faceBookQuery = {
    href: "https://musicgenre.site",
    display: "page",
    redirect_uri: "ttps://musicgenre.site"
  }

  var faceBookShareLink = buildUrlQueryString(faceBookUrl, faceBookQuery);

  // capture screenshot
  screenshot
    .getScreenShot('http://localhost:3000/screenshot/'+genre)
    .catch(err => reject('Screenshot failed'))

  res.render('index.html',
    {
      genre: genre,
      twitter_share_link: twitterShareLink,
      facebook_share_link: faceBookShareLink
    });
})

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Music Genre-ator app listening at http://%s:%s', host, port);
});

for (var i = 0; i < 10; i++) {
  console.log(generateGenre());
}
