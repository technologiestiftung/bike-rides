const Tablehandler = require('./tableHandler');

const sheet = './data/rides.xlsx';
const csv = './data/processed/02-MI-JAN-S.csv';
const csv2 = './data/processed/03-MI-SAN-O.csv';

const tableHandler = new Tablehandler();

// const data = tableHandler.parseData(sheet, 7, 1);

// for (let index = 1; index < 28; index++) {
//     const data = tableHandler.parseData(sheet, 7, index);
// }

tableHandler.readCSV(csv2);