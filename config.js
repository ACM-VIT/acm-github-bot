const firebase= require("firebase")
var config = {
    apiKey: "AIzaSyDW_EXULZ9zc6pixVnuHAopJhslaRffjRc",
    authDomain: "githubbot-eb6c2.firebaseapp.com",
    // For databases not in the us-central1 location, databaseURL will be of the
    // form https://[databaseName].[region].firebasedatabase.app.
    // For example, https://your-database-123.europe-west1.firebasedatabase.app
    databaseURL: "https://githubbot-eb6c2-default-rtdb.firebaseio.com/",
    storageBucket: "bucket.appspot.com"
  };
app = firebase.initializeApp(config);
module.exports = app;