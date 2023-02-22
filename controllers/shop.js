const Product = require("../models/product");
const Order = require("../models/order");
const fs = require("fs");
const path = require("path");
const pdfDocument = require("pdfkit");
const fileHelper = require("../util/file");
const stripe = require("stripe")(
  "sk_test_51Me8GOBHdsm7HCGBsn8Efj63Su09W0E76yRkGcvM71smArD4ps6H0JtuNpsqnTd0aXMHG8RB54dpGtKSXgDGEhS000SP8vsCL6"
);

const ITEM_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  console.log(req.user);

  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => console.log(err));
};

exports.getIndex = (req, res, next) => {
  let totalItems;
  const page = req.query.page;
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    })

    .then((products) => {
      console.log(totalItems);
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        totalProducts: totalItems,
        hasNextPage: ITEM_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE),
        currentPage: page,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")

    .then((user) => {
      const products = user.cart.items;
      console.log(products);
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: user.cart.items,
      });
    })
    .catch((err) => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;

  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((cart) => {
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  req.user
    .deleteItemFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postOrder = (req, res, next) => {
  const products = req.user
    .populate("cart.items.productId")
    .then(({ cart: { items } }) => {
      const product = items.map((data) => {
        return { product: data.productId._doc, quantity: data.quantity };
      });
      const user = { name: req.user.name, userId: req.user._id };

      const order = new Order({ products: product, user });

      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => console.log(err));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthenticated"));
      }
      const filename = `invoice-${orderId}.pdf`;
      const filePath = path.join("data", "invoices", filename);
      const pdfDoc = new pdfDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename=" ' + filename + ' "'
      );

      pdfDoc.pipe(fs.createWriteStream(filePath));
      pdfDoc.pipe(res);
      pdfDoc.text("INVOICE", { underline: true });
      pdfDoc.text(`________________`);
      order.products.forEach((productOrdered) => {
        console.log(productOrdered);

        pdfDoc.text(`title ${productOrdered.product.title}`);
        pdfDoc.text(`description ${productOrdered.product.description}`);
        pdfDoc.text(`price ${productOrdered.product.price}`);

        pdfDoc.text(`+++++++++++`);
      });
      pdfDoc.end();
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate("cart.items.productId")

    .then((user) => {
      products = user.cart.items;

      products.forEach((product) => {
        total += product.quantity * product.productId.price;
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((data) => {
          return {
            price_data: {
              currency: "usd",
              unit_amount: 100,
              product_data: {
                name: data.productId.title,
                description: data.productId.description,
              },
            },
            quantity: data.quantity,
          };
        }),
        mode: "payment",
        success_url: `${req.protocol}://${req.get("host")}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`,
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout page",
        products,
        totalSum: total,
        sessionId: session.id,
      });
    })
    .catch((err) => console.log(err));
};
