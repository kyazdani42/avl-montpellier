const axios = require('axios');

const MONTPELLIER_DATA = 'https://data.montpellier3m.fr/sites/default/files/ressources';

const PARKINGS = {
  Antigone: 'FR_MTP_ANTI',
  Comédie: 'FR_MTP_COME',
  Corum: 'FR_MTP_CORU',
  Europa: 'FR_MTP_EURO',
  'Foch Préfecture': 'FR_MTP_FOCH',
  Gambetta: 'FR_MTP_GAMB',
  'Saint Roch': 'FR_MTP_GARE',
  Triangle: 'FR_MTP_TRIA',
  'Arc de Triomphe': 'FR_MTP_ARCT',
  Pitot: 'FR_MTP_PITO',
  'Circé Odysseum': 'FR_MTP_CIRC',
  Sabines: 'FR_MTP_SABI',
  'Garcia Lorca': 'FR_MTP_GARC',
  'Notre Dame de Sablassou': 'FR_MTP_SABL',
  Mosson: 'FR_MTP_MOSS',
  'Saint-Jean-le-Sec': 'FR_STJ_SJLC',
  Euromédecine: 'FR_MTP_MEDC',
  Occitanie: 'FR_MTP_OCCI',
  Viccarello: 'FR_CAS_VICA',
  'Charles de Gaulle': 'FR_CAS_CDGA',
  'Gaumont EST': 'FR_MTP_GA109', // these two wont work
  'Gaumont OUEST': 'FR_MTP_GA250',
};

const keys = ['dateTime', 'name', 'status', 'free', 'total'];

const parseParkingRTXmlData = data => {
  const splitted = data
    .split('\n')
    .slice(2, 7)
    .map(d => d.replace('\t', '').replace('\r', ''));

  const parsed = splitted.reduce((a, v, i) => {
    const value = v.replace(/^[^>]*>/, '').replace(/<.*$/, '');
    a[keys[i]] = value;
    return a;
  }, {});

  return parsed;
};

const getParkingPlaces = async () => {
  const { data: geojson } = await axios.get(`${MONTPELLIER_DATA}/VilleMTP_MTP_ParkingOuv.geojson`);
  const json = geojson.features.reduce((a, f) => {
    a[f.properties.nom] = {
      id: f.properties.id,
      geometry: f.geometry,
    };
    return a;
  }, {});

  await Promise.all(
    Object.keys(PARKINGS).map(async key => {
      if (!json[key]) {
        return console.log(`could not find parking: ${key}`);
      }

      try {
        const { data } = await axios.get(`${MONTPELLIER_DATA}/${PARKINGS[key]}.xml`);
        json[key] = { ...json[key], places: parseParkingRTXmlData(data) };
      } catch (e) {
        console.log(`failed to fetch ${MONTPELLIER_DATA}/${PARKINGS[key]}.xml`);
      }
    })
  );

  return Object.keys(json)
    .filter(key => json[key].places)
    .map(key => ({ name: key, ...json[key] }));
};

const getBikeStations = async () => {
  const { data } = await axios.get(`${MONTPELLIER_DATA}/TAM_MMM_VELOMAG.xml`);
  const sis = data.replace(/<vcs ver="1"><sl>/, '').replace(/<\/sl.*$/, '');
  const splitted = sis
    .split('<si ')
    .filter(d => d.length)
    .map(s =>
      s
        .replace('></si>', '')
        .replace(/=/g, '')
        .split('"')
        .map(d => d.trim())
    );

  return splitted.map(sp => ({
    name: sp[1],
    id: sp[3],
    lat: sp[5],
    lng: sp[7],
    av: sp[9],
    fr: sp[11],
    to: sp[13],
  }));
};

module.exports = {
  getParkingPlaces,
  getBikeStations,
};
