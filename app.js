var express   = require('express');
var nunjucks  = require('nunjucks');
var app       = express();

app.get('/', function (req, res) {
  res.send('Hello world!');
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});