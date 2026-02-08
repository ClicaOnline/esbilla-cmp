import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100">
      <div className="max-w-2xl mx-4 text-center">
        {/* Corn Emoji Animation */}
        <div className="mb-8 relative">
          <div className="text-9xl animate-bounce">🌽</div>
          <div className="absolute -top-4 -right-4 text-6xl animate-spin-slow opacity-50">🌪️</div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-8xl font-black text-amber-600 mb-2">404</h1>
          <p className="text-2xl font-bold text-stone-800 mb-2">
            ¡Ayyyy, que nun s'alcuentra esta panoya! 🌽
          </p>
          <p className="text-lg text-stone-600">
            (No encontramos esta página)
          </p>
        </div>

        {/* Funny Message */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl mb-8 border-2 border-amber-200">
          <p className="text-lg text-stone-700 mb-4">
            Parece que esta página se fue a <span className="font-bold text-amber-600">esbillar el maíz</span>
            {' '}y aún no volvió del campo...
          </p>
          <p className="text-sm text-stone-500 italic">
            "Nun ta equí, probablemente ta en La Quintana" 🏔️
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <p className="text-stone-600 font-medium mb-6">
            ¿Qué quieres hacer?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors font-medium shadow-lg"
            >
              <ArrowLeft size={20} />
              Volver atrás
            </button>

            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium shadow-lg"
            >
              <Home size={20} />
              Ir al Dashboard
            </button>

            <button
              onClick={() => navigate('/sites')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-lg"
            >
              <Search size={20} />
              Ver mis sitios
            </button>
          </div>
        </div>

        {/* Footer Fun Fact */}
        <div className="mt-12 text-xs text-stone-500">
          <p className="mb-2">💡 <strong>¿Sabías que...?</strong></p>
          <p className="italic">
            "Esbillar" en asturiano significa quitar las hojas del maíz.
            <br />
            Y "panoya" es la mazorca. ¡Ahora ya lo sabes! 🌽
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
