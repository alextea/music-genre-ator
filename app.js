// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express      = require('express');
const nunjucks     = require('nunjucks');
const path         = require('path');
const { captureScreenshot, config: screenshotConfig } = require('./utils/screenshot');
const { generateMusicData } = require('./utils/music');
const database     = require('./utils/database_utils');
const words        = require('./data/words.json');
const app          = express();
const querystring  = require('querystring');

// Use screenshot config from screenshot utility
const config = screenshotConfig;

const nunjucksEnv = nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: true
});

// Add custom filter to format numbers with commas
nunjucksEnv.addFilter('formatNumber', function(num) {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
});

app.set({'views': './views'});

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/styles', express.static(path.join(__dirname, 'public/styles')));
app.use('/scripts', express.static(path.join(__dirname, 'public/scripts')));

const env = process.env.NODE_ENV || "development";
const port = process.env.PORT || 3000;
const siteUrl = process.env.SITE_URL || `http://localhost:${port}`;

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

var sharingEmojis = ["🎤", "🎧", "🎼", "🎹", "🥁", "🎷", "🎺", "🎸", "🎻", "💽", "💿", "🔊", "👩‍🎤", "👨🏻‍🎤" ];

function generateShareContent(genre, slug) {
  var emoji = getRandomWord(sharingEmojis);

  var shareTemplates = [
    `My new favourite genre is ${emoji} ${genre} ${emoji}\n\nGenerate your own: ${siteUrl}/${slug}`,
    `Just discovered ${emoji} ${genre} ${emoji}\n\nWhat's next? ${siteUrl}/${slug}`,
    `The algorithm has spoken: ${emoji} ${genre} ${emoji}\n\nYour turn: ${siteUrl}/${slug}`,
    `Now accepting demo submissions for my new ${emoji} ${genre} ${emoji} label\n\nMake yours: ${siteUrl}/${slug}`,
    `${emoji} ${genre} ${emoji} is my jam! What's yours? ${siteUrl}/${slug}`,
    `${emoji} I was into ${genre} ${emoji} Before it was cool ${siteUrl}/${slug}`
  ];

  var shareText = getRandomWord(shareTemplates);

  return {
    emoji: emoji,
    text: shareText,
    blueskyUrl: `https://bsky.app/intent/compose?${querystring.stringify({
      text: shareText
    })}`
  };
}

// Wrapper for fire-and-forget screenshot capture
function requestScreenshot(slug) {
  captureScreenshot(`${siteUrl}/screenshot/`, slug)
    .then(function(response){
      console.log(`Screenshot requested for: ${siteUrl}/screenshot/${slug}`);
      console.log(`Job ID: ${response.jobId}, Status: ${response.status}`);
    })
    .catch(function(error) {
      console.error(`Screenshot request failed for ${slug}:`, error.message);
    });
}

function checkScreenshot(slug) {
  var imageUrl = `https://${config.saveS3Bucket}.s3.${config.saveS3Region}.amazonaws.com/${config.appName}/${slug}.${config.screenshotFormat}`;
  fetch(imageUrl, { method: 'HEAD' })
    .then((res) => {
      if (res.status >= 400 && res.status < 500) {
        // Screenshot doesn't exist, request it
        console.log(`Screenshot doesn't exist for ${slug}, requesting...`);
        requestScreenshot(slug);
      }
    })
    .catch((error) => {
      // On error, try to generate screenshot
      console.error(`Error checking screenshot for ${slug}:`, error.message);
      requestScreenshot(slug);
    });
}

app.get('/favicon.ico', function(req, res, next) {
  res.sendFile(path.join(__dirname, 'public', 'images', 'favicon-1.ico'));
})

app.get('/robots.txt', function (req, res, next) {
  res.type('text/plain');
  res.send(`
    User-agent: *
    Allow: /
  `);
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
        requestScreenshot(slug);
      } else {
        // check if screenshot exists
        checkScreenshot(slug);
      }

      var shareData = generateShareContent(genre, slug);
      var description = shareData.text;
      var socialMediaCard = siteUrl + "/images/social-media-card-0" + (Math.floor(Math.random() * 9) + 1) + ".png";

      // don't cache the root url
      res.setHeader('Cache-Control', 'max-age=1');

      res.render('index.html',
        {
          slug: slug,
          genre: genre,
          description: description,
          bluesky_share_link: shareData.blueskyUrl,
          social_media_card: socialMediaCard,
          share_content: shareData.text
      });
    })
    .catch(function(error) {
      next(error);
    })
})

app.get('/{screenshot/}:slug', function (req, res, next) {
  var slug = req.params.slug;
  console.log("slug = "+slug);
  database.getGenre(slug)
    .then(function(data) {
      if (!data) {
        var err = new Error("Genre not found");
        err.status = 404;
        next(err);
      } else {
        console.log(slug + ' exists in db', {data});
        var genre = data.genre;

        // check if screenshot exists
        checkScreenshot(slug)

        var shareData = generateShareContent(genre, slug);
        var description = shareData.text;
        var socialMediaCard = `https://${config.saveS3Bucket}.s3.${config.saveS3Region}.amazonaws.com/${config.appName}/${slug}.${config.screenshotFormat}`

        var layout = (req.url.indexOf('/screenshot') == -1) ? 'index.html' : 'screenshot.html';

        res.render(layout,
          {
            slug: slug,
            genre: genre,
            description: description,
            bluesky_share_link: shareData.blueskyUrl,
            social_media_card: socialMediaCard,
            share_content: shareData.text
        });
      }
    })
    .catch(function(error) {
      next(error);
    })
})

app.get('/listen/:slug', function (req, res, next) {
  var slug = req.params.slug;
  console.log("listen slug = " + slug);

  database.getGenre(slug)
    .then(function(data) {
      if (!data) {
        var err = new Error("Genre not found");
        err.status = 404;
        next(err);
      } else {
        console.log('Fetching music for: ' + slug);
        var genre = data.genre;

        // Fetch music data from Last.fm
        return generateMusicData(genre)
          .then(function(musicData) {
            var shareData = generateShareContent(genre, slug);
            var description = shareData.text;
            var socialMediaCard = `https://${config.saveS3Bucket}.s3.${config.saveS3Region}.amazonaws.com/${config.appName}/${slug}.${config.screenshotFormat}`;

            res.render('listen.html', {
              slug: slug,
              genre: genre,
              description: description,
              bluesky_share_link: shareData.blueskyUrl,
              social_media_card: socialMediaCard,
              share_content: shareData.text,
              music_data: musicData
            });
          });
      }
    })
    .catch(function(error) {
      next(error);
    })
})

// Deezer API proxy to avoid CORS issues
app.get('/api/deezer/search', function (req, res) {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const https = require('https');
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`;

  https.get(url, (apiRes) => {
    let data = '';

    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (error) {
        console.error('Deezer API response parsing error:', error);
        res.status(500).json({ error: 'Failed to parse Deezer response' });
      }
    });
  }).on('error', (error) => {
    console.error('Deezer API request error:', error);
    res.status(500).json({ error: 'Failed to fetch from Deezer' });
  });
});

app.use(function (err, req, res, next) {
  console.error(err)
  res.status(err.status);
  res.render('error.html', {
    title: `${err.status} error`,
    description: err.message
  })
});


var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Music Genre-ator app listening at http://%s:%s', host, port);
});
