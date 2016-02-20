var test = 3;
console.log(test);

var keyData = new Object();
keyData.keyCode = 0;
keyData.eventType = "";
keyData.timeStamp = 0;
keyData = function(code,type,time){
  this.keyCode = code;
  this.eventType = type;
  this.timeStamp = time;
};

var plotDataCollection = new Mongo.Collection("PlotData")
var data = [{year: 2006, books: 54},
  {year: 2007, books: 43},
  {year: 2008, books: 41},
  {year: 2009, books: 44},
  {year: 2010, books: 35}];

var typingData = new Array();

//Data from responsive_histogram_dual
var dwell_times = [];
var press_times = {};
var dwell_times2 = [];
var press_times2 = {};

TypingDatabase1 = new Mongo.Collection('TypingDatabase1');
TypingDatabase2 = new Mongo.Collection('TypingDatabase2');
Results = new Mongo.Collection('Results');
Tasks = new Mongo.Collection('Tasks');

function init_histogram(){
  $("#histogramSVG").empty()
  var svg = d3.select("#histogramSVG");
  var width = svg.node().getBoundingClientRect().width;
  var height = svg.node().getBoundingClientRect().height/2;
  var histogram = d3.layout.histogram().bins(12).range([30,150])([]);

  var x = d3.scale.ordinal()
      .domain(histogram.map(function(d) { return d.x; }))
      .rangeRoundBands([0, width]);
   
  var y = d3.scale.linear()
      .domain([0, d3.max(histogram.map(function(d) { return d.y; }))])
      .range([0, height]);

  var xAxis = d3.svg.axis()
        .scale(x)
        .tickFormat(d3.format(",.0f"))
        .orient("bottom")
        .tickSize([5]).tickSubdivide(true);

  var yAxis = d3.svg.axis()
      .scale(y)
      .tickFormat(d3.format(",.0f"))
      .orient("left")
      .tickSubdivide(true);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (height)  + ")")
      .call(xAxis);
}

function draw_histogram(pos_data, neg_data){

  //Clear the histogram so it updates correctly each time data is added
  $("#histogramSVG").empty()

  var svg = d3.select("#histogramSVG");
  var width = svg.node().getBoundingClientRect().width;
  var height = svg.node().getBoundingClientRect().height/2;

  //var width = 400;
  //var height = 150;  // We don't want the height to be responsive.
  var midPadding = 20; //padding between upper and lower histogram bars

  var histogram = d3.layout.histogram().bins(12).range([30,150])(pos_data);
  var neg_histogram = d3.layout.histogram().bins(12).range([30,150])(neg_data);
   
  var x = d3.scale.ordinal()
      .domain(histogram.map(function(d) { return d.x; }))
      .rangeRoundBands([0, width]);

  var nx = d3.scale.ordinal()
      .domain(neg_histogram.map(function(d) { return d.x; }))
      .rangeRoundBands([0, width]);
   
  var y = d3.scale.linear()
      .domain([0, d3.max(histogram.map(function(d) { return d.y; }))])
      .range([0, height]);

  var ny = d3.scale.linear()
      .domain([0, d3.max(neg_histogram.map(function(d) { return d.y; }))])
      .range([0, height]);

  var xAxis = d3.svg.axis()
        .scale(x)
        .tickFormat(d3.format(",.0f"))
        .orient("bottom")
        .tickSize([5]).tickSubdivide(true);

  var yAxis = d3.svg.axis()
      .scale(y)
      .tickFormat(d3.format(",.0f"))
      .orient("left")
      .tickSubdivide(true);

  /*var xAxis_neg = d3.svg.axis()
        .scale(x_neg)
        //.tickValues([0,30,60,90,120,150,180,210,240,270,300])
        .tickFormat(d3.format(",.0f"))
        .orient("top");*/
   
  /*var svg = d3.select(reference).append("svg")
      .attr("width", width)
      .attr("height", 2 * height)
      .on("click", function() { console.log("svg"); });*/
   
  svg.selectAll("rect-pos")
      .data(histogram)
    .enter().append("rect")
      .attr("width", x.rangeBand())
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return height - y(d.y); })
      .attr("height", function(d) { return y(d.y); })
      .on("click", function(d,i){ 
        console.log("upper rect, id:",i);
        d3.event.stopPropagation();
      });

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (height)  + ")")
      .call(xAxis);

  /*svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(30,0)")
      .call(yAxis);*/

  svg.selectAll("rect-neg")
      .data(neg_histogram)
    .enter().append("rect")
      .style("fill", "red")
      .attr("width", x.rangeBand())
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return height + 20})
      .attr("height", function(d) { return ny(d.y); })
      .on("click", function(d,i){ 
        console.log("lower rect, id:",i);
        d3.event.stopPropagation();
      });

  //svg.selectAll("text.label")
  svg.selectAll("rect-pos")
      .data(histogram)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("dy", ".75em")
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .attr("x", function(d) { return x(d.x) + x.rangeBand()/2; })
      //.attr("y", function(d) { return height - y(d.y); })
      .attr("y", function(d) { return height - 10; })
      .text(function(d) { return d.y; });

  svg.selectAll("rect-neg")
      .data(neg_histogram)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("dy", "1.0em")
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .attr("x", function(d) { return nx(d.x) + nx.rangeBand()/2; })
      .attr("y", function(d) { return height + 20; })
      //.attr("y", function(d) { return height + 20 + ny(d.y); })
      .text(function(d) { return d.y; });
   
  svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", height)
      .attr("y2", height);  

  svg.on("click", function(){
    console.log("SVG clicked!");
  });
};

if (Meteor.isClient) {
  Meteor.subscribe("tasks");

  // counter starts at 0
  Session.setDefault('counter', 0);

  //Make a results variable that compares the two typing samples
  Session.setDefault('similarity', 0.0);

  Session.setDefault('textBoxMsg1', 'Person 1 - type your example text here');
  Session.setDefault('textBoxMsg2', 'Person 2 - type your example text here');

  //Try and listen to results database for updates from the Python script
  Results.find().observeChanges({
    added: function(){
      console.log('Document added to Results database:', Results.find().fetch()[0]);
      Session.set('similarity', Results.find().fetch()[0]['euclidean_distance_score'].toFixed(3));
    },
    changed: function(){
      console.log('Document changed in Results database');
      Session.set('similarity', Results.find().fetch()[0]['euclidean_distance_score'].toFixed(3));
    },
    removed: function(){
      console.log('Document removed from Results database');
      Session.set('similarity', 0.0);
    }
  });

  //init_histogram();

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
      console.log(JSON.stringify(typingData));
    }
  });

  Template.inputArea1.events({
  'keyup': function(event) {
    //event.preventDefault();
    console.log("KEYUP" + " " + event.keyCode + " " + event.timeStamp);
    if(event.keyCode !== 9){
      typingData.push(new keyData("keyup", event.keyCode, event.timeStamp));
      TypingDatabase1.insert(new keyData("keyup", event.keyCode, event.timeStamp));

      if(event.keyCode in press_times){
        //pull off first element of array with shift()
        dwell_times.push(event.timeStamp - press_times[event.keyCode].shift());
        console.log(dwell_times);
        draw_histogram(dwell_times, dwell_times2);
        //draw_histogram("div.histogram", dwell_times, dwell_times2);
      }
      else{
        console.log("uh-oh, missing a keypress for key ",event.keyCode)
      }
    }
  }
});

  Template.inputArea1.events({
  'keydown': function(event) {
    //event.preventDefault();
    console.log("KEYDOWN" + " " + event.keyCode + " " + event.timeStamp);
    if(event.keyCode !== 9){
      typingData.push(new keyData("keydown", event.keyCode, event.timeStamp));
      TypingDatabase1.insert(new keyData("keydown", event.keyCode, event.timeStamp));

      if(event.keyCode in press_times && press_times[event.keyCode].length != 0){
        console.log("That's weird, key "+event.keyCode+" pressed twice before being released");
      }
      else{
        press_times[event.keyCode] = [];
        press_times[event.keyCode].push(event.timeStamp);
      }
    }
  }
});

  Template.inputArea2.events({
  'keyup': function(event) {
    //event.preventDefault();
    console.log("KEYUP" + " " + event.which + " " + event.timeStamp);
    if(event.which !== 9){
      typingData.push(new keyData("keyup", event.which, event.timeStamp));
      TypingDatabase2.insert(new keyData("keyup", event.which, event.timeStamp));

      if(event.keyCode in press_times2){
        //pull off first element of array with shift()
        dwell_times2.push(event.timeStamp - press_times2[event.keyCode].shift());
        console.log(dwell_times2);
        draw_histogram(dwell_times, dwell_times2);
        //console.log(d3.select("#histogramSVG").node().getBBox());
        console.log(d3.select("#histogramSVG").node().getBoundingClientRect().width, d3.select("#histogramSVG").node().getBoundingClientRect().height);
        //draw_histogram(div_name, dwell_times, dwell_times2);
      }
      else{
        console.log("uh-oh, missing a keypress for key ",event.keyCode)
      }
    }
  }
});

  Template.inputArea2.events({
  'keydown': function(event) {
    //event.preventDefault();
    console.log("KEYDOWN" + " " + event.which + " " + event.timeStamp);
    //Don't add Tab presses to the database since it also switches text boxes (the keydown
    // and keyup events will be in different typing databases)
    if(event.which !== 9){
      typingData.push(new keyData("keydown", event.which, event.timeStamp));
      TypingDatabase2.insert(new keyData("keydown", event.which, event.timeStamp));

      if(event.keyCode in press_times2 && press_times2[event.keyCode].length != 0){
        console.log("That's weird, key "+event.keyCode+" pressed twice before being released");
      }
      else{
        press_times2[event.keyCode] = [];
        press_times2[event.keyCode].push(event.timeStamp);
      }

    }
  }
});

  Template.compare.events({
    'click button': function () {
      // increment the counter when button is clicked
      // console.log(Results.findOne());
      Tasks.insert({"type":"compareClick","timeStamp":event.timeStamp})

      //It doesn't work to update things here because the calculation from the Python script
      //won't be finished by the time we look in the database for the result below. Instead,
      //we want some way of automatically reading from the database and updating the
      //similarity score with the value from the database in real time.

      //result = Results.find().fetch();
      //console.log(result);
      //Session.set('counter', result[0]['num_keys']);
      //Session.set('similarity', result[0]['cosine_distance'].toFixed(3));
    }
  });

  Template.compare.helpers({
    similarity: function () {
      return Session.get('similarity');
    }
  });

  Template.reset.events({
    'click button': function () {
      Meteor.call('resetDatabases');
      //Also clear the text boxes
      Session.set('textBoxMsg1', 'Person 1 - type your example text here');
      Session.set('textBoxMsg2', 'Person 2 - type your example text here');
    }
  });

  //trying to get reactive updating here (like http://mhyfritz.com/blog/2014/08/16/reactive-d3-meteor/)
  //Template.histogram.rendered = function(){
  Template.histogram.onRendered(function(){
      init_histogram();
    //draw_histogram_test();
    //draw_histogram(dwell_times, dwell_times2);
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    console.log('Hello on server startup (from server)');
    console.log(JSON.stringify(typingData));

    plotDataCollection.remove({});
    console.log(plotDataCollection.find().count());

    if (plotDataCollection.find().count() === 0) {
      data.forEach(function(entry) {
        plotDataCollection.insert(entry);
        console.log(entry);
      });

      console.log('in here',plotDataCollection.findOne());
    }

    return Meteor.methods({
      resetDatabases: function() {
        TypingDatabase1.remove({});
        TypingDatabase2.remove({});
        Results.remove({});
        Tasks.remove({});
      }
    });

  });

  Meteor.publish("tasks", function () {
    return Tasks.find();
  });
}