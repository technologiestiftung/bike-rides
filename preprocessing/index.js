const Tablehandler = require('./tableHandler');

const xlsx = './data/rides.xlsx';
const json = './data/rides.json';
const files = ['2012.json', '2013.json', '2014.json', '2015.json', '2016.json', '2017.json'];

const tableHandler = new Tablehandler();



// Readme
// 1. parse the xlsx (run: parseXlsx2Json())
// tableHandler.parseXlsx2Json(xlsx);

// 2. parse data for each year (2012 - 2017)
// tableHandler.parseData(json);

// 3. merge jsons
tableHandler.createObj(files);