const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
const cloudinary = require("cloudinary").v2;

// Create Product
const createProduct = asyncHandler(async (req, res) => {
    const {name, sku, category, quantity, price, description} = req.body;

    // Validation
    if (!name ||!category ||!quantity ||!price ||!description) {
        res.status(400)
           throw new Error("Please fill in all required fields");
        };

        // Handle Image Upload
        let fileData = {}
        if (req.file) {
            // Save image to cloudinary
            let uploadedFile;
            try {
                uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "ChikeStore", resource_type: "image"})
            } catch (error) {
                res.status(500)
                throw new Error("Image could not be uploaded");
            }


            fileData = {
                fileData: req.file.originalname,
                filePath: uploadedFile.secure_url,
                fileType: req.file.mimetype,
                fileSize: fileSizeFormatter(req.file.size, 2), // 2 stands for two decimal places
            }
           
        }

        // Create product
        const product = await Product.create({
            user: req.user.id,
            name,
            sku,
            category,
            quantity,
            price,
            description,
            image: fileData,
        })

        res.status(201).json(product);
    }
);

// get all products
const getProducts = asyncHandler (async (req, res) => {
    const products = await Product.find({user: req.user.id}).sort("-createdAt");

    res.status(200).json(products);
});

// Get Single Product
const getProduct = asyncHandler (async (req, res) => {
    const product = await Product.findById(req.params.id);

    // If product does not exist
    if (!product) {
        res.status(404)
        throw new Error("Product not found");
    }

    // Match product to its user
    if (product.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error("User not authorized");
    }
    res.status(200).json(product);
});

// Delete Product
const deleteProduct = asyncHandler (async (req, res) => {
    const product = await Product.findById(req.params.id);

    // If product does not exist
    if (!product) {
        res.status(404)
        throw new Error("Product not found");
    }

    // Match product to its user
    if (product.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error("User not authorized");
    }
    await product.remove();
    res.status(200).json({message: "Product deleted successfully"});
});

// Update Product
const updateProduct = asyncHandler(async (req, res) => {
    const {name, category, quantity, price, description} = req.body;
    const {id} = req.params;

    const product = await Product.findById(id)

     // If product does not exist
     if (!product) {
        res.status(404)
        throw new Error("Product not found");
    }

      // Match product to its user
      if (product.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error("User not authorized");
    }

        // Handle Image Upload
        let fileData = {}
        if (req.file) {
            // Save image to cloudinary
            let uploadedFile;
            try {
                uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "ChikeStore", resource_type: "image"})
            } catch (error) {
                res.status(500)
                throw new Error("Image could not be uploaded");
            }


            fileData = {
                fileData: req.file.originalname,
                filePath: uploadedFile.secure_url,
                fileType: req.file.mimetype,
                fileSize: fileSizeFormatter(req.file.size, 2), // 2 stands for two decimal places
            }
           
        }

        // Update product
        const updatedProduct = await Product.findByIdAndUpdate(
            {_id: id},
            {
                name,
                category,
                quantity,
                price,
                description,
                image: Object.keys(fileData).length === 0 ? product?.image : fileData,
            },
            {
              new: true,
              runValidators: true  
            }
        );

        res.status(200).json(updatedProduct);
    }
);


module.exports = {
    createProduct,
    getProducts,
    getProduct,
    deleteProduct,
    updateProduct,
}