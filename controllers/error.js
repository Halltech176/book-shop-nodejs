exports.get404 = (req, res, next) => {
  res.status(404).render("error/404", {
    pageTitle: "Page Not Found",
    path: "/404",
  });
};

exports.get500 = (error, req, res, next) => {
  res.status(404).render("error/500", {
    pageTitle: "Page Not Found",
    path: "/500",
  });
};
