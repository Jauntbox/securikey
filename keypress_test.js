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

var typingData = new Array();

TypingDatabase1 = new Meteor.Collection('TypingDatabase1');
TypingDatabase2 = new Meteor.Collection('TypingDatabase2');
Results = new Meteor.Collection('Results');
Tasks = new Meteor.Collection('Tasks');

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
      //This seems to work as far as reading from the results database in real time, but 
      //is likely not the best way to do this...
      if(Results.find().count() > 0){
        Session.set('similarity', Results.find().fetch()[0]['cosine_distance'].toFixed(3));
      }
      return Session.get('similarity');
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    console.log('Hello on server startup (from server)');
    console.log(JSON.stringify(typingData));
  });

  Meteor.publish("tasks", function () {
    return Tasks.find();
  });
}