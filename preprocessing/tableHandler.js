const fs = require('fs');
const d3 = require('d3');
const Xlsx = require('node-xlsx');
const _ = require('lodash');

class Tablehandler {
    constructor(filepath) {
        this.filepath = filepath
        this.filename = "";
        this.location = {};
        this.sheet_location = {};
        this.month_current = 0;
        this.day_current = 0;
        this.timestamp;
        this.year;
        this.month_data = [];
        this.weekdays = [[], [], [], [], [], [], []];
        this.weekdays_summed = [[], [], [], [], [], [], []];
        this.weekdays_used = [0,1,2,3,4,5,6];
        this.stations = [
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []},
            { "index": 0, "name": "", "values": []}
        ]
        this.data, this.data_transformed = {};
        this.col_ids,
        this.writeFile = this.writeFile.bind(this);
        this.getJsDateFromExcel = this.getJsDateFromExcel.bind(this);
        this.readCSV = this.readCSV.bind(this);
        this.parseXlsx2Json = this.parseXlsx2Json.bind(this);
        this.parseData = this.parseData.bind(this);
        this.createDictionary = this.createDictionary.bind(this);
        this.restructure_sheet = this.restructure_sheet.bind(this);
        this.fillObj = this.fillObj.bind(this);
        this.stash_row = this.stash_row.bind(this);
        this.parse_data = this.parse_data.bind(this);
        this.analyse_weekdays = this.analyse_weekdays.bind(this);
        this.analyse_month = this.analyse_month.bind(this);
    }

    parseXlsx2Json(filepath) {
        let obj = {
            years: {
                "2012": '',
                "2013": '',
                "2014": '',
                "2015": '',
                "2016": '',
                "2017": '',
            }
        };

        obj.dict = Xlsx.parse(filepath)[1];
        obj.years['2012'] = Xlsx.parse(filepath)[2];
        obj.years['2013'] = Xlsx.parse(filepath)[3];
        obj.years['2014'] = Xlsx.parse(filepath)[4];
        obj.years['2015'] = Xlsx.parse(filepath)[5];
        obj.years['2016'] = Xlsx.parse(filepath)[6];
        obj.years['2017'] = Xlsx.parse(filepath)[7];

        this.writeFile('location' , JSON.stringify(obj));
    }

    parseData(json) {  
       fs.readFile(json, 'utf8', (err, data) => {
           if (err) throw err;
           this.data = JSON.parse(data);
           this.dict = this.createDictionary(this.data.dict.data);

           this.fillObj(this.data.years['2017'].data[0]);
           this.restructure_sheet(this.data.years['2017']);
       })
    }

    createDictionary(d) {
        const cols = d[0];
        const d_new = d.slice(1);
        let dict = {};
        
        d_new.forEach((station,index) => {
            dict[station[0]] = station[1];
        })
        return dict;
    }

    fillObj(cols_array) {
        cols_array.forEach((col,i) => {
            if (i > 0) {
                this.data_transformed[col] = {
                    "2012": "",
                    "2013": "",
                    "2014": "",
                    "2015": "",
                    "2016": "",
                    "2017": ""
                };
            }
        })
    }

    restructure_sheet(sheet_obj) {
        this.col_ids = sheet_obj.data[0];
        const year = sheet_obj.name.slice(12);
        const sheet_obj_new = sheet_obj.data.slice(1);
        let data_transformed = [];

        sheet_obj_new.forEach((row, index) => {

            let month_values = [];
            this.timestamp = new Date(this.getJsDateFromExcel(row[0]));
            
            if(this.timestamp != undefined) {
                row.forEach((column, index) => {
                    this.stash_row(column, index, this.stations);
                })
            }
        })
        this.parse_data(this.stations);
    }

    stash_row(col, index, station_obj) {
        station_obj[index].index = index - 1;
        station_obj[index].name = this.col_ids[index];
        station_obj[index].values.push(
            {
                value: col,
                time: this.timestamp,
            }
        );
    }

    parse_data(structured_data) {
        // do it for each station
        const station_test = structured_data[25].values;
        this.day_current = station_test[2].time.getDay(); // day 0 == sunday
        let BreakException = {};
        let day_data = [];

        station_test.forEach(timeslot => {
            const value = timeslot.value;
            const time = timeslot.time;
            const day = time.getDay();
            const month = time.getMonth();
            const year = time.getYear() + 1900;
            this.year = year;
            
            throw BreakException;

            day_data.push(value);
            this.month_data.push(value);
            
            if(this.day_current != day) {                                   // condition per day
                this.day_current = day;
                this.weekdays_used = _.remove(this.weekdays_used, function(n) {
                    return n != day;
                });
                day_data.forEach(value => {
                    this.weekdays[day].push(value);
                })
                day_data = [];
            } else if(this.weekdays_used.length == 0) {                     // condition per week
                this.weekdays.forEach((day, i) => {
                    this.weekdays_summed[i].push(_.sum(day));
                    this.weekdays_used = [0,1,2,3,4,5,6];
                    this.weekdays = [[], [], [], [], [], [], []];
                })
            } else if(this.month_current < month) {                         // condition per month
                // reset weekdays
                this.weekdays.forEach((day, i) => {
                    this.weekdays_summed[i].push(_.sum(day));
                    this.weekdays_used = [0,1,2,3,4,5,6];
                });
                
                let weekdays_current_flat = _.flattenDeep(this.weekdays_summed);
                let month_data_current = this.analyse_month(this.month_data, weekdays_current_flat);
                let weekdays_data_current = this.analyse_weekdays(this.weekdays_summed);

                // add data to data object
                
                this.weekdays = [[], [], [], [], [], [], []];
            }

            
            
            // what happens if month is the last in sheet?
        })

    }

    analyse_weekdays(days) {
        let days_analysed = [];
        let day_dict = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        days.forEach((day, index) => {
            days_analysed.push(
                {
                    "day": day_dict[index],
                    "min": _.min(day),
                    "max": _.max(day),
                    "median": d3.median(day),
                    "mean": d3.mean(day),
                }
            )
        })
        return days_analysed;
    }

    analyse_month(month_data, days) {
        return {
            month: this.month_current,
            min: _.min(days),
            max: _.max(days),
            median: d3.median(days),
            mean: d3.mean(days),
            sum: _.sum(month_data),
            sum2: _.sum(days),
            length: days.length,
            length_month: month_data.length / 24
        }
    }

    fill_with_current_month(stations) {
        let rides_per_month = _.sum(month_values);
            let median = d3.median(month_values);
            let mean = d3.mean(month_values);
            let month_min = _.min(month_values);
            let month_max = _.max(month_values);
            let lat = "here add lng value";
            let lng = "here add lat value";
            let location = "here add location";

            data_transformed.push(
                {
                    "year": year,
                    "month": this.current_month,
                    "min": month_min,
                    "max": month_max,
                    "median": median,
                    "mean": mean,
                    "lat": lat,
                    "lng": lng,
                    "location": location,
                    "rides_per_month": rides_per_month,
                }
            );

            month_values = [];
            lat = 0;
            lng = 0;
            month_min = 0;
            month_max = 0;
            mean = 0;
            location = '';
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

    writeFile(file, obj) {
        const filepath = 'data/' + file + '.json'
        fs.writeFileSync(filepath, obj, 'utf8');
    };

    getJsDateFromExcel(excelDate) {      
          return new Date((excelDate - (25567 + 2))*86400*1000);
    }
}

module.exports = Tablehandler;
