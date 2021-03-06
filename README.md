# securikey

This is a toy program to play with keyboard dynamics algorithms for an additional layer of security in user verification. Right now, it's also a way for me to teach myself JavaScript and how to get it to talk to Python scripts. The main interface is a Meteor application, so you will need to download it from [https://www.meteor.com/](https://www.meteor.com/). The data collection of keys pressed and their timings is done with JavaScript, and this data is then read from Meteor's MongoDB database with a Python script. This Python script does the actual analysis of how close a match two samples of typed text are, and will eventually talk back to the Meteor app, again through its database.

Instructions
* Run the Meteor app by typing ``meteor`` into the command line in the securikey directory.
* Type some text into the two text boxes to see how likely it is that the two samples come from the same user (you should use the same string of text for both typing samples).
* Run the Python script via ``python keypress_test.py``. It will keep running and watch the database for changes, printing out new entries as soon as they're added.
* If you'd like to clear the database (eg. to try a different text sample), then exit the app and type ``meteor reset`` to clear the data from the database and then restart the app.
* You can run the standalone responsive histogram page by starting a local webserver, e.g. with `python -m SimpleHTTPServer 8001` and then opening a web browser to `http://localhost:8001/` and navigating to the file, `private/responsive_histogram_dual.html`