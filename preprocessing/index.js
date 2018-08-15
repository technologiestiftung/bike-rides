const Tablehandler = require('./tableHandler');

const xlsx = './data/rides.xlsx';
const json = './data/rides.json';

const tableHandler = new Tablehandler();

// tableHandler.parseXlsx2Json(xlsx);
tableHandler.parseData(json);