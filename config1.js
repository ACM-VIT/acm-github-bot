const firebase = require("firebase")
var config = {
  apiKey: "AIzaSyDW_EXULZ9zc6pixVnuHAopJhslaRffjRc",
  authDomain: "githubbot-eb6c2.firebaseapp.com",
  databaseURL: "https://githubbot-eb6c2-default-rtdb.firebaseio.com",
  projectId: "githubbot-eb6c2",
  storageBucket: "githubbot-eb6c2.appspot.com",
  messagingSenderId: "914536204343",
  appId: "1:914536204343:web:98c088e4f08ba97f9d17b2",
  measurementId: "G-2F0GZYRT7C"
};
app = firebase.initializeApp(config);
module.exports = app;