import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <h3 className="footer-title">DeFi360</h3>
          <p className="footer-text">
            Plataforma educativa de préstamos DeFi con simulador avanzado de riesgo y liquidaciones.
          </p>
        </div>

        <div>
          <h4 className="footer-heading">Enlaces</h4>
          <ul className="footer-links">
            <li><a href="#">Inicio</a></li>
            <li><a href="#">Documentación</a></li>
            <li><a href="#">Contacto</a></li>
          </ul>
        </div>

        <div>
          <h4 className="footer-heading">Legal</h4>
          <ul className="footer-links">
            <li><a href="#">Privacidad</a></li>
            <li><a href="#">Términos</a></li>
            <li><a href="#">Aviso Legal</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} DeFi360 — Plataforma Educativa</p>
        <p className="footer-warning">⚠️ Entorno educativo. No se manejan fondos reales.</p>
      </div>
    </footer>
  );
}

export default Footer;
