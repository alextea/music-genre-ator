# Music Genre-ator

![music genre-ator](https://raw.githubusercontent.com/alextea/music-genre-ator/master/images/social-media-card-07.png)

## Generate your own music genre

🎤 🎧 🎼 🎹 🥁 🎷 🎺 🎸 🎻 💽 💿 🔊 👩‍🎤 👨🏻‍🎤

This is a small web app built using Express that generates fake musical genres from a list of candidate words.

It uses [loune/web-rendering-lambda](https://github.com/loune/web-rendering-lambda) running on an AWS Lambda instance to create screenshots of the genres and uploads them to an S3 bucket for use as social sharing images.

## Installing 💾
To run the app locally, clone the repo and then run `npm install`

`npm run deploy` will build the css files, create the sqlite3 database and copy the static assets

Then you can run `npm run dev-start` to run the app using nodemon and watch the scss files for changes.

### Screenshots 🖼
To capture the screenshots you will need your own install of [loune/web-rendering-lambda](https://github.com/loune/web-rendering-lambda) and a publicly readable S3 bucket to save the images in.

### Configuration ⚙️
You will need to create a file called `config.json` in the root folder in order to capture the screenshots

```json
{
  "screenshotUrl": "", // the url to access your install of web-rendering-lambda
  "saveS3Bucket": "", // the name of the S3 bucket to save the screenshots to
  "saveS3Region": "", // the region the S3 bucket is in
  "screenshotW": 1200, // the width of the screenshots
  "screenshotH": 630, // the height of the screenshots
  "screenshotFormat": "png" // the format to capture the screenshots
}
```

## List of words 📜
The list of words is stored in `/data/words.json` and is separated in adjectives and nouns.

The genres are generated from the list of words combining 1-3 adjectives with 1-3 nouns at random.

### Contributing words 📝
To contribute words either create a pull request on this repo, or [contact me on Twitter @alex_tea](https://twitter.com/alex_tea)
