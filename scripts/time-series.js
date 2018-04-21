// ============================================================================
// OPTIONS
// ============================================================================

function buildOptions(dataset, parentFieldset, groupName, type, eventListener){
	var fieldset = document.getElementById(parentFieldset)

	for (var i = 0; i < dataset.length; i++) {
		var checkbox = createNewBox(groupName, dataset[i].id, type)
		addListener(checkbox, 'click', eventListener)

		var span = document.createElement('span')
		span.innerHTML = dataset[i].name

		fieldset.appendChild(checkbox)
		fieldset.appendChild(span)
		fieldset.appendChild(document.createElement('br'))
	}
}

function createNewBox(name, id, type){
    var checkbox = document.createElement('input'); 
    checkbox.type = type;
    checkbox.name = name;
    checkbox.id = id;
    return checkbox;
}

function addListener(element, eventName, handler) {
  if (element.addEventListener) {
    element.addEventListener(eventName, handler, false);
  }
  else if (element.attachEvent) {
    element.attachEvent('on' + eventName, handler);
  }
  else {
    element['on' + eventName] = handler;
  }
}

function getCheckedOptions(groupName) {
	var checked = []
	var congressmanBoxes = document.getElementsByName(groupName)
	for (var i = 0; i < congressmanBoxes.length; i++) {
		if(congressmanBoxes[i].checked){
			checked.push(congressmanBoxes[i].id)
		}
	}

	return checked
}

// ============================================================================
// D3 MAIN
// ============================================================================

function filterIndexes(dataset, filter) {
	filtered = []
	for (var i = 0; i < dataset.length; i++) {
		if(filter.includes(dataset[i].id)){
			filtered.push(dataset[i])
		}
	}

	return filtered
}

function verticalSum(dataset, sections){
	var expenseMatrix = []

	for (var i = 0; i < dataset.length; i++) {
		expenseMatrix.push(dataset[i].expenses.slice(sections.start, sections.end))
	}

	return expenseMatrix.reduce(function(a, b){
		return a.map(function(v,i){
			return v+b[i];
	    });
	});
}

function getDate(index) {
	var month = index % 12 + 4
	var year = 2009 + Math.trunc(index / 12)
	return new Date(year, month, 1)
}

function updateSVG(){
	d3.select("svg").selectAll("g").remove()

	var margin = {top: 5, right: 5, bottom: 20, left: 65};
	var width = d3.select("svg").attr("width") - margin.left - margin.right;
	var height = d3.select("svg").attr("height") - margin.top - margin.bottom;

	var canvas = d3.select("svg").append("g");
	canvas.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

	// Data parsing
	if(window.selectedCongressman && window.selectedCongressman.length > 0){
		var parsedData = verticalSum(filterIndexes(this.congressman_ts, window.selectedCongressman), window.sections)
	} else {
		var parsedData = verticalSum(this.congressman_ts, window.sections)
	}

	// Axes plotting
	var yScale = d3.scaleLinear()
	.domain(d3.extent(parsedData)).range([height-5,0]);
	var xScale = d3.scaleTime()
	.domain([getDate(window.sections.start), getDate(window.sections.end)]).range([0, width])

	var yAxis = d3.axisLeft(yScale);
	var xAxis = d3.axisBottom(xScale)

	var groupY = d3.select("svg").append("g")
	.call(yAxis).attr("transform","translate("+margin.left+","+margin.top+")")
	var groupX = d3.select("svg").append("g")
	.call(xAxis).attr("transform","translate("+margin.left+","+height+")")

	// Lines plotting
	canvas.selectAll("g").data(parsedData).enter().append("line")
	.attr("x1", (d,i)=>xScale(getDate(i+window.sections.start)))
	.attr("x2", function(d, i){
    index = i + window.sections.start
	  if (parsedData[i+1]){
	    return xScale(getDate(index+1))
	  } else {
	    return xScale(getDate(index))
	  }
	})
	.attr("y1", d=>yScale(d))
	.attr("y2", function(d, i){
	  if (parsedData[i+1]){
	    return yScale(parsedData[i+1])
	  } else {
	    return yScale(d)
	  }
	})
	.attr("stroke","black").attr("stroke-width",2)

	// Crosshair
	var transpRect = canvas.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "white")
    .attr("opacity", 0);

    var verticalLine = canvas.append("line")
    .attr("opacity", 0)
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("pointer-events", "none")
    .style("stroke-dasharray", ("3, 3"));

	var horizontalLine = canvas.append("line")
    .attr("opacity", 0)
    .attr("x1", 0)
    .attr("x2", width)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("pointer-events", "none")
    .style("stroke-dasharray", ("3, 3"));

    transpRect.on("mousemove", function(){  
	    mouse = d3.mouse(this);
	    mousex = mouse[0];
	    mousey = mouse[1];
	    verticalLine.attr("x1", mousex).attr("x2", mousex).attr("opacity", 1);
	    horizontalLine.attr("y1", mousey).attr("y2", mousey).attr("opacity", 1)
	}).on("mouseout", function(){  
	    verticalLine.attr("opacity", 0);
	    horizontalLine.attr("opacity", 0);
	});
}

// ============================================================================
// INPUT & INTERACTIVITY
// ============================================================================

function parseJson(raw_data) {
	var parsed = []
	var ids = Object.keys(raw_data)
	for (var i = 0; i < ids.length; i++) {
		idx = ids[i]
		parsed.push({
			id: 			idx, 
			name: 			raw_data[idx][0],
			state: 			raw_data[idx][1],
			party:			raw_data[idx][2],
			legislatures:	raw_data[idx][3],
			expenses:		raw_data[idx][4]
		})
	}
	return parsed
}

function parseCsv(raw_data) {
	var parsed = []
	for (var i = 0; i < raw_data.length; i++) {
		parsed.push({
			id: 	raw_data[i].Subquota.toLowerCase().replace(/ /g,'-')+'_', 
			name: 	raw_data[i].Subquota
		})
	}
	return parsed
}

function changeDataset() {
	var checkedRadio = getCheckedOptions('subquota-group')[0]
	if (checkedRadio == 'NONE') {
		checkedRadio = ''
	}

  if (window.normalize){
    path = 'normalized-json'
  }else{
    path = 'standard-json'
  }

	console.log('Selecting: congressman_'+checkedRadio+'ts.json')
	var jsonPromise = d3.json('../../data/'+path+'/congressman_'+checkedRadio+'ts.json')
	jsonPromise.then(function(jresult) {
		this.congressman_ts = parseJson(jresult)
		updateSVG()
	})
}

function changeSelection() {
  var selectedCongressman = getCheckedOptions('congressman-group')
  selectedCongressman.forEach(function(entry, idx){if (entry == ""){selectedCongressman.splice(idx)}})

  window.selectedCongressman = selectedCongressman
  updateSVG()
}

function bounds(legislature) {
  switch(legislature){
    case "53":
      return [0,22]
    case "54":
      return [22,70]
    case "55":
      return [70,89]
  }
}

function changeSection() {
  var sections = getCheckedOptions('legislature')

  var first = sections[0]
  var last = sections[sections.length-1]
  window.sections = {
    start: bounds(first)[0],
    end: bounds(last)[1]
  }

  updateSVG()
}

function normalizeSeries() {
  var toNorm = getCheckedOptions('norm')
  if (toNorm.length > 0){
    window.normalize = true
    changeDataset()
  }else{
    window.normalize = false
    changeDataset()
  }
}

// ============================================================================
// ON LOAD
// ============================================================================

window.onload = function() {
  window.normalize = false
  window.sections = {start: 0, end: 89}

	var jsonPromise = d3.json('../../data/standard-json/congressman_ts.json')
	jsonPromise.then(function(jresult){
		this.congressman_ts = parseJson(jresult)

		var csvPromisse = d3.csv('../../data/subquota.csv')
		csvPromisse.then(function(cresult) {
			this.subquota = parseCsv(cresult)

			buildOptions(this.subquota, 'subquota-fieldset', 'subquota-group', 'radio', changeDataset)

			buildOptions(this.congressman_ts, 'congressman-fieldset', 'congressman-group', 'checkbox', changeSelection)

			updateSVG()	
		})
	})
};