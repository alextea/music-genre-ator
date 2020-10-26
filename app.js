var express     = require('express');
var nunjucks    = require('nunjucks');
var path        = require('path');
var screenshot  = require('./utils/screenshot');
var database    = require('./utils/database_utils');
var words       = require('./data/words.json');
var app         = express();

const config = require('./config.json');

nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: true
});

app.set({'views': './views'});

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/styles', express.static(path.join(__dirname, 'public/styles')));

var env = process.env.NODE_ENV || "development";
var port = process.env.PORT || 3000;
var siteUrl = `http://localhost:${port}`;

if (env == "production") {
  var siteUrl = "https://musicgenre.site";
}

console.log({env});
console.log({siteUrl})

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

var sharingEmojis = ["🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🎻", "💽", "💿", "🔊", "👩‍🎤", "👨🏻‍🎤" ];

function makeTwitterShareUrl(genre, slug) {
  var emoji = getRandomWord(sharingEmojis);
  var twitterUrl = "https://twitter.com/intent/tweet";
  var twitterQuery = {
    text: `My new favourite genre is ${emoji} ${genre} ${emoji}`,
    url: `${siteUrl}/${slug}`,
    hashtags: "musicgenreator",
    via: "alex_tea"
  }

  return buildUrlQueryString(twitterUrl, twitterQuery)
}

function makeFacebookShareUrl(genre, slug) {
  var emoji = getRandomWord(sharingEmojis);
  var faceBookUrl = "https://www.facebook.com/dialog/share";
  var faceBookQuery = {
    app_id: 2640283582660316,
    quote: `My new favourite genre is ${emoji} ${genre} ${emoji}`,
    href: `${siteUrl}/${slug}`,
    display: "page",
    redirect_uri: `${siteUrl}/${slug}`
  }

  return buildUrlQueryString(faceBookUrl, faceBookQuery);
}

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
        screenshot
          .getScreenShot(`${siteUrl}/screenshot/`, slug)
          .then(function(response){
            console.log("captured screenshot",response)
          })
          .catch(console.error)
      }

      var twitterShareLink = makeTwitterShareUrl(genre, slug);
      var faceBookShareLink = makeFacebookShareUrl(genre, slug);

      var emoji = getRandomWord(sharingEmojis);
      var description = `My new favourite genre is ${emoji} ${genre} ${emoji} — generate your own at ${siteUrl}`;
      var socialMediaCard = siteUrl + "/images/social-media-card-0" + (Math.floor(Math.random() * 9) + 1) + ".png";

      // don't cache the root url
      res.setHeader('Cache-Control', 'max-age=1');

      res.render('index.html',
        {
          slug: slug,
          genre: genre,
          description: description,
          twitter_share_link: twitterShareLink,
          facebook_share_link: faceBookShareLink,
          social_media_card: socialMediaCard,
      });
    })
    .catch(function(error) {
      next(error);
    })
})

app.get('(/screenshot)?/:slug', function (req, res, next) {
  var slug = req.params.slug;
  console.log("slug = "+slug);
  database.getGenre(slug)
    .then(function(data) {
      if (!data) {
        var err = new Error("Genre not found");
        err.status = 404;
        console.error(err);
        next(err);
      } else {
        console.log(slug + ' exists in db', {data});
        var genre = data.genre;

        var twitterShareLink = makeTwitterShareUrl(genre, slug);
        var faceBookShareLink = makeFacebookShareUrl(genre, slug);

        var emoji = getRandomWord(sharingEmojis);
        var description = `My new favourite genre is ${emoji} ${genre} ${emoji} — generate your own at ${siteUrl}`;
        var socialMediaCard = `https://${config.saveS3Bucket}.s3.${config.saveS3Region}.amazonaws.com/${slug}.${config.screenshotFormat}`

        var layout = (!req.params[0]) ? 'index.html' : 'screenshot.html';

        res.render(layout,
          {
            slug: slug,
            genre: genre,
            description: description,
            twitter_share_link: twitterShareLink,
            facebook_share_link: faceBookShareLink,
            social_media_card: socialMediaCard
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
  console.error(err)
  res.status(500).send(err.message)
});

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Music Genre-ator app listening at http://%s:%s', host, port);
});
