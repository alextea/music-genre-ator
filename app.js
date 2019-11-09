var express   = require('express');
var nunjucks  = require('nunjucks');
var app       = express();

var words = require('./words.json');

var getRandomWord = function(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateGenre() {
  var adjective = getRandomWord(words.adjectives);
  var noun = getRandomWord(words.nouns);

  var genre = adjective + " " + noun;

  return genre;
}

app.get('/', function (req, res) {
  var genre = generateGenre();
  console.log(genre);
  res.send(genre);
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

for (var i = 0; i < 10; i++) {
  console.log(generateGenre());
}
