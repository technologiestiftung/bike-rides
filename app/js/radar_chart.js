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

        this.file = file;
        this.radians = 2 * Math.PI;
        this.segmentsWrapper, this.nodesWrapper, this.areasWrapper
        this.data, this.svg, this.all_axis, this.axis, this.title
        this.total, this.node_coords;

        this.init = this.init.bind(this);
        this.createSegments = this.createSegments.bind(this);
        this.createAxis = this.createAxis.bind(this);
        this.createCircles = this.createCircles.bind(this);
        this.createArea = this.createArea.bind(this);
        this.createGraphics = this.createGraphics.bind(this);
        this.createTitle = this.createTitle.bind(this);
    }

    init() {
            this.data = this.file;
            this.all_axis = (this.data.map((i,j) => {return i.month}));
            this.total = this.all_axis.length;

            this.svg = d3.select('body')
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
        let month_dict = {
            0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'Mai', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Okt', 10: 'Nov', 11: 'Dec'
        }

        this.axis = this.segmentsWrapper.selectAll('.axis')
            .data(this.all_axis)
            .enter()
            .append('g')
            .classed('axis', true)
        
        this.axis.append('line')
            .attr('x1', (this.width / 2 + this.margin.left))
            .attr('y1', (this.height / 2 + this.margin.top))
            .attr('x2', (d,i) => { return ((this.width) / 2) * (1-this.factor * Math.sin(i * this.radians + Math.PI / this.total)) + this.margin.left })
            .attr('y2', (d,i) => { return ((this.height) / 2) * (1-this.factor * Math.cos (i * this.radians + Math.PI / this.total)) + this.margin.top })
            .attr("class", "line")
            .style('stroke', '#E8E8E8')
            .style("stroke-width", "1px")
        
        this.axis.append('text')
            .attr('class', 'legend')
            .text(d => { 
                return month_dict[d]})
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

    createGraphics() {
        this.createCircles('max', 'red');
        this.createCircles('min', 'green');
        this.createCircles('mean', 'blue');
    }

    createCircles(category, color) {
        let coords = [];
        let single_coord = [];
        this.nodesWrapper.selectAll('.nodes')
            .data(this.data)
            .enter()
            .append('svg:circle')
            .attr('fill', color)
            .attr('r', this.radius)
            .attr('cx', (d,i) => {

                // console.log(`${category}: ${d[category]}, ${i}`)

                let polar_coord_x = (this.width / 2) * (d[category] / this.max_value) * this.factor * Math.sin(i*this.radians / this.total);
                let polar_coord_y = (this.height / 2) * (d[category] / this.max_value) * this.factor * Math.cos(i*this.radians / this.total);

                single_coord.push(polar_coord_x);
                single_coord.push(polar_coord_y);
                coords.push(single_coord);
                
                single_coord = [];

                return polar_coord_x
            })
            .attr("cy", (d,i) => {
                let polar_coord = this.height / 2 * (d[category] / this.max_value)*this.factor* Math.cos(i*this.radians/this.total);
                return polar_coord;
              })
            .attr('transform', `translate( ${(this.width/2 + this.margin.left) - this.factor}, ${(this.height/2 + this.margin.top)  - this.factor})`)

        this.node_coords = coords;
        this.createArea(coords, color, category);
    }

    createArea(data, color, category) {
        this.areasWrapper.selectAll('.area')
            .data([data])
            .enter()
            .append('polygon')
            .classed(`${category}-area`, true)
            .style("stroke-width", "2px")
            .attr('points', d => {
                let str = "";
                for(var pti=0;pti<d.length;pti++) {
                    str = str+d[pti][0]+","+d[pti][1]+" ";
                }
                return str;
            })
            .style('fill', color)
            .attr('transform', `translate( ${(this.width/2 + this.margin.left) - this.factor}, ${(this.height/2 + this.margin.top)  - this.factor})`)
    }

    createTitle() {
        this.title.append('text')
            .data(this.data)
            .text(d => {
                return d.location;
            })
            .classed('title', true)
    }

}