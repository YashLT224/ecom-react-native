const express = require("express");
const Product = require("../models/product");
const router = express.Router();
const { Category } = require("../models/category");
const checkAuth = require("../helpers/auth");
const mongoose = require("mongoose");
var multer = require("multer");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  //localhost:3000/api/vi/products?categories=233232323,23233232
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }

  const productList = await Product.find(filter).populate("category");

  if (!productList) {
    return res.status(500).json({ success: false });
  }
  return res.send(productList);
});

router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) {
    res.status(500).json({ success: false });
  }
  res.send(product);
});

router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  try {
    const category = await Category.find({ name: req.body.category });

    if (!category) return res.status(400).send("Invalid Category");

    const file = req.file;
    if (!file) return res.status(400).send("No image in the request");

    const fileName = file.filename;

    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    let product = new Product({
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: `${basePath}${fileName}`, // "http://localhost:3000/public/upload/image-2323232",
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    });

    product = await product.save();

    if (!product) return res.status(500).send("The product cannot be created");

    res.send(product);
  } catch (err) {
    return res.status(500).send("The invalid category");
  }
});

router.post(`/raw`, async (req, res) => {
  try {
    const category = await Category.findById(req.body.category);

    if (!category) return res.status(400).send("Invalid Category");

    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    let product = new Product({
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: `https://eshop-server.herokuapp.com/public/uploads/Surface-Pro-7-128GB-1604665289664.png`, // "http://localhost:3000/public/upload/image-2323232",
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    });

    product = await product.save();

    if (!product) return res.status(500).send("The product cannot be created");

    res.send(product);
  } catch (err) {
    return res.status(500).send("The invalid category");
  }
});

router.put("/:id", async (req, res) => {
  console.log("ns,nsndmndnmsn,,..,.,", req.body.category);
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Product Id");
  }

  console.log(req.body.category);
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(400).send("Invalid Product!");

  // const file = req.file;
  // let imagepath;

  // if (file) {
  //   const fileName = file.filename;
  //   const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
  //   imagepath = `${basePath}${fileName}`;
  // } else {
  //   imagepath = product.image;
  // }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      // image: imagepath,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!updatedProduct)
    return res.status(500).send("the product cannot be updated!");
  else {
    return res.status(200).json({ status: 200, updatedProduct });
  }
});

router.delete("/:id", (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res.status(200).json({
          success: true,
          message: "the product is deleted!",
        });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "product not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get(`/get/count`, async (req, res) => {
  const productCount = await Product.countDocuments();

  if (!productCount) {
    return res.status(500).json({ success: false });
  }
  return res.send({
    productCount: productCount,
  });
});

router.get(`/get/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const products = await Product.find({ isFeatured: true }).limit(+count);

  if (!products) {
    return res.status(500).json({ success: false });
  }
  return res.send(products);
});

router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Product Id");
    }
    console.log(req.params.id);
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true }
    );

    if (!product) return res.status(500).send("the gallery cannot be updated!");

    res.send(product);
  }
);

module.exports = router;