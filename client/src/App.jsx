import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Campaigns from "./pages/Campaigns";
import Performance from "./pages/Performance";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/campaigns" element={<Campaigns />} />
      <Route path="/performance" element={<Performance />} />
    </Routes>
  );
};

export default App;