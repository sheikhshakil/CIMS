let admin = require("firebase-admin");
let sak = require("./sak.json");

admin.initializeApp({
  credential: admin.credential.cert(sak),
  storageBucket: "cimsbackend.appspot.com/",
});

exports.db = admin.firestore();
exports.storageBucket = admin.storage().bucket();
