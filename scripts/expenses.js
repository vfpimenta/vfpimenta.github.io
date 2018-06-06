// ==========================================================================
// D3 MAIN
// ==========================================================================

function getDate(index) {
  var month = index % 12 + 4
  var year = 2009 + Math.trunc(index / 12)
  return new Date(year, month, 1)
};

function updateSVG(parsedData, sections){
  d3.select("#expense-svg").selectAll("g").remove()

  var svg = d3.select("#expense-svg")
  var margin = {top: 5, right: 5, bottom: 20, left: 65};
  var width = d3.select("#expense-svg").attr("width") - margin.left - margin.right;
  var height = d3.select("#expense-svg").attr("height") - margin.top - margin.bottom;
  var canvas = d3.select("#expense-svg").append("g");
  canvas.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var condensedData = parsedData.map(d=>d.expenses).reduce(function(a, b){return a.map(function(v,i){return v+b[i];});});

  var expenseDomain = d3.extent(condensedData)
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
  //.tickValues(xScale.domain().filter(function(d,i){ return !(i%5)}))
  //.tickFormat(d3.timeFormat("%Y-%m-%d"));

  var groupY = d3.select("#expense-svg").append("g")
  .call(yAxis).attr("transform","translate("+margin.left+","+margin.top+")")
  var groupX = d3.select("#expense-svg").append("g")
  .call(xAxis).attr("transform","translate("+margin.left+","+height+")")

  // Bar plotting
  canvas
  .selectAll("g").data(condensedData.slice(sections.start, sections.end)).enter().append("rect")
  .attr("x",(d,i)=>xScaleData(getDate(i+sections.start)))
  .attr("y", d=>yScale(d))
  .attr("height",d=>height-yScale(d))
  .attr("width",xScaleData.bandwidth())
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