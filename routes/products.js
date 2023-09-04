import express from "express";
import Product from "../models/product.js";
const router = express.Router();
import cloudinary from "../utils/cloudinary.js";
import { isAdmin } from "../middleware/auth.js";

//CREATE

router.post("/", isAdmin, async (req, res) => {
  const { name, brand, desc, price, image } = req.body;

  try {
    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image, {
        upload_preset: "veeshop",
      });

      if (uploadedResponse) {
        const product = new Product({
          name,
          brand,
          desc,
          price,
          image: uploadedResponse,
        });

        const savedProduct = await product.save();
        res.status(200).send(savedProduct);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

//DELETE

// router.delete("/:id", async (req, res) => {
//   try {
//     await Product.findByIdAndDelete(req.params.id);
//     res.status(200).send("Product has been deleted...");
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

//GET ALL PRODUCTS

router.get("/", async (req, res) => {
  const qbrand = req.query.brand;
  try {
    let products;

    if (qbrand) {
      products = await Product.find({
        brand: qbrand,
      });
    } else {
      products = await Product.find();
    }

    res.status(200).send(products);
  } catch (error) {
    res.status(500).send(error);
  }
});

//GET PRODUCT

router.get("/find/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.status(200).send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});

//UPDATE

// router.put("/:id", async (req, res) => {
//   try {
//     const updatedProduct = await Product.findByIdAndUpdate(
//       req.params.id,
//       {
//         $set: req.body,
//       },
//       { new: true }
//     );
//     res.status(200).send(updatedProduct);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found ... ");

    if (product.image.public_id) {
      const destroyResponse = await cloudinary.uploader.destroy(
        product.image.public_id
      );

      if (destroyResponse) {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        res.status(200).send(deletedProduct);
      }
    } else {
      console.log("Action terminated. Failed to deleted product image ... ");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

router.put("/:id", isAdmin, async (req, res) => {
  if (req.body.productImg) {
    try {
      const destroyResponse = await cloudinary.uploader.destroy(
        req.body.product.image.public_id
      );

      if (destroyResponse) {
        const uploadedResponse = await cloudinary.uploader.upload(
          req.body.productImg,
          {
            upload_preset: "veeshop",
          }
        );
        if (uploadedResponse) {
          const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
              $set: {
                ...req.body.product,
                image: uploadedResponse,
              },
            },
            { new: true }
          );

          res.status(200).send(updatedProduct);
        }
      }
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body.product,
        },
        { new: true }
      );
      res.status(200).send(updatedProduct);
    } catch (err) {
      res.status(500).send(err);
    }
  }
});
const productRoute = router;
export default productRoute;
