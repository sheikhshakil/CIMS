module.exports = () => {
  return (req, res, next) => {
    if (req.session.user) {
      return next();
    } else {
      res.redirect("/");
    }
  };
};
