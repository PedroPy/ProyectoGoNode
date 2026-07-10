import { useState } from 'react'
import axios from 'axios'
import { Activity, Grid2X2, RotateCw, Calculator, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react'
import './index.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [matrixInput, setMatrixInput] = useState('[\n  [1, 2, 3],\n  [4, 5, 6],\n  [7, 8, 9]\n]')
  const [rotated, setRotated] = useState(null)
  const [qrHouseholder, setQrHouseholder] = useState(null)
  const [qrGramSchmidt, setQrGramSchmidt] = useState(null)
  const [qrGivens, setQrGivens] = useState(null)
  const [statsHouseholder, setStatsHouseholder] = useState(null)
  const [statsGramSchmidt, setStatsGramSchmidt] = useState(null)
  const [statsGivens, setStatsGivens] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:4000/api/auth/login')
      setToken(res.data.token)
      localStorage.setItem('token', res.data.token)
      setError(null)
    } catch (err) {
      setError('Error al iniciar sesión')
    }
  }

  const handleLogout = () => {
    setToken('')
    localStorage.removeItem('token')
    setRotated(null)
    setQrHouseholder(null)
    setQrGramSchmidt(null)
    setQrGivens(null)
    setStatsHouseholder(null)
    setStatsGramSchmidt(null)
    setStatsGivens(null)
  }

  const processMatrix = async () => {
    if (!token) {
      setError('Debes iniciar sesión primero')
      return
    }

    setLoading(true)
    setError(null)
    setRotated(null)
    setQrHouseholder(null)
    setQrGramSchmidt(null)
    setQrGivens(null)
    setStatsHouseholder(null)
    setStatsGramSchmidt(null)
    setStatsGivens(null)

    try {
      const parsedMatrix = JSON.parse(matrixInput)
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }

      // 1. Enviar la matriz a los 3 endpoints de QR
      const reqHouseholder = axios.post('http://localhost:3000/api/matrix/qrHouseholder', { matrix: parsedMatrix }, config)
      const reqGramSchmidt = axios.post('http://localhost:3000/api/matrix/qrGramSchmidt', { matrix: parsedMatrix }, config)
      const reqGivens = axios.post('http://localhost:3000/api/matrix/qrGivens', { matrix: parsedMatrix }, config)

      const [resHouseholder, resGramSchmidt, resGivens] = await Promise.all([reqHouseholder, reqGramSchmidt, reqGivens])
      
      // Extraemos resultados
      setRotated(resHouseholder.data.Rotada)
      setQrHouseholder({ q: resHouseholder.data.q, r: resHouseholder.data.r })
      setQrGramSchmidt({ q: resGramSchmidt.data.q, r: resGramSchmidt.data.r })
      setQrGivens({ q: resGivens.data.q, r: resGivens.data.r })

      // 2. Enviar a Node para estadísticas para cada método
      const reqStatsHouseholder = axios.post('http://localhost:4000/api/stats', { matrices: [resHouseholder.data.q, resHouseholder.data.r] }, config)
      const reqStatsGramSchmidt = axios.post('http://localhost:4000/api/stats', { matrices: [resGramSchmidt.data.q, resGramSchmidt.data.r] }, config)
      const reqStatsGivens = axios.post('http://localhost:4000/api/stats', { matrices: [resGivens.data.q, resGivens.data.r] }, config)

      const [statsResHouseholder, statsResGramSchmidt, statsResGivens] = await Promise.all([reqStatsHouseholder, reqStatsGramSchmidt, reqStatsGivens])
      
      setStatsHouseholder(statsResHouseholder.data)
      setStatsGramSchmidt(statsResGramSchmidt.data)
      setStatsGivens(statsResGivens.data)

    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || err.message || 'Error al procesar la matriz. Verifica el formato JSON.')
    } finally {
      setLoading(false)
    }
  }

  const renderStatsCard = (statsData, title, colorClass) => (
    <div className="glass p-6 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Activity className={`w-5 h-5 ${colorClass}`} />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      
      {statsData ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Valor Máximo</div>
            <div className="text-2xl font-bold text-white">{statsData.max.toFixed(4)}</div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden group hover:border-blue-500/50 transition-colors">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Valor Mínimo</div>
            <div className="text-2xl font-bold text-white">{statsData.min.toFixed(4)}</div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Suma Total</div>
            <div className="text-2xl font-bold text-white">{statsData.sum.toFixed(4)}</div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
            <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Promedio</div>
            <div className="text-2xl font-bold text-white">{statsData.average.toFixed(4)}</div>
          </div>
          <div className="col-span-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
            <div className="text-sm text-slate-300 flex items-center gap-2">
              ¿Alguna matriz resultante es diagonal?
            </div>
            {statsData.isDiagonal ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Sí
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-semibold">
                No
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-[200px] border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500 text-sm">
          Procesa una matriz para ver estadísticas
        </div>
      )}
    </div>
  )

  const renderMatrix = (matrix) => {
    if (!matrix || !Array.isArray(matrix)) return null;
    return (
      <div className="grid gap-2 mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        {matrix.map((row, i) => (
          <div key={i} className="flex gap-2">
            {row.map((val, j) => (
              <div key={j} className="w-16 h-12 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-lg text-sm text-blue-400 font-mono shadow-inner">
                {typeof val === 'number' ? val.toFixed(2) : val}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black p-4 md:p-8 text-slate-200">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header / Auth */}
        <div className="glass p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                Procesador de Matrices
              </h1>
              <p className="text-sm text-slate-400">Arquitectura Go + Node + React</p>
            </div>
          </div>
          <div>
            {!token ? (
              <button onClick={handleLogin} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20 hover:scale-105">
                <LogIn className="w-4 h-4" />
                Iniciar Sesión (Demo)
              </button>
            ) : (
              <div className="flex items-center gap-6 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm text-emerald-400 font-medium">Autenticado</span>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="glass border-red-500/30 bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Input Section */}
        <div className="glass p-6 rounded-2xl space-y-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Grid2X2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Matriz de Entrada</h2>
          </div>
          <textarea 
            className="w-full flex-grow min-h-[200px] p-4 font-mono text-sm bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-blue-300 resize-none shadow-inner"
            value={matrixInput}
            onChange={(e) => setMatrixInput(e.target.value)}
            spellCheck="false"
          />
          <button 
            onClick={processMatrix}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3.5 rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Calculator className="w-5 h-5" />
            )}
            {loading ? 'Calculando...' : 'Procesar Matriz'}
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {renderStatsCard(statsHouseholder, 'Estadísticas Node.js - Householder', 'text-blue-400')}
          {renderStatsCard(statsGramSchmidt, 'Estadísticas Node.js - Gram-Schmidt', 'text-purple-400')}
          {renderStatsCard(statsGivens, 'Estadísticas Node.js - Givens', 'text-orange-400')}
        </div>

        {/* Householder Result */}
        {(rotated && qrHouseholder) && (
          <div className="glass p-6 rounded-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 border-b border-slate-700/50 pb-4">
              <RotateCw className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Factorización Householder</h2>
            </div>
            <div className="grid xl:grid-cols-3 gap-6 overflow-x-auto pb-2">
              <div className="min-w-fit">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Matriz Rotada (90°)</h3>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Resultado</span>
                </div>
                {renderMatrix(rotated)}
              </div>
              <div className="min-w-fit">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Factorización Q</h4>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">Ortogonal</span>
                </div>
                {renderMatrix(qrHouseholder.q)}
              </div>
              <div className="min-w-fit">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Factorización R</h4>
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded">Triangular Sup.</span>
                </div>
                {renderMatrix(qrHouseholder.r)}
              </div>
            </div>
          </div>
        )}

        {/* Gram-Schmidt Result */}
        {(rotated && qrGramSchmidt) && (
          <div className="glass p-6 rounded-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex items-center gap-2 border-b border-slate-700/50 pb-4">
              <RotateCw className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Factorización Gram-Schmidt</h2>
            </div>
            <div className="grid xl:grid-cols-3 gap-6 overflow-x-auto pb-2">
              <div className="min-w-fit">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Matriz Rotada (90°)</h3>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Resultado</span>
                </div>
                {renderMatrix(rotated)}
              </div>
              <div className="min-w-fit">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Factorización Q</h4>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">Ortogonal</span>
                </div>
                {renderMatrix(qrGramSchmidt.q)}
              </div>
              <div className="min-w-fit">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Factorización R</h4>
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded">Triangular Sup.</span>
                </div>
                {renderMatrix(qrGramSchmidt.r)}
              </div>
            </div>
          </div>
        )}

        {/* Givens Result */}
        {(rotated && qrGivens) && (
          <div className="glass p-6 rounded-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="flex items-center gap-2 border-b border-slate-700/50 pb-4">
              <RotateCw className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-bold text-white">Factorización Givens</h2>
            </div>
            <div className="grid xl:grid-cols-3 gap-6 overflow-x-auto pb-2">
              <div className="min-w-fit">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Matriz Rotada (90°)</h3>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">Resultado</span>
                </div>
                {renderMatrix(rotated)}
              </div>
              <div className="min-w-fit">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Factorización Q</h4>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">Ortogonal</span>
                </div>
                {renderMatrix(qrGivens.q)}
              </div>
              <div className="min-w-fit">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Factorización R</h4>
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded">Triangular Sup.</span>
                </div>
                {renderMatrix(qrGivens.r)}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
