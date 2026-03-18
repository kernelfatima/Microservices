import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Hitting the API Gateway

export default function Products({ token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });
  const [showAdd, setShowAdd] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      // 🚀 VERY IMPORTANT: Notice how we MUST pass the secure JWT Bearer token here
      // because our API Gateway actively blocks POST requests to /products missing a token!
      await axios.post(`${API_URL}/products`, newProduct, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewProduct({ name: '', price: '', description: '' });
      setShowAdd(false);
      fetchProducts(); // Refresh list immediately
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding product - Auth failed?');
    }
  };

  if (loading) return <h2 style={{textAlign: 'center', marginTop: '3rem'}}>Crunching data from the cloud...</h2>;

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Product Catalog</h1>
        <button className="btn" style={{width: 'auto'}} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Nevermind' : '+ Add Secure Product'}
        </button>
      </div>

      {showAdd && (
        <div className="glass-panel" style={{marginBottom: '2rem'}}>
          <h3>Add New Product (PROTECTED Microservice Route)</h3>
          <p style={{color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem'}}>Only securely authenticated tokens via JWT will let this form pass the Gateway.</p>
          <form onSubmit={handleAddProduct} style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <input className="input-field" style={{marginBottom: 0, flex: 2}} type="text" placeholder="Device Name" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} required/>
            <input className="input-field" style={{marginBottom: 0, flex: 1}} type="number" placeholder="Price $" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: e.target.value})} required/>
            <input className="input-field" style={{marginBottom: 0, flex: 3}} type="text" placeholder="Short description" value={newProduct.description} onChange={e=>setNewProduct({...newProduct, description: e.target.value})} required/>
            <button type="submit" className="btn" style={{width: 'auto', whiteSpace: 'nowrap'}}>Publish</button>
          </form>
        </div>
      )}

      <div className="products-grid">
        {products.length === 0 ? (
          <p style={{color: 'var(--text-muted)'}}>No products exist inside MongoDB yet. Add some!</p>
        ) : (
          products.map(product => (
            <div key={product._id} className="glass-panel product-card">
              <h3>{product.name}</h3>
              <div className="product-price">${product.price}</div>
              <p style={{color: 'var(--text-muted)'}}>{product.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
