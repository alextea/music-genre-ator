var express     = require('express');
var nunjucks    = require('nunjucks');
var path        = require('path');
var screenshot  = require('./utils/screenshot');
var database    = require('./utils/database_utils');
var words       = require('./data/words.json');
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


if (process.env.NODE_ENV == "production") {
  var siteUrl = "https://musicgenre.site";
} else {
  var siteUrl = "http://localhost:3000";
}

console.log('process.env.NODE_ENV = ' + process.env.NODE_ENV);
console.log('siteUrl = ' + siteUrl)

function getRandomWord(array) {
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

function makeTwitterShareUrl(genre, slug) {
  var twitterUrl = "https://twitter.com/intent/tweet";
  var twitterQuery = {
    text: "My new favourite genre is " + genre,
    url: siteUrl + "/" + slug,
    hashtags: "musicgenreator",
    via: "alex_tea"
  }

  return buildUrlQueryString(twitterUrl, twitterQuery)
}

function makeFacebookShareUrl(genre, slug) {
  var faceBookUrl = "https://www.facebook.com/dialog/share";
  var faceBookQuery = {
    app_id: 2640283582660316,
    quote: "My new favourite genre is " + genre,
    href: siteUrl + "/" + slug,
    display: "page",
    redirect_uri: siteUrl
  }

  return buildUrlQueryString(faceBookUrl, faceBookQuery);
}

app.get('/screenshot/:genre', function (req, res) {
  res.render('screenshot.html', { genre: req.params.genre });
})

app.get('/favicon.ico', function(req, res, next) {
  res.sendStatus(404);
})

app.get('/', function (req, res, next) {
  var genre = generateGenre();
  var slug = textToSlug(genre);

  // check if genre exists in database
  database.getGenre(slug)
    .then(function(data) {
      if (!data) {
        console.log(slug + ' not found in db');
        // add to database
        database.addGenre(genre, slug);

        // capture screenshot
        // screenshot
        //   .getScreenShot(siteUrl + '/screenshot/', slug)
        //   .catch(console.error)

        var twitterShareLink = makeTwitterShareUrl(genre, slug);
        var faceBookShareLink = makeFacebookShareUrl(genre, slug);

        res.render('index.html',
          {
            slug: slug,
            genre: genre,
            twitter_share_link: twitterShareLink,
            facebook_share_link: faceBookShareLink
        });
      }
    })
    .catch(function(error) {
      next(error);
    })
})

app.get('/:slug', function (req, res, next) {
  var slug = req.params.slug;
  console.log("slug = "+slug);
  database.getGenre(slug)
    .then(function(data) {
      if (!data) {
        var err = new Error("Genre not found");
        err.status = 404;
        next(err);
      } else {
        console.log(slug + ' exists in db');
        var genre = data.genre;

        var twitterShareLink = makeTwitterShareUrl(genre, slug);
        var faceBookShareLink = makeFacebookShareUrl(genre, slug);

        res.render('index.html',
          {
            slug: slug,
            genre: genre,
            twitter_share_link: twitterShareLink,
            facebook_share_link: faceBookShareLink
        });
      }
    })
    .catch(function(error) {
      next(error);
    })
})

app.use(function (req, res, next) {
  res.status(404).send("Oops")
});

app.use(function (err, req, res, next) {
  console.log(err.stack)
  res.status(500).send(err.message)
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Music Genre-ator app listening at http://%s:%s', host, port);
});
