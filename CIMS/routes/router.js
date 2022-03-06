const router = require("express").Router();
//for file upload
const multer = require("multer");
const upload = multer();
//for protecting routes
const isAuth = require("../middlewares/isAuthenticated");
const isUnauth = require("../middlewares/isUnauthenticated");
//controllers
const { loginPostController } = require("../controllers/authControllers");
const {
  dashboardGetController,
  createUserPostController,
  purchasingInsertController,
  processingInsertController,
  salesInsertController,
  createColumnController,
  insertExtraController,
  updateCompanyController,
  manageUsersGetController,
  adminInvInsertGetController,
  deleteUserController,
  deleteDataController,
  exportDataController,
  updateDataController,
} = require("../controllers/dashboardControllers");

//routes
router.post("/login", isUnauth(), loginPostController);
router.get("/dashboard", isAuth(), dashboardGetController);

//admin dashboard routes
router.get("/admin-inv-insert", isAuth(), adminInvInsertGetController);
router.get("/deleteData", isAuth(), deleteDataController)
router.get("/manage-users", isAuth(), manageUsersGetController);
router.post("/createUser", isAuth(), createUserPostController);
router.get("/deleteUser", isAuth(), deleteUserController);
router.post("/create-column", isAuth(), createColumnController);
router.post(
  "/update-company",
  upload.single("compLogo"),
  isAuth(),
  updateCompanyController
);

//purchasing dashboard routes
router.post(
  "/purchasing-insert",
  isAuth(),
  upload.any(),
  purchasingInsertController
);

//processing dashboard routes
router.post("/processing-insert", isAuth(), processingInsertController);

//sales dashboard routes
router.post("/sales-insert", isAuth(), salesInsertController);

//insert data in extra column route
router.post("/insert-extra", isAuth(), insertExtraController);
router.post("/update-data", isAuth(), updateDataController)
router.get("/export-data", exportDataController)

//logout
router.get("/logout", isAuth(), (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

router.get("/about", (req,res) => {
  res.render("pages/about.ejs", {title : "CIMS - About"});
})

router.get("/", isUnauth(), (req, res) => {
  res.render("pages/home.ejs", { title: "CIMS - Home" });
});

module.exports = router;
