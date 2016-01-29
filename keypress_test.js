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

//listener = new Keypress.Listener();

/*
listener.simple_combo("k", function() {
    console.log("You pressed k");
});
*/

if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);

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
    typingData.push(new keyData("keyup", event.which, event.timeStamp));
    TypingDatabase1.insert(new keyData("keyup", event.which, event.timeStamp));
  }
});

  Template.inputArea1.events({
  'keydown': function(event) {
    //event.preventDefault();
    console.log("KEYDOWN" + " " + event.which + " " + event.timeStamp);
    typingData.push(new keyData("keydown", event.which, event.timeStamp));
    TypingDatabase1.insert(new keyData("keydown", event.which, event.timeStamp));
  }
});

  Template.inputArea2.events({
  'keyup': function(event) {
    //event.preventDefault();
    console.log("KEYUP" + " " + event.which + " " + event.timeStamp);
    typingData.push(new keyData("keyup", event.which, event.timeStamp));
    TypingDatabase2.insert(new keyData("keyup", event.which, event.timeStamp));
  }
});

  Template.inputArea2.events({
  'keydown': function(event) {
    //event.preventDefault();
    console.log("KEYDOWN" + " " + event.which + " " + event.timeStamp);
    typingData.push(new keyData("keydown", event.which, event.timeStamp));
    TypingDatabase2.insert(new keyData("keydown", event.which, event.timeStamp));
  }
});

  Template.compare.events({
    'click button': function () {
      // increment the counter when button is clicked
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    console.log('Hello on server startup (from server)');
    console.log(JSON.stringify(typingData));
  });
}