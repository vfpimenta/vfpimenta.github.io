var TimeSeries = {
  // ==========================================================================
  // OPTIONS
  // ==========================================================================

  buildOptions: function(dataset, parentFieldset, groupName, type, eventListener){
  	var fieldset = document.getElementById(parentFieldset)

    dataset = dataset.sort(function(argA, argB) {
      if (argA.name > argB.name) {
        return 1;
      }else if (argA.name < argB.name) {
        return -1;
      }else{
        return 0;
      }
    })

  	for (var i = 0; i < dataset.length; i++) {
  		var checkbox = TimeSeries.createNewBox(groupName, dataset[i].id, type)
  		TimeSeries.addListener(checkbox, 'click', eventListener)

  		var span = document.createElement('span')
  		span.innerHTML = dataset[i].name

  		fieldset.appendChild(checkbox)
  		fieldset.appendChild(span)
  		fieldset.appendChild(document.createElement('br'))
  	}
  },

  createNewBox: function(name, id, type){
      var checkbox = document.createElement('input'); 
      checkbox.type = type;
      checkbox.name = name;
      checkbox.id = id;
      return checkbox;
  },

  addListener: function(element, eventName, handler) {
    if (element.addEventListener) {
      element.addEventListener(eventName, handler, false);
    }
    else if (element.attachEvent) {
      element.attachEvent('on' + eventName, handler);
    }
    else {
      element['on' + eventName] = handler;
    }
  },

  getCheckedOptions: function(groupName) {
  	var checked = []
  	var congressmanBoxes = document.getElementsByName(groupName)
  	for (var i = 0; i < congressmanBoxes.length; i++) {
  		if(congressmanBoxes[i].checked){
  			checked.push(congressmanBoxes[i].id)
  		}
  	}

  	return checked
  },

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
  	.attr("stroke", "blue")
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
        .attr("stroke","blue")
      }
    })
    .on("click", function() {
      d3.select(this)
      .attr("stroke-opacity", 1)
      .attr("stroke-width", 2)
      .attr("stroke","red")
      .attr("data-marked", "true")

      console.log(d3.select(this).attr("name"))
    })
    .append("title").text(d=>d.name);
    
    document.getElementById("loader").setAttribute("style", "display: none;")
    document.getElementById("time-series-svg").setAttribute("style", "display: auto;")
  },

  // ==========================================================================
  // INPUT & INTERACTIVITY
  // ==========================================================================

  parseJson: function(raw_data) {
  	var parsed = []
  	var ids = Object.keys(raw_data)
  	for (var i = 0; i < ids.length; i++) {
  		idx = ids[i]
  		parsed.push({
  			id: 			    idx, 
  			name: 			  raw_data[idx][0],
  			state: 			  raw_data[idx][1],
  			party:			  raw_data[idx][2],
  			legislatures:	raw_data[idx][3],
  			expenses:		  raw_data[idx][4]
  		})
  	}
  	return parsed
  },

  parseCsv: function(raw_data) {
  	var parsed = []
  	for (var i = 0; i < raw_data.length; i++) {
  		parsed.push({
  			id: 	raw_data[i].Subquota.toLowerCase().replace(/ /g,'-')+'_', 
  			name: 	raw_data[i].Subquota
  		})
  	}
  	return parsed
  },

  changeDataset: function() {
  	var checkedRadio = TimeSeries.getCheckedOptions('subquota-group')[0]
  	if (checkedRadio == 'NONE') {
  		checkedRadio = ''
  	}

    if (window.normalize){
      path = 'time-series-json/normalized'
    }else{
      path = 'time-series-json/standard'
    }

  	console.log('Selecting: congressman_'+checkedRadio+'ts.json')
  	var jsonPromise = d3.json('../../data/'+path+'/congressman_'+checkedRadio+'ts.json')
  	jsonPromise.then(function(jresult) {
  		window.congressman_ts = TimeSeries.parseJson(jresult)
  		TimeSeries.updateSVG()
  	})
  },

  changeSelection: function() {
    window.selectedCongressman = TimeSeries.getCheckedOptions('congressman-group');

    TimeSeries.updateSVG();
  },

  bounds: function(legislature) {
    switch(legislature){
      case "53":
        return [0,22]
      case "54":
        return [22,70]
      case "55":
        return [70,89]
    }
  },

  changeSection: function() {
    var sections = TimeSeries.getCheckedOptions('legislature')

    var first = sections[0]
    var last = sections[sections.length-1]
    window.sections = {
      start: TimeSeries.bounds(first)[0],
      end: TimeSeries.bounds(last)[1]
    }

    TimeSeries.updateSVG()
  },

  normalizeSeries: function() {
    var toNorm = TimeSeries.getCheckedOptions('norm')
    if (toNorm.length > 0){
      window.normalize = true
      TimeSeries.changeDataset()
    }else{
      window.normalize = false
      TimeSeries.changeDataset()
    }
  },

  // ==========================================================================
  // ON LOAD
  // ==========================================================================

  main: function() {
    console.log('started ts script')

    window.normalize = false
    window.sections = {start: 0, end: 89}

  	var jsonPromise = d3.json('../../data/time-series-json/standard/congressman_ts.json')
  	jsonPromise.then(function(jresult){
  		window.congressman_ts = TimeSeries.parseJson(jresult)

  		var csvPromisse = d3.csv('../../data/subquota.csv')
  		csvPromisse.then(function(cresult) {
  			this.subquota = TimeSeries.parseCsv(cresult)

  			TimeSeries.buildOptions(this.subquota, 'subquota-fieldset', 'subquota-group', 'radio', TimeSeries.changeDataset)

  			TimeSeries.buildOptions(window.congressman_ts, 'congressman-fieldset', 'congressman-group', 'checkbox', TimeSeries.changeSelection)

  			TimeSeries.updateSVG()	
  		})
  	})
  }
};

String.prototype.replaceAt=function(index, replacement) {
  return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}