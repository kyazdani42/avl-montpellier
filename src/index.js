const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { getParkingPlaces, getBikeStations } = require('./tools');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const router = express.Router();

router.get('/bike-stations', async (_, res) => res.send(await getBikeStations()));
router.get('/parking-places', async (_, res) => res.json(await getParkingPlaces()));

app.use('/api', router);

let baseTemplate;
fs.readFile(path.join(__dirname, 'index.html'), { encoding: 'utf-8' }, (_, data) => {
  baseTemplate = data;
});

app.get('/', async (_, res) => {
  const [bikeStations, parkingPlaces] = await Promise.all([getBikeStations(), getParkingPlaces()]);
  res.send(baseTemplate.replace('{{#data}}', JSON.stringify({ bikeStations, parkingPlaces })));
});

app.use(express.static(path.join(__dirname, 'static')));

app.use('*', (_, res) => {
  res.redirect(301, '/');
});

app.listen(3000, () => console.log('running on port 3000'));
