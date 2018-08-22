const fs = require('fs');
const d3 = require('d3');
const Xlsx = require('node-xlsx');
const _ = require('lodash');

class Tablehandler {
    constructor(filepath) {
        this.filepath = filepath
        this.filename = "";
        this.years = ['2012', '2013', '2014', '2015', '2016', '2017'];
        this.location = {};
        this.sheet_location = {};
        this.month_current = 0;
        this.day_current = 0;
        this.timestamp;
        this.year, this.obj;
        this.month_data = [];
        this.weekdays = [[], [], [], [], [], [], []];
        this.weekdays_summed = [[], [], [], [], [], [], []];
        this.weekdays_used = [0,1,2,3,4,5,6];

        this.weekdays_current_flat, this.month_data_current, this.weekdays_data_current, this.station_name, this.temp_cols_array = [];

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
        this.data = {}, this.data_transformed = {};
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
        this.move_temp_data = this.move_temp_data.bind(this);
        this.mergeJsons = this.mergeJsons.bind(this);
        this.createObj = this.createObj.bind(this);
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

        this.years.forEach((year, i) => {

            let array_temp = [];
            
            Xlsx.parse(filepath)[i + 2].data.forEach(row_array => {
                row_array.forEach(value => {
                    if(value == "") {
                        this.temp_cols_array.push('no data');
                    } else {
                        this.temp_cols_array.push(value);
                    }
                    
                })
                array_temp.push(this.temp_cols_array);
            });
            obj.years[year] = this.temp_cols_array
            this.temp_cols_array = [];
        })

        this.writeFile('location' , JSON.stringify(obj));
    }

    createObj(file_array) {
        fs.readFile('./data/object_structure.json', 'utf8', (err, data) => {
            this.obj = JSON.parse(data);
            this.mergeJsons(file_array, this.obj);
        })
    }

    mergeJsons(file_array, obj) {
        
        file_array.forEach((file, i) => {
            let year = file.slice(0,4)
            let file_path = `./data/${file}`;
            fs.readFile(file_path, 'utf8', (err, data) => {
                this.data = JSON.parse(data);
                let stations_array = [];
                for(var key in this.data) {
                    stations_array.push(key);
                }
                
                for (var station in this.data) {
                    if (this.data[station] != undefined && this.obj[station] != undefined) {
                            this.obj[station][year] = this.data[station][year];
                    }
                }
                this.writeFile('all_years', JSON.stringify(this.obj));
            })
        })
    }

    parseData(json) {  
        // '2012', '2013', '2014', '2015', '2016', 
        let years = ['2012']
        fs.readFile(json, 'utf8', (err, data) => {
           if (err) throw err;
           this.data = JSON.parse(data);
           this.dict = this.createDictionary(this.data.dict.data);

           this.fillObj(this.data.years['2017'].data[0]);

           years.forEach(year => {
               this.restructure_sheet(this.data['years'][year]);
           })
           this.writeFile(years[0], JSON.stringify(this.data_transformed));
       })
    }

    createDictionary(d) {
        const cols = d[0];
        const d_new = d.slice(1);
        let dict = {};
        
        d_new.forEach((station,index) => {
            if (station[1] == null) {
                dict[station[0]] = station[2];
            } else {
                dict[station[0]] = station[1];
            }
        })
        return dict;
    }

    fillObj(cols_array) {
        cols_array.forEach((col,i) => {
            if (i > 0) {
                this.data_transformed[col] = {
                    "2012": [],
                    "2013": [],
                    "2014": [],
                    "2015": [],
                    "2016": [],
                    "2017": []
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
        let BreakException = {};
        let stations_temp = [];

        for (let index = 0; index < 27; index++) {
            stations_temp.push([]);
        }

        structured_data.forEach((station, index_station) => {
            if(station.index > -1) {

                this.station_name = station.name;
                const station_values = station.values;
                if (station.values[0] != undefined) {
                    this.day_current = station.values[0].time.getDay(); // day 0 == sunday
                } else {
                    this.day_current = 0;
                }
                // throw BreakException;
                let day_data = [];

                station_values.forEach((timeslot, index_timeslot) => {
                    const value = timeslot.value;
                    const time = timeslot.time;
                    const day = time.getDay();
                    const month = time.getMonth();
                    const year = time.getYear() + 1900;

                    let months_test = [];
                    this.year = year;
                
                    day_data.push(value);
                    this.month_data.push(parseInt(value));
                    
                    if (this.day_current != day) {                                   // condition per day
                        this.day_current = day;
                        this.weekdays_used = _.remove(this.weekdays_used, function(n) {
                            return n != day;
                        });
                        day_data.forEach(value => {
                            this.weekdays[day].push(parseInt(value));
                        })
                        day_data = [];
                    } else if (this.weekdays_used.length == 0) {                     // condition per week
                        this.weekdays.forEach((day, i) => {
                            this.weekdays_summed[i].push(_.sum(day));
                            this.weekdays_used = [0,1,2,3,4,5,6];
                            this.weekdays = [[], [], [], [], [], [], []];
                        })
                    } else if ((this.month_current < month && this.month_current < 11)) {     
                        // reset weekdays
                        this.weekdays.forEach((day, i) => {
                            this.weekdays_summed[i].push(_.sum(day));
                            this.weekdays_used = [0,1,2,3,4,5,6];
                            this.weekdays = [[], [], [], [], [], [], []];
                        });
                        
                        this.weekdays_current_flat = _.flattenDeep(this.weekdays_summed);
                        this.weekdays_data_current = this.analyse_weekdays(this.weekdays_summed);
                        this.month_data_current = this.analyse_month(this.month_data, this.weekdays_current_flat, this.weekdays_data_current);

                        // console.log(this.month_data_current)
                        // throw BreakException;
                        
                        // stations_temp[index_station].push(this.month_data_current);
                        this.data_transformed[station.name][this.year].push(this.month_data_current);
                        
                        this.month_data = [];
                        this.weekdays_summed = [[], [], [], [], [], [], []];
                        this.month_current = month;                    // condition per month

                    } else if (this.month_current == 11 && station_values.length == index_timeslot + 2) {
                        // reset weekdays
                        this.weekdays.forEach((day, i) => {
                            this.weekdays_summed[i].push(_.sum(day));
                            this.weekdays_used = [0,1,2,3,4,5,6];
                            this.weekdays = [[], [], [], [], [], [], []];
                        });
                        
                        this.weekdays_current_flat = _.flattenDeep(this.weekdays_summed);
                        this.weekdays_data_current = this.analyse_weekdays(this.weekdays_summed);
                        this.month_data_current = this.analyse_month(this.month_data, this.weekdays_current_flat, this.weekdays_data_current);

                        // console.log(this.month_data_current)
                        // throw BreakException;
                        
                        // stations_temp[index_station].push(this.month_data_current);
                        this.data_transformed[station.name][this.year].push(this.month_data_current);
                        
                        this.month_data = [];
                        this.weekdays_summed = [[], [], [], [], [], [], []];
                        this.month_current = 0;                    // condition per month
                    }
                })
            }
        })
    }

    move_temp_data(data_temp_year) {
        this.data_transformed[this.station_name][this.year]
    }

    analyse_month(month_data, days, days_analysed) {
        return {
            name: this.station_name,
            month: this.month_current,
            min: _.min(days),
            max: _.max(days),
            median: d3.median(days),
            mean: Math.round(d3.mean(days)),
            sum_days: _.sum(days),
            days: days_analysed,
        }
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
