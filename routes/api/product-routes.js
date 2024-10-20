const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// Get all products with associated Category and Tag data
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Category },
        { model: Tag, through: ProductTag },
      ],
    });
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while retrieving products.' });
  }
});

// Get one product by ID with associated Category and Tag data
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        { model: Tag, through: ProductTag },
      ],
    });
    if (!product) {
      return res.status(404).json({ message: 'No product found with this id!' });
    }
    res.status(200).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while retrieving the product.' });
  }
});

// Create a new product
router.post('/', async (req, res) => {
  try {
    const { product_name, price, stock, category_id, tagIds } = req.body;

    // Validate required fields
    if (!product_name || !price || !stock) {
      return res.status(400).json({ message: 'Please provide product name, price, and stock.' });
    }

    // Create the product
    const newProduct = await Product.create({
      product_name,
      price,
      stock,
      category_id,
    });

    // If there are tagIds, create associations in the ProductTag table
    if (tagIds && tagIds.length) {
      const productTagIdArr = tagIds.map((tag_id) => ({
        product_id: newProduct.id,
        tag_id,
      }));
      await ProductTag.bulkCreate(productTagIdArr);
    }

    // Retrieve the created product with its associations
    const createdProduct = await Product.findByPk(newProduct.id, {
      include: [
        { model: Category },
        { model: Tag, through: ProductTag },
      ],
    });

    res.status(201).json(createdProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the product.' });
  }
});

// Update a product by its ID
router.put('/:id', async (req, res) => {
  try {
    const { product_name, price, stock, category_id, tagIds } = req.body;

    // Update the product details
    const [affectedRows] = await Product.update(
      { product_name, price, stock, category_id },
      {
        where: { id: req.params.id },
      }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'No product found with this id!' });
    }

    // If there are tagIds, update associations in the ProductTag table
    if (tagIds) {
      // Remove existing tags
      await ProductTag.destroy({ where: { product_id: req.params.id } });

      // Add new tags
      const productTagIdArr = tagIds.map((tag_id) => ({
        product_id: req.params.id,
        tag_id,
      }));
      await ProductTag.bulkCreate(productTagIdArr);
    }

    // Retrieve the updated product with its associations
    const updatedProduct = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        { model: Tag, through: ProductTag },
      ],
    });

    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating the product.' });
  }
});

// Delete a product by its ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.destroy({
      where: { id: req.params.id },
    });

    res.status(200).json(deletedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting the product.' });
  }
});

module.exports = router;
