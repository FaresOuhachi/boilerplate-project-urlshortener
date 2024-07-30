require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const bodyParser = require('body-parser')
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let arrayOfDicts = [];


const generateShortlink = (arrayOfDicts) => {
  const generatedValue = Math.floor(Math.random() * 1000 + 1);
  const existsAlready = arrayOfDicts.find(link => link.short_url === generatedValue);
  console.log(generatedValue);

  if (existsAlready) {
    return generateShortlink(arrayOfDicts);
  } else {
    return generatedValue;
  }
};

const saveShortlink = (short_url, original_url) => {
  const stringUrl = String(original_url);
  arrayOfDicts.push({ original_url: stringUrl, short_url });
};

const searchLinkFromShortlink = (shortlink) => {
  const urlObject = arrayOfDicts.find(link => link.short_url === shortlink);
  return urlObject ? urlObject.original_url : null;
};

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  try {
    const parsedUrl = new URL(url); // Validate and parse the URL
    const hostname = parsedUrl.hostname;

    dns.lookup(hostname, (err, address, family) => {
      if (err) { 
        console.log(err);
        return res.json({ error: 'invalid url' });
      }

      // Check if URL is already in the list
      const existingLink = arrayOfDicts.find(link => link.original_url === url);

      if (existingLink) {
        return res.json(existingLink);
      }

      const shortlink = generateShortlink(arrayOfDicts);
      saveShortlink(shortlink, url);

      console.log(arrayOfDicts);

      res.json({ original_url: url, short_url: shortlink });
    });
  } catch (e) {
    console.log(e);
    return res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:shortlink', (req, res) => {
  const shortlink = parseInt(req.params.shortlink, 10); // Parse shortlink to integer
  const link = searchLinkFromShortlink(shortlink);
  if (link) {
    res.redirect(link);
  } else {
    res.status(404).send('No short URL found for the given input');
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
