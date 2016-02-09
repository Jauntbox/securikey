//var listener = new Keypress.Listener();

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

TypingDatabase1 = new Mongo.Collection('TypingDatabase1');
TypingDatabase2 = new Mongo.Collection('TypingDatabase2');
Results = new Mongo.Collection('Results');
Tasks = new Mongo.Collection('Tasks');

//listener = new Keypress.Listener();

/*
listener.simple_combo("k", function() {
    console.log("You pressed k");
});
*/

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
    console.log("KEYUP" + " " + event.which + " " + event.timeStamp);
    if(event.which !== 9){
      typingData.push(new keyData("keyup", event.which, event.timeStamp));
      TypingDatabase1.insert(new keyData("keyup", event.which, event.timeStamp));
    }
  }
});

  Template.inputArea1.events({
  'keydown': function(event) {
    //event.preventDefault();
    console.log("KEYDOWN" + " " + event.which + " " + event.timeStamp);
    if(event.which !== 9){
      typingData.push(new keyData("keydown", event.which, event.timeStamp));
      TypingDatabase1.insert(new keyData("keydown", event.which, event.timeStamp));
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
    //var self = this;

    var histogramSVG = d3.select("#histogramSVG");

    var drawGraph = function(plotData){
      //var svgClick = d3.select("#clickArea");

      console.log('Inside onRendered');
      var localData = [];
      var cursor = plotData.find();
      cursor.forEach(function(item){
        localData.push(item);
        console.log(item);
      })
      console.log('localData: ',localData);

      var barWidth = 40;
      var width = (barWidth + 10) * localData.length;
      var height = 200;

      var x = d3.scale.linear().domain([0, localData.length]).range([0, width]);
      var y = d3.scale.linear().domain([0, d3.max(localData, function(datum) { return datum.books; })]).
        rangeRound([0, height]);

      histogramSVG.selectAll("rect").
          data(localData).
          enter().
          append("svg:rect").
          attr("x", function(datum, index) { return x(index); }).
          attr("y", function(datum) { return height - y(datum.books); }).
          attr("height", function(datum) { return y(datum.books); }).
          attr("width", barWidth).
          attr("fill", "#2d578b").
          on("click", function(d,i){ 
            console.log("rect, id:",i," d:",d);
            d3.event.stopPropagation();
          });

      histogramSVG.selectAll("rect").
        data(localData).
        transition().duration(300).
        attr("y", function(datum) { return height - y(datum.books); }).
        attr("height", function(datum) { return y(datum.books); });
      };

      histogramSVG.on("click", function(){
        console.log("SVG clicked!");
      });

      plotDataCollection.find().observe({
        //aha, we just need to call the function where we make the circles update themselves
        //changed: _.partial(drawCircles, true) //does work (why?)
        changed: function() {
          console.log('calling drawGraph:');
          drawGraph(plotDataCollection);
        }
      })
    //})
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

  //Auto-update database to get reactive changes into the histogram
  /*Meteor.setInterval(function () {
      //console.log(plotDataCollection.findOne({year: 2009}));
      //console.log(plotDataCollection.findOne({year: 2009})['_id']);
      var num = plotDataCollection.findOne({year: 2009})['books'];

      plotDataCollection.update({year: 2009}, {$set: {'books': num+1}});
    }, 2000);*/

  Meteor.publish("tasks", function () {
    return Tasks.find();
  });
}