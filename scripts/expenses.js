// ==========================================================================
// D3 MAIN
// ==========================================================================

function getDate(index) {
  var month = index % 12 + 3
  var year = 2009 + Math.trunc(index / 12)
  return new Date(year, month, 1)
};

function updateSVG(parsedData, sections){
  var svg = d3.select("#expense-svg")
  svg.selectAll("g").remove()

  var margin = {top: 5, right: 70, bottom: 20, left: 65};
  var width = svg.attr("width") - margin.left - margin.right;
  var height = svg.attr("height") - margin.top - margin.bottom;
  var canvas = svg.append("g");
  canvas.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  // Custom color palette
  var color = d3.scaleOrdinal().domain(["PE", "DF", "CE", "PI", "RJ", "SP", "PR", "SC", "RS", "ES", "MG", "MT", "GO", "BA", "PA", "AC", "RN", "PB", "AL", "SE", "AM", "MS", "MA", "RO", "RR", "AP", "TO"]).range(["#cdc0eb", "#00b205", "#9219c7", "#70de57", "#ff4beb", "#02be75", "#015af3", "#c2cf40", "#828aff", "#bbad00", "#016896", "#f26300", "#00c3db", "#d30026", "#a4d47d", "#ff77b9", "#507e00", "#ffa6c4", "#226a39", "#a8304a", "#a1cfcc", "#bb8300", "#ff9380", "#74591b", "#ffb548", "#e3c18b"]);

  var condensedData = parsedData.reduce(function(a, b){
    return b.expenses.map(function(v, i){
      var tmpState = {}
      var tmpRaw = 0
      if (a.length == 0) {
        tmpState[b.state] = v
      } else {
        tmpState = a[i].states
        tmpState[b.state] = (tmpState[b.state] || 0) + v
        tmpRaw = a[i].raw 
      }
      return {
        raw: tmpRaw + v,
        states: tmpState
      }
    });
  }, []);

  var expenseDomain = [0, d3.extent(condensedData.map(d=>d.raw))[1]]
  var dateDomain = d3.range(sections.start, sections.end).map(d=>getDate(d))

  // Axes plotting
  var xScaleData = d3.scaleBand()
  .domain(dateDomain).range([0, width])
  .paddingInner(0.05).align(0.1);
  var xScaleAxis = d3.scaleTime()
  .domain([getDate(sections.start), getDate(sections.end)]).range([0, width])
  var yScale = d3.scaleLinear()
  .domain(expenseDomain).range([height, 0]);

  var yAxis = d3.axisLeft(yScale);
  var xAxis = d3.axisBottom(xScaleAxis)

  var groupY = d3.select("#expense-svg").append("g")
  .call(yAxis).attr("transform","translate("+margin.left+","+margin.top+")")
  var groupX = d3.select("#expense-svg").append("g")
  .call(xAxis).attr("transform","translate("+margin.left+","+height+")")

  // Bar plotting
  canvas.selectAll("g")
  .data(condensedData.slice(sections.start, sections.end))
  .enter().append("g")
  .attr("x",(d,i)=>xScaleData(getDate(i+sections.start)))
  .selectAll("rect").data(function(d){
    return Object.keys(d.states).sort().map(function(v, i) {
      if(i > 0){
        return {current: d.states[v], sumPrevious: Object.keys(d.states).sort().map(u=>d.states[u]).slice(0,i).reduce((a,b)=>a+b), state: v}
      } else {
        return {current: d.states[v], sumPrevious: 0, state: v}
      }
    })
  }).enter().append("rect")
  .attr("y", function(d) {
    return yScale(d.current+d.sumPrevious)-margin.top
  })
  .attr("height", function(d) {
    return height-yScale(d.current)
  })
  .attr("width", xScaleData.bandwidth())
  .attr("fill", d=>color(d.state))
  .attr("x", function(d){return d3.select(this.parentNode).attr("x")})

  // Legend plotting
  var legend = svg.append("g")
  .attr("font-family", "sans-serif")
  .attr("font-size", 10)
  .attr("text-anchor", "end")
  .selectAll("g")
  .data(Object.keys(condensedData[sections.start].states).sort().reverse()).enter().append("g")
  .attr("transform", function(d, i) {
    return "translate(0,"+i*11+")";
  })

  legend.append("rect")
  .attr("x", +svg.attr("width")-11)
  .attr("width", 10)
  .attr("height", 10)
  .attr("fill", d=>color(d))

  legend.append("text")
  .attr("x", +svg.attr("width")-21)
  .attr("y", 4.5)
  .attr("dy", "0.32em")
  .text(d=>d)
};

function parseJson(raw_data) {
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
      expenses:     raw_data[idx][4]
    })
  }

  var legislature = getCheckedOptions('opt-legislature')
  return d3.json('../../data/congressman_'+legislature+'_outliers.json').then(function(json){
    return parsed.filter(function(entry) {
      return !json.includes(entry.id) && entry.legislatures[legislature-53];
    });
  });
};

function getCheckedOptions(groupName) {
  var checked = []
  var congressmanBoxes = document.getElementsByName(groupName)
  for (var i = 0; i < congressmanBoxes.length; i++) {
    if(congressmanBoxes[i].checked){
      checked.push(congressmanBoxes[i].id)
    }
  }

  return checked
};

window.onload = function() {
  d3.json('../../data/time-series-json/standard/congressman_ts.json').then(function(json){
    parseJson(json).then(function(result) {
      var sections = {start: 22, end: 70}
      updateSVG(result, sections);
    });
  });
};