import React from 'react';
import './Products.css';
import hazelnutImage from '../../assets/hazelnut-coffee.jpeg';
import frenchVanillaImage from '../../assets/french-vanilla-coffee.jpeg';

const Products = () => {
  const products = [
    {
      name: 'Hazelnut Coffee',
      description: 'Rich and nutty flavor with smooth finish',
      image: hazelnutImage
    },
    {
      name: 'French Vanilla Coffee',
      description: 'Sweet and creamy with classic vanilla notes',
      image: frenchVanillaImage
    }
  ];

  return (
    <section className="products">
      <h2>Our Signature Blends</h2>
      <div className="products-grid">
        {products.map((product, index) => (
          <div key={index} className="product-card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Products;