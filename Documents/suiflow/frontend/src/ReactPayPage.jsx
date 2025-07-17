import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactCheckout from './ReactCheckout';

export default function ReactPayPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  // Optionally, you can pass a callback to ReactCheckout to handle success/redirect
  // For now, ReactCheckout handles redirect internally if product.redirectURL exists

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <ReactCheckout productId={productId} />
    </div>
  );
} 