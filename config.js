const firebase = require("firebase")

const app = firebase.initializeApp({
    apiKey: "AIzaSyDW_EXULZ9zc6pixVnuHAopJhslaRffjRc",
    authDomain: "githubbot-eb6c2.firebaseapp.com",
    databaseURL: "https://githubbot-eb6c2-default-rtdb.firebaseio.com/",
    storageBucket: "githubbot-eb6c2.appspot.com",
  });

  module.exports=app;
