import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 - Página no encontrada',
  description: 'La página que buscas no existe o ha sido movida.',
}

export default function NotFound() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1
        style={{
          fontSize: '8rem',
          fontWeight: 800,
          lineHeight: 1,
          margin: 0,
          background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: '1.75rem',
          fontWeight: 600,
          marginTop: '1rem',
          marginBottom: '0.5rem',
        }}
      >
        Página no encontrada
      </h2>
      <p
        style={{
          fontSize: '1.1rem',
          color: '#a1a1aa',
          maxWidth: '28rem',
          marginBottom: '2rem',
        }}
      >
        Lo sentimos, la página que buscas no existe o ha sido movida.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: 500,
          fontSize: '1rem',
          transition: 'background-color 0.2s',
        }}
      >
        Volver al inicio
      </Link>
    </main>
  )
}
