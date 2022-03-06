module.exports = () => {
  return (req, res, next) => {
    //res.locals.error = "";
    //res.locals.values = {};
    //res.locals.vaultSuccess = undefined;
    if (!req.session.user) {
      res.locals.user = undefined;
    } else {
      res.locals.user = req.session.user;
    }

    next();
  };
};
