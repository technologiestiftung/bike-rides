const filepath = "assets/02-MI-JAN-S_summed.json";
const filepath_v2 = "assets/structure.json";


let config  = {
    width: 180,
    height: 180,
    levels: 10,
    radius: 2,
    factor: 1,
    factor_legend: .85,
    max_value: 1000,
    margin: {
        left: 50,
        right: 50,
        top: 50,
        bottom: 100
    }
}


function readData(file) {
    const files_array = ['02-MI-JAN-S', '03-MI-SAN-O'];
    d3.json(file).then((data) => {
        files_array.forEach(file => {
            console.log(data[file]);
            // change: push all years into radarchart
            const radarChart = new Radarchart(data[file]['2017'], config); 
            radarChart.init(); 
        })
    })
}

readData(filepath_v2);