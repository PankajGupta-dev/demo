const productService = require('../services/productService');

async function listProducts(req, res, next) {
  try {
    const products = await productService.getAllProducts();
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND', statusCode: 404 } });
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
};
