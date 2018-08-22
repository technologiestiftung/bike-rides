const filepath = "assets/all_years.json";
const filepath_v2 = "assets/structure.json";

const years_array = [2012, 2013, 2014, 2015, 2016, 2017];
const months_array = [0,1,2,3,4,5,6,7,8,9,10,11];
const types_array = ['month', 'week'];
let year_value, type_value, radarChart = [];

let config  = {
    width: 180,
    height: 180,
    levels: 10,
    radius: 2,
    factor: 1,
    type: "month",
    month: 0,
    factor_legend: .85,
    max_value: 10000,
    margin: {
        left: 50,
        right: 50,
        top: 50,
        bottom: 100
    }
}

function createWrapper() {
    d3.select('body')
        .append('div')
        .classed('chart-wrapper', true)
}

function createTooltip() {
    let tooltip = d3.select('body')
        .append('div')
        .classed('tooltip-wrapper', true)
        .attr('id', 'tooltip')
    
    tooltip.append('div')
        .classed('month-wrapper', true)
    
    let values_wrapper = tooltip.append('div')
        .classed('values-wrapper', true)
    
    let values_median = values_wrapper.append('div')
        .classed('median', true)
        
        values_median.append('span')
            .text('Median:')
        
        values_median.append('span')
            .attr('id', 'median-value')
            
        let values_max = values_wrapper.append('div')
            .classed('max', true)
            
        values_max.append('span')
            .text('Max:')
        
        values_max.append('span')
            .attr('id', 'max-value')
            
        let values_total = values_wrapper.append('div')
            .classed('total', true)
            
        values_total.append('span')
            .text('Total:')
        
        values_total.append('span')
            .attr('id', 'total-value')
}

function create_filter_ui() {
    let ui_wrapper = d3.select('body')
        .append('div')
        .classed('ui-wrapper', true)
    
    let type_select = ui_wrapper.append('select')
        .classed('select-type', true)
        .on('change', onchange);
    
    let type_options = type_select.selectAll('option')
        .data(types_array)
        .enter()
        .append('option')
        .text(d => { return d })
    
    let select_year = ui_wrapper.append('select')
        .classed('select-year', true)
        .on('change', onchange);

    let year_options = select_year.selectAll('option')
        .data(years_array)
        .enter()
        .append('option')
        .text(d => { return d })
}

function onchange(selected_tag) {
    let year_value_temp = d3.select('.select-year').property('value');
    let type_value_temp = d3.select('.select-type').property('value');
    let used_selection;

    if (year_value_temp != year_value) {
        used_selection = 'year';
        year_value = year_value_temp;
    } else if (type_value_temp != type_value) {
        used_selection = 'type';
        type_value = type_value_temp;
    }

    config.type = type_value;

    if (used_selection == 'year') {
        updateChart(filepath, year_value, type_value);
    } else if (used_selection == 'type') {
        renderChart(filepath, year_value, type_value);
    }

}

function init(file) {
    create_filter_ui();
    createWrapper();
    createTooltip();

    renderChart(file, 2017);
};

function removeCharts() {
    let chart_wrapper = document.querySelector('.chart-wrapper');
    while (chart_wrapper.firstChild) {
        chart_wrapper.removeChild(chart_wrapper.firstChild);
    }
}

function updateChart(file, year) {
    d3.json(file).then((data) => {
        const files_array = Object.keys(data);
        files_array.forEach((file,fi) => {
            radarChart[fi].updateGraphics(data[file][year]);
        })
    })
}

function renderChart(file, year) {

    removeCharts();
    
    d3.json(file).then((data) => {
        const files_array = Object.keys(data);
        files_array.forEach((file,fi) => {
            // change: push all years into radarchart
            radarChart[fi] = new Radarchart(data[file][year], config);
            radarChart[fi].init();
        })
    })
};

init(filepath);