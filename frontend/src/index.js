import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/index.css";
import App from "@/App";
import PaymentSuccess from "@/PaymentSuccess";
import PrivacyPolicy from "@/PrivacyPolicy";
import TermsOfService from "@/TermsOfService";

// Suppress console in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/service-worker.js`).catch(() => {
    // ServiceWorker registration failed
  });
}

// GitHub Pages serves the app under /EN-SP-Transductor, so the router
// needs that path as its basename (empty when served from a domain root).
const basename = process.env.PUBLIC_URL
  ? new URL(process.env.PUBLIC_URL).pathname.replace(/\/$/, "")
  : "";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
