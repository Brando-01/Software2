function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: '#111827',
      color: '#ffffff',
      marginTop: 'auto',
      borderTop: '1px solid #1f2937'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '48px 32px 40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '48px'
      }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#ffffff' }}>DeFi360</h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.5', margin: 0 }}>Plataforma educativa de préstamos DeFi con simulador avanzado</p>
        </div>
        
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', color: '#9ca3af' }}>Enlaces</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#ffffff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}>Inicio</a></li>
            <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#ffffff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}>Documentación</a></li>
            <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#ffffff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}>Contacto</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', color: '#9ca3af' }}>Legal</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#ffffff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}>Privacidad</a></li>
            <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#ffffff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}>Términos</a></li>
            <li><a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '13px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#ffffff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}>Aviso Legal</a></li>
          </ul>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid #1f2937',
        padding: '20px 32px',
        textAlign: 'center',
        background: '#0f172a'
      }}>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0' }}>© {currentYear} DeFi360 - Plataforma Educativa</p>
        <p style={{ fontSize: '12px', color: '#fbbf24', margin: '4px 0' }}>⚠️ Este es un entorno educativo. No se manejan fondos reales.</p>
      </div>
    </footer>
  );
}

export default Footer;