const { db } = require("../config/firebase");

exports.loginPostController = async (req, res) => {
  const { userType, username, password } = req.body;

  try {
    const doc = await db.collection("users").doc(username).get();
    if (doc.exists) {
      const user = doc.data();
      if (userType === user.userType && password === user.password) {
        //login success
        req.session.user = {
          username: user.username,
          name: user.name,
          userType: user.userType,
        };
  
        res.redirect("/dashboard");
      } else {
        //wrong pass or type
        res.render("pages/home.ejs", {
          title: "CIMS - Authentication error",
          authError: "Wrong credentials!",
        });
      }
    } else {
      //user not found
      res.render("pages/home.ejs", {
        title: "CIMS - Authentication error",
        authError: "User not found!",
      });
    }
  }
  catch {
    res.render("pages/home.ejs", {
      title: "CIMS - Server error",
      authError: "Failed to read data!",
    });
  }
};
