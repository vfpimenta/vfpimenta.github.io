var TimeSeries = {
  // ==========================================================================
  // D3 MAIN
  // ==========================================================================

  getDate: function(index) {
    var month = index % 12 + 3
    var year = 2009 + Math.trunc(index / 12)
    return new Date(year, month, 1)
  },

  updateSVG: function(){
    var svg = d3.select("#time-series-svg")
    svg.selectAll("g").remove()

    var margin = {top: 5, right: 5, bottom: 20, left: 45};
    var width = svg.attr("width") - margin.left - margin.right;
    var height = svg.attr("height") - margin.top - margin.bottom;
    var strokeWidth = 1
    var strokeOpacity = 0.3
    var strokeWidthHighlight = 2
    var strokeOpacityHighlight = 1.0

    var canvas = svg.append("g");
    canvas.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    var color = d3.scaleOrdinal(d3.schemeCategory10);
    Array.from(new Set(this.congressmanTimeSeries.map(d=>d.node.group))).sort((a,b)=>a-b).forEach(function(entry) {
      color(entry)
    })

    // Data parsing
    if(this.selectedOptions && this.selectedOptions.length > 0){
      var parsedData = this.congressmanTimeSeries.filter(function(entry) {
        return TimeSeries.selectedOptions.includes(entry[TimeSeries.selectedAttribute])
      })
      var doAvg = false
    } else {
      var parsedData = this.congressmanTimeSeries
      var doAvg = true
    }

    // Average groups
    if (doAvg) {
      var averagedData = []
       Array.from(new Set(this.congressmanTimeSeries.map(d=>d.node.group))).forEach(function(entry) {
        var groupData = parsedData.filter(v=>v.node.group==entry)
        var len = groupData.length
        var sum = groupData.reduce(function(a, b) {
          var acc = a.length > 0 ? a : new Array(89).fill(0);
          return acc.map((v,i)=>v+b.expenses[i])
        }, [])
        var avgs = sum.map(d=>d/len)
        var stds = groupData.reduce(function(a, b) {
          var acc = a.length > 0 ? a : new Array(89).fill(0);
          return acc.map(function (v, i){
            return v + Math.pow(b.expenses[i]-avgs[i], 2)
          })
        }, []).map(d=>Math.sqrt(d/len))

        averagedData.push({
          expenses: avgs,
          errors: stds,
          node: {group: entry},
          name: "avg-"+entry
        })
      })

      parsedData = averagedData
      strokeWidth = 3
      strokeWidthHighlight = 4
      strokeOpacity = 0.9
      strokeOpacityHighlight = 1.0
    }

    var expenseDomain = d3.extent([].concat.apply([], parsedData.map(d=>d.expenses)))

    // Axes plotting
    var yScale = d3.scaleLinear()
    .domain(expenseDomain).range([height-margin.top,0]);
    var xScale = d3.scaleTime()
    .domain([TimeSeries.getDate(this.sections.start), TimeSeries.getDate(this.sections.end)]).range([0, width])

    var yAxis = d3.axisLeft(yScale);
    var xAxis = d3.axisBottom(xScale)

    var groupY = svg.append("g")
    .call(yAxis).attr("transform","translate("+margin.left+","+margin.top+")")
    var groupX = svg.append("g")
    .call(xAxis).attr("transform","translate("+margin.left+","+height+")")

    // Lines plotting
    canvas.selectAll("g").data(parsedData).enter().append("path")
    .attr("id", d=>d.name.replace(/ /g,'-'))
    .attr("name", d=>d.name)
    .attr("data-marked", "false")
    .attr("d", function(d){
      return d.expenses.slice(TimeSeries.sections.start, TimeSeries.sections.end).map(function(entry, index){
        return "L "+xScale(TimeSeries.getDate(index+TimeSeries.sections.start))+" "+yScale(entry);
      }).join(" ").replaceAt(0, "M");
    })
    .attr("stroke", d=>color(d.node.group))
    .attr("stroke-width", strokeWidth)
    .attr("stroke-opacity", strokeOpacity)
    .attr("fill", "none")
    .on("mouseover", function() {
      if(d3.select(this).attr("data-marked") == "false"){
        d3.select(this)
        .attr("stroke-opacity", strokeOpacityHighlight)
        .attr("stroke-width", strokeWidthHighlight)
        .attr("stroke","black")
        .raise()
      }
    })
    .on("mouseout", function() {
      if(d3.select(this).attr("data-marked") == "false"){
        d3.select(this)
        .attr("stroke-opacity",strokeOpacity)
        .attr("stroke-width", strokeWidth)
        .attr("stroke", d=>color(d.node.group))
      }
    })
    /*.on("click", function() {
      d3.select(this)
      .attr("stroke-opacity", 1)
      .attr("stroke-width", 2)
      .attr("stroke","red")
      .attr("data-marked", "true")
    })*/
    .append("title").text(d=>d.name);

    // Error lines
    if(doAvg){
      canvas.append("g").selectAll("g").data(parsedData).enter().append("g").each(function(d){
        d3.select(this).selectAll("g").data(function(d){
          return d.expenses.slice(TimeSeries.sections.start, TimeSeries.sections.end).map(function (v,i){
            return {
              val: v, 
              err: d.errors[i], 
              group: d.node.group
            }
          })
        }).enter().append("line")
        .attr("x1",function(d, i){
          return xScale(TimeSeries.getDate(i+TimeSeries.sections.start))
        })
        .attr("x2",function(d, i){
          return xScale(TimeSeries.getDate(i+TimeSeries.sections.start))
        })
        .attr("y1",d=>yScale(d.val+d.err/2))
        .attr("y2",d=>yScale(d.val-d.err/2))
        .attr("stroke", d=>color(d.group))
        .attr("stroke-width", 1)
      })
    }

    document.getElementById("loader").setAttribute("style", "display: none;")
    document.getElementById("time-series-svg").setAttribute("style", "display: auto;")
  },

  // ==========================================================================
  // INPUT & INTERACTIVITY
  // ==========================================================================

  parseJson: function(rawData) {
    var path = '../../data/graph-json/'+Graph.mode+'/'+Graph.seriesType+'/'+Graph.distanceMethod+'/k-'+Graph.k+'/cibm-legislature-'+Graph.legislature+'.json'
    return d3.json(path).then(function(graph) {
      var parsed = []
      var ids = Object.keys(rawData)
      for (var i = 0; i < ids.length; i++) {
        idx = ids[i]
        parsed.push({
          id:           idx, 
          name:         rawData[idx][0],
          state:        rawData[idx][1],
          party:        rawData[idx][2],
          legislatures: rawData[idx][3],
          expenses:     rawData[idx][4],
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

    if (this.normalize){
      path = 'time-series-json/normalized'
    }else{
      path = 'time-series-json/standard'
    }

    console.log('Selecting: congressman_'+checkedRadio+'ts.json')
    d3.json('../../data/'+path+'/congressman_'+checkedRadio+'ts.json').then(function(json) {
      TimeSeries.parseJson(json).then(function(result) {
        TimeSeries.congressmanTimeSeries = result;

        TimeSeries.updateSVG()
      });
    });
  },

  changeSelection: function(groupName, attribute) {
    this.selectedOptions = getCheckedOptions(groupName);
    this.selectedAttribute = attribute;

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
    this.sections = {
      start: TimeSeries.bounds(cod)[0],
      end: TimeSeries.bounds(cod)[1]
    }

    TimeSeries.updateSVG()
  },

  normalizeSeries: function() {
    var toNorm = getCheckedOptions('norm')
    if (toNorm.length > 0){
      this.normalize = true
      TimeSeries.changeDataset()
    }else{
      this.normalize = false
      TimeSeries.changeDataset()
    }
  },

  init: function() {
    // Constant definition
    this.normalize = false
    this.sections = {start: 22, end: 70}

    d3.json('../../data/time-series-json/standard/congressman_ts.json').then(function(json){
      TimeSeries.parseJson(json).then(function(result) {
        TimeSeries.congressmanTimeSeries = result;

        TimeSeries.updateSVG()
      });
    });
  }
};

String.prototype.replaceAt = function(index, replacement) {
  return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}