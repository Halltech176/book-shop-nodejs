const Product = require("../models/product");
const fileHelper = require("../util/file");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image);
  if (!image) {
    return res.render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
    });
  }

  const imageUrl = `/${image.path}`;
  const product = new Product({
    title,
    imageUrl,
    price,
    description,
    userId: req.user._id,
  });
  product
    .save()
    .then((result) => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      next(err);
      console.log(err);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;

  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      // const product = products[0];
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
      });
    })
    .catch((err) => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;

  // const {title, price, imageUrl, description}
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  Product.findById(prodId).then((product) => {
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.redirect("/");
    }

    (product.title = updatedTitle), (product.price = updatedPrice);
    if (image) {
      fileHelper.deleteFile(product.imageUrl);
      product.imageUrl = `/${image.path}`;
    }

    product.description = updatedDesc;

    product
      .save()
      .then((result) => {
        // throw new Error("An Error occured here");
        res.redirect("/admin/products");
      })
      .catch((err) => {
        next(err);
        console.log(err);
      });
  });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => console.log(err));
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then((product) => {
    if (!product) {
      return next(new Error("Product not found"));
    }
    fileHelper.deleteFile(product.imageUrl);
    return Product.findByIdAndRemove(prodId)
      .then((product) => {
        if (product.userId.toString() !== req.user._id.toString()) {
          return res.redirect("/");
        }
        res.redirect("/admin/products");
      })
      .catch((err) => {
        next(err);
        console.log(err);
      });
  });
};
