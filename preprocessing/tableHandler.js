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
        this.readDictionary = this.readDictionary.bind(this);
        this.createNestedArray = this.createNestedArray.bind(this);
        this.roundMinutes = this.roundMinutes.bind(this);
        this.roundToHour = this.roundToHour.bind(this);
        this.analyseHours = this.analyseHours.bind(this);
        this.calcMonths = this.calcMonths.bind(this);
        this.calcDays = this.calcDays.bind(this);
        this.calcHoursWeekdays = this.calcHoursWeekdays.bind(this);
        this.calcHoursWeekends = this.calcHoursWeekends.bind(this);
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

        let dict_obj = {};
        obj.dict.data.forEach(row => {
            let shorthand = row[0];
            let name = row[1];

            dict_obj[shorthand] = name;
        })

        this.writeFile('names_dict', JSON.stringify(dict_obj));

        this.years.forEach((year, i) => {

            let array_temp = [];
            
            Xlsx.parse(filepath)[i + 1].data.forEach(row_array => {
                row_array.forEach(value => {
                    if(value == "") {
                        this.temp_cols_array.push(0);
                    } else if (value == null) {
                        this.temp_cols_array.push(0);
                    } else {
                        this.temp_cols_array.push(value);
                    }
                })
                console.log(this.temp_cols_array);
                obj.years[year] = this.temp_cols_array;
                this.temp_cols_array = [];
            });
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
                // console.log(this.obj);
                this.writeFile('all_years', JSON.stringify(this.obj));
            })
        })
    }

    parseData(json) {  
        // '2012', '2013', '2014', '2015', '2016', 
        let years = ['2017']
        fs.readFile(json, 'utf8', (err, data) => {
           if (err) throw err;
           this.data = JSON.parse(data);
           this.dict = this.createDictionary(this.data.dict.data);

           this.fillObj(this.data.years[years[0]].data[0]);

           years.forEach(year => {
               this.restructure_sheet(this.data['years'][year]);
            })
       })
    }

    readDictionary(json) {
        this.dict = this.createDictionary(this.data.dict.data);
        console.log(this.dict);
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

    createNestedArray(array_number) {
        let arr = [];
        for (let index = 0; index < array_number; index++) {
            arr.push([]);
        }
        return arr;
    }

    roundMinutes(date) {
        date.setHours(date.getHours() + Math.round(date.getMinutes()/60));
        date.setMinutes(0);
        return date;
    }

    roundToHour(date) {
        let p = 60 * 60 * 1000; // milliseconds in an hour
        return new Date(Math.round(date.getTime() / p ) * p);
    }

    analyseHours(hrs_arr) {
        let hrs_summed = this.createNestedArray(24);
        hrs_arr.forEach((hour,i) => {
            hrs_summed[i].push({
                median: d3.median(hour),
                max: d3.max(hour),
                hour: i
            })
        })
        return hrs_summed;
    }

    

    parse_data(structured_data) {

        // monsterArray[stationID][year].weeks[0-6].data[,,,,,,,,]
        //                                         .sum
        //                                         .mean
        //                              .months[0-11].data
        //                              .hours[0-23].data
        //                              .hours_weekend[][0-23].data
        //                              .hours_weekday[][0-23].data

        // if(!weekID in .weeks) .weeks[weekID] = []

        // delete .data

        let BreakException = {};

        let value, time, day, month, year, hour, hour_int;
        
        structured_data.forEach((station, index_station) => {
            let station_data_temp = {
                'months': [{'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}],
                'days': [{'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}],
                'hoursWeekdays': [{'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}],
                'hoursWeekends': [{'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}, {'data': [], 'sum': 0, 'median': 0, 'max': 0}],
            }

            
            if(station.name != 'Date') {
                this.station_name = station.name;

                let day_data = [];
                let day_of_year = 0;
                let day_current = station.values[0].time.getDay();
                let unique_key;
                
                station.values.forEach((timeslot, index_timeslot) => {

                    
                    value = timeslot.value;
                    time = timeslot.time;
                    day = time.getDay();
                    month = time.getMonth();
                    year = time.getYear() + 1900;
                    this.year = year;
                    hour = time.getHours();
                    hour_int = this.roundToHour(time).getHours();
                    
                    if (day_current != day) {
                        day_current = day;
                        day_of_year++;
                    }
                    // add value to month
                    station_data_temp.months[month].data.push({
                        'day_of_year': day_of_year,
                        'month': month,
                        'value': value
                    })

                    // add value to correct day in data
                    station_data_temp.days[day].data.push({
                        'day_of_year': day_of_year,
                        'month': month,
                        'value': value
                    })

                    // add value to correct day in data
                    station_data_temp.hoursWeekdays[hour_int].data.push({
                        'day_of_year': day_of_year,
                        'day': day,
                        'value': value,
                        'time': time,
                        'hour': hour_int
                    })

                    // add value to correct day in data
                    station_data_temp.hoursWeekends[hour_int].data.push({
                        'day_of_year': day_of_year,
                        'day': day,
                        'value': value,
                        'time': time,
                        'hour': hour_int
                    })

                })

                if(this.year == 2018) {
                    this.year = 2017;
                }

                if(this.data_transformed[station.name][this.year] != undefined) {
                    this.data_transformed[station.name][this.year].push(station_data_temp);

                    // calculate median, max, min values for time sequences
                    station_data_temp.months = this.calcMonths(station_data_temp.months);
                    station_data_temp.days = this.calcDays(station_data_temp.days);
                    station_data_temp.hoursWeekdays = this.calcHoursWeekdays(station_data_temp.hoursWeekdays);
                    station_data_temp.hoursWeekends = this.calcHoursWeekends(station_data_temp.hoursWeekends);

                    throw BreakException;
                }
            }
        })


        // write all data to json file
        // this.writeFile(year, JSON.stringify(this.data_transformed));
    }

    calcHoursWeekends(hours) {
        let hours_array = this.createNestedArray(24);
        hours.forEach((hour, index_hour) => {
            hour.data.forEach((data_value, index) => {
                if (data_value.day == 0 || data_value.day == 6) {
                    hours_array[data_value.hour].push(data_value.value)
                }
            })
        })
        
        hours.forEach((hour, index) => {
            hour.sum = _.sum(hours_array[index]);
            hour.median = d3.median(hours_array[index]);
            hour.max = d3.max(hours_array[index]);

            delete hour.data; // remove this if you want to see data behind
        })

        return hours;
    }

    calcHoursWeekdays(hours) {
        let hours_array = this.createNestedArray(24);
        hours.forEach((hour, index_hour) => {
            hour.data.forEach((data_value, index) => {
                if (data_value.day != 0 && data_value.day != 6) {
                    hours_array[data_value.hour].push(data_value.value)
                }
            })
        })
        
        hours.forEach((hour, index) => {
            hour.sum = _.sum(hours_array[index]);
            hour.median = d3.median(hours_array[index]);
            hour.max = d3.max(hours_array[index]);

            delete hour.data; // remove this if you want to see data behind
        })

        return hours;
    }

    calcDays(days) {

        let days_array = this.createNestedArray(7);

        days.forEach((day, index_day) => {
            let day_data = [];
            let day_current = day.data[index_day].day_of_year;
            
            day.data.forEach((data_value, index) => {
                if(day_current != data_value.day_of_year) {

                    day_current = data_value.day_of_year;
                    let sum_of_day = _.sum(day_data);
                    days_array[index_day].push(sum_of_day);
                    day_data = [];
                } 
                day_data.push(data_value.value);
            })
        })

        days.forEach((day, index) => {
            day.sum = _.sum(days_array[index]);
            day.median = d3.median(days_array[index]);
            day.max = d3.max(days_array[index]);

            delete day.data; // remove this if you want to see data behind
        })

        return days;
    }

    calcMonths(months) {
        let day_current = months[0].data[0].day_of_year;
        let months_array = this.createNestedArray(12);

        months.forEach(month_current => {
            let day_data = [];

            month_current.data.forEach((data_value, index) => {

                if (day_current != data_value.day_of_year) {
                    
                    day_current = data_value.day_of_year;
                    let sum_of_day = _.sum(day_data);
                    months_array[data_value.month].push(sum_of_day);
                    day_data = [];
                }

                day_data.push(data_value.value);
            })

        })

        // console.log(months_array);

        months.forEach((month, index) => {
            month.sum = _.sum(months_array[index]);
            month.median = d3.median(months_array[index]);
            month.max = d3.max(months_array[index]);

            delete month.data; // remove this if you want to see data behind
        })

        return months;
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
                    "name": this.station_name,
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
