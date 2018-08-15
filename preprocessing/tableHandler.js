const fs = require('fs');
const Xlsx = require('node-xlsx');
const csv = require('fast-csv');
const _ = require('lodash');

class Tablehandler {
    constructor(filepath) {
        this.filepath = filepath
        this.filename = "";
        this.location = {};
        this.sheet = {};
        this.current_month = 0;
        this.data_temp = [];
        this.showData = this.showData.bind(this);
        this.getStation = this.getStation.bind(this);
        this.writeFile = this.writeFile.bind(this);
        this.getJsDateFromExcel = this.getJsDateFromExcel.bind(this);
        this.readCSV = this.readCSV.bind(this);
        this.parseCSV = this.parseCSV.bind(this);
        this.calcMedian = this.calcMedian.bind(this);
    }

    readCSV(filepath) {
        this.filename = filepath.slice(17,28);
        const stream = fs.createReadStream(filepath)
            .pipe(csv())
            .on('data',(data) => {
                this.data_temp.push(data);
            })
            .on('end', data => {
                this.parseCSV(this.data_temp)
                console.log('Reading finished!');
            })
    }

    calcMedian(numbers) {
        // median of [3, 5, 4, 4, 1, 1, 2, 3] = 3
        let median = 0, numsLen = numbers.length;
        numbers.sort();
     
        if (
            numsLen % 2 === 0 // is even
        ) {
            // average of two middle numbers
            median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
        } else { // is odd
            // middle number only
            median = numbers[(numsLen - 1) / 2];
        }
     
        return median;
    }

    parseCSV(data_array) {
        const cols = data_array[0];
        let month_values = [];
        let data_transformed = [];

        data_array.forEach((row, index) => {
            let timestamp = new Date(row[0]);
            let lat = row[2];
            let lng = row[3];
            let location = row[4];
            let year = timestamp.getFullYear();
            if (timestamp.getMonth() == this.current_month) {
                month_values.push(Number(row[1]));
                lat = row[2];
                lng = row[3];
                location = row[4];
                year = timestamp.getFullYear();
            } else if ((timestamp.getMonth() > this.current_month) || (index + 2) == data_array.length) {

                let rides_per_month = _.sum(month_values);
                let median = this.calcMedian(month_values);

                let month_min = _.min(month_values);
                let month_max = _.max(month_values);
                let month_mean = _.mean(month_values);

                data_transformed.push(
                    {
                        year: year,
                        month: this.current_month,
                        min: month_min,
                        max: month_max,
                        mean: month_mean,
                        median: median,
                        lat: lat,
                        lng: lng,
                        location: location,
                    }
                );

                month_values = [];
                lat = 0;
                lng = 0;
                month_min = 0;
                month_max = 0;
                month_mean = 0;
                location = '';
            }
            this.current_month = timestamp.getMonth();

        })

        this.writeFile(`${this.filename}_summed`, JSON.stringify(data_transformed));
    }

    parseData(filepath, sheetnumber = 7, column) {
        this.sheet = Xlsx.parse(filepath)[sheetnumber];
        this.location = Xlsx.parse(filepath)[1];

        const ids = this.sheet.data[0].slice(1);
        this.getStation(column);
    }

    showData() {
        console.log(this.sheet.data[0]);
    }

    getStation(index = 0) {
        // current id
        const id = this.sheet.data[0][index + 1];
        let restructured = "date, rides, lat, lng, location, install_date \n";

        this.sheet.data.forEach((row ,i)=> {
            let row_current = [];
            // let time = new Date(this.getJsDateFromExcel(row[0]));
            let time = new Date(this.getJsDateFromExcel(row[0])) != "Invalid Date" ? new Date(this.getJsDateFromExcel(row[0])).toISOString() : null;
            let ride_values = row[index + 1];
            let lat, lng, location, install_date
            if (i > 0) {
                this.location.data.forEach(station => {
                    if (station[0] == id) {
                        lat = station[2];
                        lng = station[3];
                        location = station[1];
                        // install_date = this.getJsDateFromExcel(station[4]);
                        install_date = new Date(this.getJsDateFromExcel(station[4])) != "Invalid Date" ? new Date(this.getJsDateFromExcel(station[4])).toISOString() : null;
                    }
                });
    
                if(time != undefined && ride_values != undefined) {
                    row_current.push(time, ride_values, lat, lng, location, install_date);
                }
                row_current.forEach((item, i) => {
                    if (row_current.length == i + 1) {
                        restructured += item;
                    } else {
                        restructured += item + ', ';
                    }

                });
            }
            restructured += '\n';
        });
        this.writeFile(id, restructured)
    }

    writeFile(file, obj) {
        const filepath = 'data/' + file + '.json'
        // console.log(obj);
        fs.writeFileSync(filepath, obj, 'utf8');
    };

    getJsDateFromExcel(excelDate) {      
          return new Date((excelDate - (25567 + 2))*86400*1000);
    }
}

module.exports = Tablehandler;
