import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Obrigado from "./pages/Obrigado";
import LeadCheckout from "./pages/LeadCheckout";
import AdminUpload from "./pages/AdminUpload";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LeadCheckout />} />
      <Route path="/checkout" element={<LeadCheckout />} />
      <Route path="/admin/upload-staging" element={<AdminUpload />} />
      <Route path="/obrigado" element={<Obrigado />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;