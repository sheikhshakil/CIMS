const { firestore } = require("firebase-admin");
const { db, storageBucket } = require("../config/firebase");
const excel = require("exceljs");

exports.dashboardGetController = async (req, res) => {
  const user = req.session.user;

  //getting company data
  const company = (
    await db.collection("companies").doc("company").get()
  ).data();

  //getting cars data---------------------
  const docs = await db
    .collection("inventory")
    .orderBy("createdAt", "desc")
    .get();

  let carsData = [];
  docs.forEach((doc) => {
    carsData.push(doc.data());
  });

  //getting extra cols list----------------------------------
  const extras = await db.collection("extraColumns").get();
  let extraColumns = [];
  extras.forEach((extra) => {
    extraColumns.push(extra.data());
  });

  //if user if admin-----------------------
  if (user.userType === "admin") {
    res.render("pages/dashboard.ejs", {
      title: "CIMS - Dashboard | Admin",
      company,
      carsData,
      extraColumns,
    });
  }

  //if user is purchasing user----------------
  else if (user.userType === "purchasing") {
    //passing data
    res.render("pages/dashboard.ejs", {
      title: "CIMS - Dashboard | Purchasing",
      company,
      carsData,
      extraColumns,
    });
  }

  //if user is processing user----------------
  else if (user.userType === "processing") {
    //passing data
    res.render("pages/dashboard.ejs", {
      title: "CIMS - Dashboard | Processing",
      company,
      carsData,
      extraColumns,
    });
  }

  //if user is sales user----------------------
  else if (user.userType === "sales") {
    //passing data
    res.render("pages/dashboard.ejs", {
      title: "CIMS - Dashboard | Sales",
      company,
      carsData,
      extraColumns,
    });
  }
};

//admin controllers
exports.manageUsersGetController = async (req, res) => {
  if (req.session.user.userType === "admin") {
    //getting users list
    const ulist = await db.collection("users").get();
    let users = [];
    ulist.forEach((doc) => {
      users.push(doc.data());
    });

    res.render("pages/manageUsers.ejs", {
      title: "CIMS - Manage users",
      allUser: users,
    });
  } else {
    res.send("Unauthorized access to this route!");
  }
};
exports.deleteUserController = (req, res) => {
  if (req.session.user.userType === "admin") {
    const { username } = req.query;
    db.collection("users")
      .doc(username)
      .delete()
      .then(() => {
        res.redirect("/manage-users#ulist");
      })
      .catch((err) => {
        res.send(err);
      });
  } else {
    res.send("You don't have permission to perform this task!");
  }
};
exports.createUserPostController = async (req, res) => {
  if (req.session.user.userType === "admin") {
    //execute
    const { userType, name, username, password } = req.body;

    if (userType === "null") {
      res.send("Please select a user type first!");
      return;
    }

    let doc = await db.collection("users").doc(username).get();

    if (doc.exists) {
      res.send("Username already exists! Failed to create user.");
    } else {
      db.collection("users")
        .doc(username)
        .set({ userType, name, username, password })
        .then(() => {
          res.redirect("/manage-users#ulist");
        })
        .catch((err) => {
          res.send(err);
        });
    }
  } else {
    res.send("Unauthorized access to this route!");
  }
};
exports.createColumnController = (req, res) => {
  if (req.session.user.userType === "admin") {
    let { userType, colName, colImp } = req.body;
    let propName = colName.split(" ").join("").toLowerCase();

    db.collection("extraColumns")
      .doc(propName)
      .set({
        propName,
        colName,
        userType,
        colImp,
      })
      .then(() => {
        res.redirect("/dashboard#data");
      })
      .catch((err) => {
        res.send(err);
      });
  } else {
    res.send("Unauthorized access to this route!");
  }
};
exports.updateCompanyController = async (req, res) => {
  if (req.session.user.userType === "admin") {
    let logoUrl = "";
    if (req.file) {
      let dest = "company/logo/";
      let filePointer = storageBucket.file(dest + req.file.originalname);
      try {
        await filePointer.save(req.file.buffer, {
          contentType: req.file.mimetype,
          predefinedAcl: "publicRead",
        });

        let metadata = await filePointer.getMetadata();
        logoUrl = metadata[0].mediaLink;
      } catch {
        res.send("Failed to upload logo!");
        return;
      }
    }

    const { compName, compDes } = req.body;
    db.collection("companies")
      .doc("company")
      .set({
        logoUrl,
        compName,
        compDes,
      })
      .then(() => {
        res.redirect("/dashboard");
      })
      .catch((err) => {
        res.send(err);
      });
  } else {
    res.send("Unauthorized access to this route!");
  }
};
exports.adminInvInsertGetController = async (req, res) => {
  if (req.session.user.userType === "admin") {
    //getting cars data---------------------
    const docs = await db
      .collection("inventory")
      .orderBy("createdAt", "desc")
      .get();

    let carsData = [];
    docs.forEach((doc) => {
      carsData.push(doc.data());
    });

    //getting extra cols list----------------------------------
    const extras = await db.collection("extraColumns").get();
    let extraColumns = [];
    extras.forEach((extra) => {
      extraColumns.push(extra.data());
    });

    res.render("pages/adminInsert.ejs", {
      title: "CIMS - Admin insert data",
      carsData,
      extraColumns,
    });
  } else {
    res.send("Unauthorized access to this route!");
  }
};
exports.deleteDataController = (req, res) => {
  if (req.session.user.userType === "admin") {
    const { internalNum } = req.query;
    db.collection("inventory")
      .doc(internalNum)
      .delete()
      .then(() => {
        res.redirect("/dashboard#data");
      })
      .catch((err) => {
        res.send(err);
      });
  } else {
    res.send("You don't have permission to perform this task!");
  }
};

//purchasing user controller
exports.purchasingInsertController = async (req, res) => {
  if (
    req.session.user.userType === "purchasing" ||
    req.session.user.userType === "admin"
  ) {
    const { internalNum } = req.body;

    //check if int num already present
    let temp = await db.collection("inventory").doc(internalNum).get();
    if (temp.exists) {
      res.send(
        `Assigned internal number ${internalNum} already exists in database! Please use an unique internal number to insert new purchasing data.`
      );
      return;
    }

    let sellerIdUrls = [];
    let carPaperUrls = [];

    if (req.files.length > 0) {
      //upload the files
      for (file of req.files) {
        let dest = `documents/${internalNum}/${file.fieldname}/`;
        let filePointer = storageBucket.file(dest + file.originalname);

        try {
          await filePointer.save(file.buffer, {
            contentType: file.mimetype,
            predefinedAcl: "publicRead",
          });

          let metadata = await filePointer.getMetadata();

          if (file.fieldname === "sellerId") {
            sellerIdUrls.push(metadata[0].mediaLink);
          } else if (file.fieldname === "carPapers") {
            carPaperUrls.push(metadata[0].mediaLink);
          }
        } catch {
          res.send("Error occured while uploading files!");
          return;
        }
      }
    }

    if (sellerIdUrls.length + carPaperUrls.length == req.files.length) {
      //create doc in firestore
      const { datePurc, purcPrice, vendor, prodYear, brand, model, vin } =
        req.body;

      let purcMonth = new Date(datePurc).getMonth();
      let purcYear = new Date(datePurc).getFullYear();

      db.collection("inventory")
        .doc(internalNum)
        .set(
          {
            datePurc,
            purcPrice,
            vendor,
            sellerIdUrls,
            internalNum,
            carPaperUrls,
            prodYear,
            brand,
            model,
            vin,
            purcMonth,
            purcYear,
            createdAt: firestore.Timestamp.now(),
          },
          { merge: true }
        )
        .then(() => {
          res.redirect("/dashboard#data");
        })
        .catch((err) => {
          res.send(
            err +
              "\nFiles were uploaded but failed to save other data! Please retry."
          );
        });
    } else {
      res.send("Failed to save all files!");
    }
  } else {
    res.send("Unauthorized access to this route!");
  }
};

//processing user controller
exports.processingInsertController = (req, res) => {
  if (
    req.session.user.userType === "processing" ||
    req.session.user.userType === "admin"
  ) {
    const {
      internalNum,
      engine,
      transmission,
      wheels,
      headLights,
      tailLights,
      sits,
      radio,
      battery,
      remarks,
      catConIn,
      catConOut,
    } = req.body;

    db.collection("inventory")
      .doc(internalNum)
      .update({
        engine,
        transmission,
        wheels,
        headLights,
        tailLights,
        sits,
        radio,
        battery,
        remarks,
        catConIn,
        catConOut,
      })
      .then(() => {
        res.redirect("/dashboard#data");
      })
      .catch((err) => {
        res.send(err);
      });
  } else {
    res.send("Unauthorized access to this route!");
  }
};

//sales user controller
exports.salesInsertController = (req, res) => {
  if (
    req.session.user.userType === "sales" ||
    req.session.user.userType === "admin"
  ) {
    const { internalNum, saleDate, salePrice, buyerLoc } = req.body;

    db.collection("inventory")
      .doc(internalNum)
      .update({
        saleDate,
        salePrice,
        buyerLoc,
      })
      .then(() => {
        res.redirect("/dashboard#data");
      })
      .catch((err) => {
        res.send(err);
      });
  } else {
    res.send("Unauthorized access to this route!");
  }
};

//insert data in extra column controller
exports.insertExtraController = (req, res) => {
  const { internalNum, propName, value } = req.body;
  db.collection("inventory")
    .doc(internalNum)
    .update({
      [propName]: value,
    })
    .then(() => {
      res.redirect("/dashboard#data");
    })
    .catch((err) => {
      res.send(err);
    });
};

//update data controller
exports.updateDataController = (req, res) => {
  const { propName, internalNum, value } = req.body;
  db.collection("inventory")
    .doc(internalNum)
    .update({
      [propName]: value,
    })
    .then(() => {
      res.redirect("/dashboard#data");
    })
    .catch((err) => {
      res.send(err);
    });
};

exports.exportDataController = async (req, res) => {
  //getting cars data
  const docs = await db
    .collection("inventory")
    .orderBy("createdAt", "desc")
    .get();
  let carsData = [];
  docs.forEach((doc) => {
    carsData.push(doc.data());
  });
  //getting extra columns list
  const extras = await db.collection("extraColumns").get();
  let extraColumns = [];
  extras.forEach((extra) => {
    extraColumns.push(extra.data());
  });

  //create excel workbook & worksheet--------------------------------------------------------
  let workbook = new excel.Workbook();
  let sheet = workbook.addWorksheet("InventoryData");

  //create sheet columns
  //insert purchasing cols
  let columns = [
    { header: "Date of purchase", key: "datePurc", width: 20 },
    { header: "Purchase price", key: "purcPrice", width: 20 },
    { header: "Vendor/Seller", key: "vendor", width: 20 },
    { header: "Seller docs", key: "sellerDocs", width: 15 },
    { header: "Assigned number", key: "internalNum", width: 20 },
    { header: "Production year", key: "prodYear", width: 20 },
    { header: "Brand", key: "brand", width: 15 },
    { header: "Model", key: "model", width: 15 },
    { header: "VIN", key: "vin", width: 15 },
    { header: "Title - Car papers", key: "carPapers", width: 20 },
  ];
  //insert purchasing extra cols
  if (extraColumns.length > 0) {
    extraColumns.forEach((col) => {
      if (col.userType === "purchasing") {
        columns.push({ header: col.colName, key: col.propName, width: 15 });
      }
    });
  }

  //create processing cols
  columns.push(
    { header: "Engine", key: "engine", width: 15 },
    { header: "Transmission", key: "transmission", width: 15 },
    { header: "Wheels", key: "wheels", width: 15 },
    { header: "Headlights", key: "headLights", width: 15 },
    { header: "Tail lights", key: "tailLights", width: 15 },
    { header: "Sits", key: "sits", width: 10 },
    { header: "Radio", key: "radio", width: 10 },
    { header: "Battery", key: "battery", width: 15 },
    { header: "Remarks", key: "remarks", width: 20 },
    { header: "Catalytic Conv. In", key: "catConIn", width: 20 },
    { header: "Catalytic Conv. Out", key: "catConOut", width: 20 }
  );

  //insert processing extra cols
  if (extraColumns.length > 0) {
    extraColumns.forEach((col) => {
      if (col.userType === "processing") {
        columns.push({ header: col.colName, key: col.propName, width: 15 });
      }
    });
  }

  //insert sales cols
  columns.push(
    { header: "Date of sale", key: "saleDate", width: 20 },
    { header: "Sale price", key: "salePrice", width: 20 },
    { header: "Buyer's location", key: "buyerLoc", width: 20 }
  );
  //insert sales extra cols
  if (extraColumns.length > 0) {
    extraColumns.forEach((col) => {
      if (col.userType === "sales") {
        columns.push({ header: col.colName, key: col.propName, width: 15 });
      }
    });
  }
  //last col
  columns.push({ header: "Assigned number", key: "internalNum2", width: 20 });

  //assigning the cols
  sheet.columns = columns;

  //header style
  sheet.getRow(1).font = {
    bold: true,
  };

  //-------------------insert data----------------------
  carsData.forEach((data, i) => {
    let row = sheet.getRow(i + 2);
    row.getCell("datePurc").value = data.datePurc;
    row.getCell("purcPrice").value = data.purcPrice;
    row.getCell("vendor").value = data.vendor;
    row.getCell("sellerDocs").value = data.sellerIdUrls.length + " doc(s)";
    row.getCell("internalNum").value = data.internalNum;
    row.getCell("prodYear").value = data.prodYear;
    row.getCell("brand").value = data.brand;
    row.getCell("model").value = data.model;
    row.getCell("vin").value = data.vin;
    row.getCell("carPapers").value = data.carPaperUrls.length + " doc(s)";

    row.getCell("engine").value = data.engine;
    row.getCell("transmission").value = data.transmission;
    row.getCell("wheels").value = data.wheels;
    row.getCell("headLights").value = data.headLights;
    row.getCell("tailLights").value = data.tailLights;
    row.getCell("sits").value = data.sits;
    row.getCell("radio").value = data.radio;
    row.getCell("battery").value = data.battery;
    row.getCell("remarks").value = data.remarks;
    row.getCell("catConIn").value = data.catConIn;
    row.getCell("catConOut").value = data.catConOut;

    row.getCell("saleDate").value = data.saleDate;
    row.getCell("salePrice").value = data.salePrice;
    row.getCell("buyerLoc").value = data.buyerLoc;
    row.getCell("internalNum2").value = data.internalNum;

    extraColumns.forEach((col) => {
      row.getCell(col.propName).value = data[col.propName];
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");

  //send the file for download
  workbook.xlsx
    .write(res)
    .then(() => {
      res.end();
    })
    .catch((err) => {
      res.send(err);
    });
};
