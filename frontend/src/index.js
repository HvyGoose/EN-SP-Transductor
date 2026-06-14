import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/index.css";
import App from "@/App";
import PaymentSuccess from "@/PaymentSuccess";

// Suppress console in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => {
        // ServiceWorker registered successfully
      })
      .catch(() => {
        // ServiceWorker registration failed
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
