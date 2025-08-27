import React from 'react';
import Header from './components/Header/Header';
import Products from './components/Products/Products';
import Footer from './components/Footer/Footer';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <Products />
      <Footer />
    </div>
  );
}

export default App;