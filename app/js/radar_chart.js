class Radarchart {
    constructor(file, config) {
        this.width = config.width;
        this.container = config.container;
        this.height = config.height;
        this.levels = config.levels;
        this.radius = config.radius;
        this.factor = config.factor;
        this.margin = config.margin;
        this.max_value = config.max_value;
        this.factor_legend = config.factor_legend;
        this.station_name, this.tooltip, this.month_dict, this.month_dict_long, this.all_axis_week, this.circles = {}, this.updateCount = 0, this.areas = {}

        this.file = file;
        this.radians = 2 * Math.PI;
        this.segmentsWrapper, this.nodesWrapper, this.areasWrapper
        this.data, this.svg, this.all_axis, this.axis, this.title
        this.total, this.node_coords = {'mean':[], 'max':[]};

        this.init = this.init.bind(this);
        this.createSegments = this.createSegments.bind(this);
        this.createAxis = this.createAxis.bind(this);
        this.createCircles = this.createCircles.bind(this);
        this.createAreas = this.createAreas.bind(this);
        this.createGraphics = this.createGraphics.bind(this);
        this.createTitle = this.createTitle.bind(this);
        this.updateTooltip = this.updateTooltip.bind(this);
        this.updateCircles = this.updateCircles.bind(this);
        this.updateGraphics = this.updateGraphics.bind(this);
    }

    init(dataset) {
            this.data = this.file;
            // make all data accessible
            this.station_name = this.file[0].name;
            this.all_axis = (this.data.map((i,j) => {return i.month}));
            // this.all_axis_week = this.data[0].days.length;
            this.total = config.type == 'week' ? this.all_axis_week : this.all_axis.length;

            this.svg = d3.select('.chart-wrapper')
                .append('svg')
                .attr('width', this.width + this.margin.left + this.margin.right)
                .attr('height', this.height + this.margin.top + this.margin.bottom)
                
            this.segmentsWrapper = this.svg.append('g')
                .classed('segments-wrapper', true)
            
            this.nodesWrapper = this.svg.append('g')
                .classed('nodes-wrapper', true)
            
            this.areasWrapper = this.svg.append('g')
                .classed('areas-wrapper', true)
            
            this.title = this.svg.append('g')
                .classed('title-wrapper', true)

            this.createSegments();
            this.createTitle();
            // this.switchData();
    }

    createSegments() {
        for (let index = 0; index < this.levels; index++) {
            let radius = this.factor*Math.min(this.width/2, this.height/2);
            let level_factor = this.factor * radius * ((index + 1) / this.levels)

            this.segmentsWrapper.selectAll('.levels')
                .data(this.all_axis)
                .enter()
                .append('svg:line')
                .attr('x1', (d,i) => { 
                    let polar_coord = level_factor * (this.factor*Math.sin(i*this.radians/this.total));
                    return polar_coord;
                 })
                .attr('y1', (d,i) => { 
                    let polar_coord = level_factor * (this.factor*Math.cos(i*this.radians/this.total))
                    return polar_coord
                 })
                .attr('x2', (d,i) => { 
                    let polar_coord = level_factor * (this.factor*Math.sin((i+1)*this.radians/this.total));
                    return polar_coord
                 })
                .attr('y2', (d,i) => {
                    let polar_coord = level_factor * (this.factor*Math.cos((i+1)*this.radians/this.total));
                    return polar_coord
                 })
                .attr("class", "line")
                .style('stroke', '#E8E8E8')
                .style("stroke-opacity", "1px")
                .style("stroke-width", "1px")
                .attr('transform', `translate( ${this.width/2 + this.margin.left}, ${this.height/2  + this.margin.top})`)
        }
        this.createAxis();
    }
        
    createAxis() {
        this.month_dict = {
            0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'Mai', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Okt', 10: 'Nov', 11: 'Dec'
        }

        this.month_dict_long = {
            0: 'January', 1: 'February', 2: 'March', 3: 'April', 4: 'May', 5: 'June', 6: 'July', 7: 'August', 8: 'September', 9: 'October', 10: 'November', 11: 'December'
        }

        this.axis = this.segmentsWrapper.selectAll('.axis')
            .data(this.all_axis)
            .enter()
            .append('g')
            .classed('axis', true)
        
        this.axis.append('line')
            .attr('x1', (this.margin.left))
            .attr('y1', (this.margin.top))
            .attr('x2', (d,i) => { 
                return (this.width / 2) * (this.factor * Math.sin(i  * this.radians / this.total)) + this.margin.left;
            })
            .attr('y2', (d,i) => { 
                return (this.height / 2) * (this.factor * Math.cos (i * this.radians / this.total)) + this.margin.top;
            })
            .attr("class", "line")
            .style('stroke', '#E8E8E8')
            .style("stroke-width", "1px")
            .attr('transform', `translate( ${this.width/2 }, ${this.height/2 })`)
        
        this.axis.append('text')
            .attr('class', 'legend')
            .text(d => { 
                return this.month_dict[d]})
            .style('font-size', '10px')
            .attr('color', 'blue')
            .attr("text-anchor", "middle")
            .attr('x', (d,i) => {
                return (this.width / 2) * (this.factor * Math.sin(i * this.radians / this.total)) + 15 * Math.sin(i * this.radians / this.total)  + this.margin.left;
            })
            .attr('y', (d,i) => {
                return (this.height / 2) * (this.factor * Math.cos (i * this.radians / this.total)) + 15 * Math.cos(i * this.radians / this.total)  + this.margin.top;
            })
            .attr('transform', `translate( ${this.width/2 }, ${this.height/2 })`)

            this.createGraphics();
    }

    createCircles(category, color) {
        this.node_coords[category] = [];
        this.circles[category] = this.nodesWrapper.selectAll(`.${category}-circle`);
        this.updateCircles(category, color);

        this.createAreas(this.node_coords[category], color, category);
    }

    createAreas(data, color, category) {
        this.areas[category] = this.areasWrapper.selectAll(`.${category}-area`);
        this.updateAreas(this.node_coords[category], color, category);
    }

    createGraphics() {
        this.createCircles('max', 'red');
        this.createCircles('mean', 'blue');
    }


    createTitle() {
        this.title.append('text')
            .text(this.station_name)
            .classed('title', true)
    }

    updateTooltip(data) {
        let x = d3.event.pageX + 10;
        let y = d3.event.pageY + 10;

        this.tooltip = d3.select('#tooltip');

        d3.select('.month-wrapper').text(this.month_dict_long[data.month]);
        d3.select('#median-value').text(data.median);
        d3.select('#max-value').text(data.max);
        d3.select('#total-value').text(data.sum_days);

        this.tooltip
            .attr('style', `left: ${x}px; top: ${y}px; position: absolute`)
    }

    updateGraphics(new_data) {
        this.data = new_data;
        this.width = config.width;
        this.max_value = config.max_value;

        // console.log(config.max_value);

        this.updateCircles('max', 'red');
        this.updateCircles('mean', 'blue');
    }

    updateAreas(data, color, category) {
        this.areas[category] = this.areasWrapper.selectAll(`.${category}-area`)
            .data([data])
        
        this.areas[category].exit().remove()

        this.areas[category] = this.areas[category]
            .enter()
            .append('polygon')
            .classed(`${category}-area`, true)
            .style("stroke-width", "2px")
            .style('fill', color)
            .merge(this.areas[category]);

        this.areas[category]
            .transition()
            .duration(500)
            .attr('points', d => {
                let str = "";
                for(var pti=0;pti<d.length;pti++) {
                    str = str+d[pti][0]+","+d[pti][1]+" ";
                }
                return str;
            })
            .attr('transform', `translate( ${(this.width/2 + this.margin.left) - this.factor}, ${(this.height/2 + this.margin.top)  - this.factor})`)
    }

    updateCircles(category, color) {

        this.node_coords = {'mean':[], 'max':[]};

        this.circles[category] = this.nodesWrapper.selectAll(`.${category}-circle`)
            .data(this.data)

        this.circles[category].exit().remove()

        this.circles[category] = this.circles[category]
            .enter()
            .append('svg:circle')
            .classed(`${category}-circle`, true)
            .attr('fill', color)
            .attr('r', this.radius)
            .on('mouseover', d => {
                this.updateTooltip(d);
            })
            .on('mouseout', d => {
                this.tooltip
                    .attr('style', 'display: none')
            })
            .merge(this.circles[category]);
        
        this.circles[category]
            .transition()
            .duration(500)
            .attr('cx', (d,i) => {
                let value_temp = config.type == "week" ? d.days[category] : d[category];
                let polar_coord_x = (this.width / 2) * (d[category] / this.max_value) * this.factor * Math.sin(i*this.radians / this.total);
                let polar_coord_y = (this.height / 2) * (d[category] / this.max_value) * this.factor * Math.cos(i*this.radians / this.total);

                let single_coord = [];
                single_coord.push(polar_coord_x);
                single_coord.push(polar_coord_y);
                this.node_coords[category].push(single_coord);

                return polar_coord_x
            })
            .attr("cy", (d,i) => {
                let polar_coord = this.height / 2 * (d[category] / this.max_value)*this.factor* Math.cos(i*this.radians/this.total);
                return polar_coord;
            })
            .attr('transform', `translate( ${(this.width/2 + this.margin.left) - this.factor}, ${(this.height/2 + this.margin.top)  - this.factor})`)
            
            
            this.updateAreas(this.node_coords[category], color, category);
    }

}