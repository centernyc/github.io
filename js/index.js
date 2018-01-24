var Chart = (function(window,d3) {

	var data, datanest;
	var x, y, r, xAxis, yAxis, width, height, margin = {}, xLabel, yLabel, yLabelText;
	var svg, chartWrapper, school, node, path, line;

	var levels = [
		{
			start: 1.8,
			end: 2.8,
			label: "Below grade level"
		},
		{
			start: 3,
			end: 3.8,
			label: "At grade level"
		},
		{
			start: 4,
			end: 4.2,
			label: "Above grade level"
		},
	];

	var filterKey = [
		{
			id: '#filter-gifted',
			label: 'Gifted only'
		},
		{
			id: '#filter-charter',
			label: 'Charter only'
		},
		{
			id: '#filter-duallang',
			label: 'Dual language only'
		},
		{
			id: '#filter-zoned',
			label: 'Zoned only'
		},
		{
			id: '#filter-unzoned',
			label: 'Unzoned only'
		}
	];

	var colors = {
			'Black': '#33946D',
			'White': '#DA764C',
			'Hispanic': '#DAD64C',
			'Asian': '#99358A',
			'Other': '#7C7B63',
			'Default': '#7C7B63'
	}

	d3.json('js/datatest.json', init); //load data, then initialize chart

	// Initialize the chart for the first time
	function init(json) {
		// Main data manipulations
		data = json['nodes'];
		datanest = d3.nest()
				.key(d => d.dbn)
				.key(d => d.medincome).sortKeys(d3.ascending)
				.entries(data);

		var typeaheadData = d3.nest()
				.key(d => d.name)
				.rollup(function(leaves) { return leaves[0].dbn; })
				.entries(data);

		// Filters objects to keep track of what should be filtered out
		var filters = {
			charter: {key: 'charter', value: undefined},
			gifted: {key: 'gifted', value: undefined},
			duallang: {key: 'duallang', value: undefined},
			zoned: {key: 'unzoned', value: undefined},
			unzoned: {key: 'unzoned', value: undefined},
			districtid: {key: 'districtid', value: undefined},
			dbn: {key: 'dbn', value: undefined}
		}

		// Filter function for binary and district filters
		function filter() {
			svg.selectAll('.school')
					.attr('opacity', function(d) { return filterOut(d) ? 0 : 1})
					.style('pointer-events', function(d) { return filterOut(d) ? 'none' : 'all'});
			function filterOut(d) {
				var filterOut = false;
				for (var key in filters) {
					if (typeof(filters[key].value) != 'undefined' && d.values[0].values[0][filters[key].key] != filters[key].value) {
						filterOut = true;
					}
				}
				return filterOut;
			}
		}

		//initialize scales
		var xExtent = d3.extent(data, d => d.medincome);
		var yExtent = d3.extent(data, d => d.mathrating);
		x = d3.scaleLog()
				.base(10)
				.domain(xExtent);
		y = d3.scaleLinear().domain(yExtent);
		r = d3.scaleLinear()
				.domain(d3.extent(data, d => d.n))
				.range(['0.4vw', '3.5vw']);

		//initialize axis
		xAxis = d3.axisBottom()
			.tickValues([xExtent[0], 20000, 30000, 40000, 50000, 60000, 70000, 80000, 100000, 125000, 150000, xExtent[1]])
			.tickFormat(function(d) {
				return "$" + d3.format(".2s")(d);
			});
		yAxis = d3.axisLeft()
			.ticks(3);

		line = d3.line()
				.x(d => x(d.values[0].medincome))
				.y(d => y(d.values[0].mathrating));

		// initialize svg
		svg = d3.select('#chart').append('svg');
		chartWrapper = svg.append('g');

		// initialize school groups
		school = chartWrapper.selectAll('.school')
				.data(datanest).enter()
			.append('g')
				.attr('class', 'school')

		// initialize demographic nodes
		node = chartWrapper.selectAll('.school').selectAll('.node')
				.data(d => d.values).enter()
			.append('circle')
				.attr('class', 'node');

		// define school paths
		path = chartWrapper.selectAll('.school')
			.append('path')
				.datum(d => d.values);

		// Axes and labels
		chartWrapper.append('g').classed('x axis', true);
		chartWrapper.append('g').classed('y axis', true);

		xLabel = svg.select('.x.axis')
			.append('text')
				.text("Estimated income based on students' census tracks");

		yLabel = svg.select('.y.axis').selectAll('.ylabel')
				.data(levels).enter()
			.append('g')

		yLabelText = yLabel.append('text')
			.attr('x', 0)
			.attr('y', -30)
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.text(function(d) { return d.label; });

		// On/off filters
		filterKey.forEach(function(f) {
			noYesBtns(f.id, f.label)
					.on('_click', function() {
						var onValue = f.id == '#filter-zoned' ? 0 : 1;
						filters[f.id.replace('#filter-', '')].value = this.firstChild.data == 'on' ? onValue : undefined;
						filter();
					})
					.render();
		});

		// District filter
		var districtExtent = d3.extent(data, function(d) {
			return d.districtid;
		});
		for (var i = districtExtent[0]; i < districtExtent[1] + 1; i++) {
			d3.select('#select-district').append('option').html(i).attr('value', i);
		}

		d3.select('#select-district').on('change', function() {
			filters.districtid.value = this.value == 'all' ? undefined : this.value;
			filter();
		});

		// Typeahead school search
		$('#school-search .typeahead').typeahead({
		  hint: true,
		  highlight: true,
		  minLength: 1
		},
		{
		  name: 'schools',
		  source: substringMatcher(typeaheadData)
		}).on("input", function(e) {
			var val = e.target.value;
			if (val == '') {
				filters.dbn.value = undefined;
				filter();
			}
		});

		$('.typeahead').on('typeahead:selected', function(evt, item) {
			var result = typeaheadData.filter(function( obj ) {
				return obj.key == item;
			});
			filters.dbn.value = result[0].value;
			filter();
		});

		$('#school-search .close').on('click', function(e) {
			$('.typeahead').typeahead('val', '');
			filters.dbn.value = undefined;
			filter();
		});

		//render the chart
		render();
	}

	// Determine the right dimensions for the chart
	// depending on current window size
	function updateDimensions(winWidth) {
		margin.top = 20;
		margin.right = 50;
		margin.left = 80;
		margin.bottom = 50;

		width = winWidth - margin.left - margin.right;
		height = width * 0.52 - margin.top - margin.bottom;
	}

	// Draw the chart and all the SVG elements
	// This can run again when the page is resized, e.g.
	function render() {
		//get dimensions based on window size
		updateDimensions(window.innerWidth);

		//update x and y scales to new dimensions
		x.range([0, width]);
		y.range([height, 0]);

		//update svg elements to new dimensions
		svg
				.attr('width', width + margin.right + margin.left)
				.attr('height', height + margin.top + margin.bottom);
		chartWrapper.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

		//update the axes
		xAxis.scale(x);
		yAxis.scale(y);

		svg.select('.x.axis')
				.attr('transform', 'translate(0,' + height + ')')
				.call(xAxis);

		xLabel
				.attr('x', width / 2)
				.attr('y', 40)

		svg.select('.y.axis')
				.call(yAxis);

		yLabel.attr('transform', function(d) {
			return 'translate(0,' + y((d.end + d.start) / 2) + ')';
		});

		// Set path's path
		path
				.attr('d', d => line(d));

		// Set node positions, radii, and colors
		node
				.attr('r', d => r(d.values[0].n))
				.attr('cx', d => x(d.values[0].medincome))
				.attr('cy', d => y(d.values[0].mathrating))
				.style('fill', d => colors[d.values[0].eth]);

		d3.selection.prototype.moveToFront = function() {
			return this.each(function(){
				this.parentNode.appendChild(this);
			});
		}

		node.on('mouseover', function(d) {
				var $parent = d3.select(this.parentNode);
				$parent.classed('hover', true).moveToFront();
				var gWidth = this.parentNode.getBoundingClientRect().width;
				var left = $(this.parentNode).position().left;
				if ((left + gWidth + 330) > (width + margin.right + margin.left)) {
					left = left - 330;
				} else {
					left = left + gWidth + 30;
				}

				var top = $(this.parentNode).position().top;
				var info = d3.select('#information');
				var demo = d.values[0];
				var name = demo.name;
				var dbn = demo.dbn;
				var elemadmissions = demo.elemadmissions;

				var mathhtml = '<div>';
				$parent.datum().values.forEach(function(d) {
					mathhtml = mathhtml + '<div><span>' + d.values[0].eth + ': </span>'
						+ '<span>' + d.values[0].mathrating + '</span></div>'
				})
				mathhtml = mathhtml + '</div>'

				info.select('.name').html(name);
				info.select('#info-dbn').html(dbn);
				info.select('#info-elemadmissions').html(elemadmissions);
				info.select('#info-mathrating').html(mathhtml);
				d3.select('#information')
					.style("left", left + "px")
					.style("top", top + "px")
					.style('display', 'block');
			}).on('mouseout', function() {
				d3.select(this.parentNode).classed('hover', false);
				d3.select('#information')
					.style('display', 'none');
			});

		d3.selection.prototype.moveToBack = function() {
			this.each(function() {
				this.parentNode.firstChild
				&& this.parentNode.insertBefore(this, firstChild);
			});
		};

	} // render

	return {
		render : render
	}

})(window,d3);

window.addEventListener('resize', Chart.render);
