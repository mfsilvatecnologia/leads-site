import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Obrigado from "./pages/Obrigado";
import LeadCheckout from "./pages/LeadCheckout";
import AdminUpload from "./pages/AdminUpload";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LeadCheckout />} />
      <Route path="/checkout" element={<LeadCheckout />} />
      <Route path="/termos-de-uso" element={<TermosDeUso />} />
      <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
      <Route path="/admin/upload-staging" element={<AdminUpload />} />
      <Route path="/obrigado" element={<Obrigado />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;