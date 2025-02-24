const express = require('express');
const mongoose = require('mongoose');
const { Client } = require('@elastic/elasticsearch');
const Product = require('./models/Product');

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/elasticsearch-demo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'));

// ElasticSearch client
const elasticClient = new Client({ node: 'http://localhost:9200' });

// Index MongoDB data into ElasticSearch
const indexProduct = async (product) => {
  await elasticClient.index({
    index: 'products',
    id: product._id.toString(),
    body: {
      name: product.name,
      description: product.description,
      price: product.price,
    },
  });
};

// Create a new product and index it in ElasticSearch
app.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    // Index the product in ElasticSearch
    await indexProduct(product);

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search in ElasticSearch
app.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    const result = await elasticClient.search({
      index: 'products',
      query: {
        multi_match: {
          query,
          fields: ['name', 'description',],
        },
      },
    });

    res.json(result.hits.hits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
