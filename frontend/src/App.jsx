function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-pink-700">
      {/* Header */}
      <header className="px-4 py-6">
        <nav className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Hoop Lab Gym</h1>
          <button className="text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="px-4 py-12">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-6xl">🔴</span>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4">
            Danza Aerea con il Cerchio
          </h2>
          
          <p className="text-lg text-purple-100 mb-8 max-w-md mx-auto">
            Scopri la magia della danza acrobatica con il cerchio aereo. 
            Lezioni per tutti i livelli.
          </p>

          <button className="bg-white text-purple-900 font-semibold px-8 py-4 rounded-full text-lg shadow-lg hover:bg-purple-100 transition-colors">
            Prenota una Lezione
          </button>
        </div>
      </main>

      {/* Features */}
      <section className="px-4 py-12">
        <div className="grid gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <span className="text-4xl mb-4 block">💪</span>
            <h3 className="text-xl font-semibold text-white mb-2">Forza & Flessibilità</h3>
            <p className="text-purple-200">Allena corpo e mente con movimenti eleganti</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <span className="text-4xl mb-4 block">🎭</span>
            <h3 className="text-xl font-semibold text-white mb-2">Espressione Artistica</h3>
            <p className="text-purple-200">Libera la tua creatività attraverso il movimento</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <span className="text-4xl mb-4 block">👥</span>
            <h3 className="text-xl font-semibold text-white mb-2">Community</h3>
            <p className="text-purple-200">Entra a far parte della nostra famiglia</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center">
        <p className="text-purple-200 text-sm">
          © 2026 Hoop Lab Gym. Tutti i diritti riservati.
        </p>
      </footer>
    </div>
  )
}

export default App
