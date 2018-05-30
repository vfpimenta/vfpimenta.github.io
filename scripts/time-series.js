var TimeSeries = {
  // ==========================================================================
  // D3 MAIN
  // ==========================================================================

  getDate: function(index) {
  	var month = index % 12 + 4
  	var year = 2009 + Math.trunc(index / 12)
  	return new Date(year, month, 1)
  },

  updateSVG: function(){
  	d3.select("#time-series-svg").selectAll("g").remove()

  	var margin = {top: 5, right: 5, bottom: 20, left: 45};
  	var width = d3.select("#time-series-svg").attr("width") - margin.left - margin.right;
  	var height = d3.select("#time-series-svg").attr("height") - margin.top - margin.bottom;

  	var canvas = d3.select("#time-series-svg").append("g");
  	canvas.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    var color = d3.scaleOrdinal(d3.schemeCategory10);
    Array.from(new Set(window.congressman_ts.map(d=>d.node.group))).sort((a,b)=>a-b).forEach(function(entry) {
      color(entry)
    })

  	// Data parsing
  	if(window.selectedCongressman && window.selectedCongressman.length > 0){
  		var parsedData = window.congressman_ts.filter(function(entry) {
        return window.selectedCongressman.includes(entry.id)
      })
  	} else {
  		var parsedData = window.congressman_ts
  	}

    var expenseDomain = d3.extent([].concat.apply([], parsedData.map(d=>d.expenses)))

  	// Axes plotting
  	var yScale = d3.scaleLinear()
  	.domain(expenseDomain).range([height-margin.top,0]);
  	var xScale = d3.scaleTime()
  	.domain([TimeSeries.getDate(window.sections.start), TimeSeries.getDate(window.sections.end)]).range([0, width])

  	var yAxis = d3.axisLeft(yScale);
  	var xAxis = d3.axisBottom(xScale)

  	var groupY = d3.select("#time-series-svg").append("g")
  	.call(yAxis).attr("transform","translate("+margin.left+","+margin.top+")")
  	var groupX = d3.select("#time-series-svg").append("g")
  	.call(xAxis).attr("transform","translate("+margin.left+","+height+")")

  	// Lines plotting
    canvas.selectAll("g").data(parsedData).enter().append("path")
    .attr("id", d=>d.name.replace(/ /g,'-'))
    .attr("name", d=>d.name)
    .attr("data-marked", "false")
  	.attr("d", function(d){
  		return d.expenses.slice(window.sections.start, window.sections.end).map(function(entry, index){
  			return "L "+xScale(TimeSeries.getDate(index+window.sections.start))+" "+yScale(entry);
  		}).join(" ").replaceAt(0, "M");
  	})
  	.attr("stroke", d=>color(d.node.group))
  	.attr("stroke-width", 1)
  	.attr("stroke-opacity", 0.3)
  	.attr("fill", "none")
  	.on("mouseover", function() {
      if(d3.select(this).attr("data-marked") == "false"){
    		d3.select(this)
    		.attr("stroke-opacity", 1)
    		.attr("stroke-width", 2)
    		.attr("stroke","black")
    		.raise()
      }
  	})
    .on("mouseout", function() {
      if(d3.select(this).attr("data-marked") == "false"){
        d3.select(this)
        .attr("stroke-opacity", 0.3)
        .attr("stroke-width", 1)
        .attr("stroke", d=>color(d.node.group))
      }
    })
    // .on("click", function() {
    //   d3.select(this)
    //   .attr("stroke-opacity", 1)
    //   .attr("stroke-width", 2)
    //   .attr("stroke","red")
    //   .attr("data-marked", "true")
    // })
    .append("title").text(d=>d.name);

    document.getElementById("loader").setAttribute("style", "display: none;")
    document.getElementById("time-series-svg").setAttribute("style", "display: auto;")
  },

  // ==========================================================================
  // INPUT & INTERACTIVITY
  // ==========================================================================

  parseJson: function(raw_data) {
    var path = '../../data/graph-json/'+window.mode+'/'+window.seriesType+'/'+window.distanceMethod+'/k-'+window.k+'/cibm-legislature-'+window.legislature+'.json'
    return d3.json(path).then(function(graph) {
      var parsed = []
      var ids = Object.keys(raw_data)
      for (var i = 0; i < ids.length; i++) {
        idx = ids[i]
        parsed.push({
          id:           idx, 
          name:         raw_data[idx][0],
          state:        raw_data[idx][1],
          party:        raw_data[idx][2],
          legislatures: raw_data[idx][3],
          expenses:     raw_data[idx][4],
          node:         graph.nodes.filter(d=>d.congressman_id==idx)[0]
        })
      }

      var legislature = getCheckedOptions('opt-legislature')
      return d3.json('../../data/congressman_'+legislature+'_outliers.json').then(function(json){
        return parsed.filter(function(entry) {
          return !json.includes(entry.id) && entry.legislatures[legislature-53];
        });
      });
    });
  },

  changeDataset: function() {
  	var checkedRadio = getCheckedOptions('subquota-group')[0]
  	if (checkedRadio == 'NONE') {
  		checkedRadio = ''
  	} else {
      checkedRadio = checkedRadio.toLowerCase().replace(/ /g,'-')+'_'
    }

    if (window.normalize){
      path = 'time-series-json/normalized'
    }else{
      path = 'time-series-json/standard'
    }

  	console.log('Selecting: congressman_'+checkedRadio+'ts.json')
  	d3.json('../../data/'+path+'/congressman_'+checkedRadio+'ts.json').then(function(json) {
  		TimeSeries.parseJson(json).then(function(result) {
        window.congressman_ts = result;

        TimeSeries.updateSVG()
      });
  	});
  },

  changeSelection: function() {
    window.selectedCongressman = getCheckedOptions('congressman-group');

    TimeSeries.updateSVG();
  },

  bounds: function(legislature) {
    switch(legislature){
      case 53:
        return [0,22]
      case 54:
        return [22,70]
      case 55:
        return [70,89]
    }
  },

  changeSection: function(cod) {
    window.sections = {
      start: TimeSeries.bounds(cod)[0],
      end: TimeSeries.bounds(cod)[1]
    }

    TimeSeries.updateSVG()
  },

  normalizeSeries: function() {
    var toNorm = getCheckedOptions('norm')
    if (toNorm.length > 0){
      window.normalize = true
      TimeSeries.changeDataset()
    }else{
      window.normalize = false
      TimeSeries.changeDataset()
    }
  },

  init: function() {
    // Constant definition
    window.normalize = false
    window.sections = {start: 22, end: 70}

  	d3.json('../../data/time-series-json/standard/congressman_ts.json').then(function(json){
  		TimeSeries.parseJson(json).then(function(result) {
        window.congressman_ts = result;

        TimeSeries.updateSVG()
      });
  	});
  }
};

String.prototype.replaceAt=function(index, replacement) {
  return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}