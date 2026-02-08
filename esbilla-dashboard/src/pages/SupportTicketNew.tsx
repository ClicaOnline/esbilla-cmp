import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SupportTicketCategory, SupportTicketPriority } from '../types';

export function SupportTicketNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userData } = useAuth();

  const [category, setCategory] = useState<SupportTicketCategory>('other');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportTicketPriority>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill based on reason
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'limbo') {
      setCategory('access');
      setSubject('Cuenta en estado limbo - Requiere configuración');
      setDescription('Mi cuenta tiene permisos asignados pero no puedo acceder al dashboard. El sistema indica que mi cuenta está en estado limbo y necesita configuración adicional.');
      setPriority('high');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!db || !user || !userData) return;

    setLoading(true);
    setError(null);

    try {
      // Get organization info if user has access
      const orgId = userData.orgAccess ? Object.keys(userData.orgAccess)[0] : undefined;
      const orgName = orgId && userData.orgAccess?.[orgId]?.organizationName;

      await addDoc(collection(db, 'supportTickets'), {
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || 'Usuario sin nombre',
        organizationId: orgId || null,
        organizationName: orgName || null,
        category,
        subject,
        description,
        status: 'open',
        priority,
        assignedTo: null,
        assignedToName: null,
        resolvedAt: null,
        resolvedBy: null,
        closedAt: null,
        notes: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate('/support?created=true');
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Error al crear el ticket. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/support')}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-800 mb-4"
          >
            <ArrowLeft size={18} />
            Volver a tickets
          </button>
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="text-amber-500" size={32} />
            <h1 className="text-3xl font-artesana text-madera">Nuevo Ticket de Soporte</h1>
          </div>
          <p className="text-stone-600">
            Describe tu problema o solicitud y te ayudaremos lo antes posible
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Categoría *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
            >
              <option value="access">Acceso y permisos</option>
              <option value="billing">Facturación y pagos</option>
              <option value="technical">Problema técnico</option>
              <option value="feature_request">Solicitud de funcionalidad</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Prioridad *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as SupportTicketPriority)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
            >
              <option value="low">Baja - Consulta general</option>
              <option value="medium">Media - Problema no urgente</option>
              <option value="high">Alta - Afecta al uso normal</option>
              <option value="urgent">Urgente - Sistema no funciona</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Asunto *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Breve descripción del problema"
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
              maxLength={200}
            />
            <p className="text-xs text-stone-500 mt-1">{subject.length}/200 caracteres</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Descripción detallada *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu problema o solicitud con el mayor detalle posible..."
              rows={8}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-y"
              required
              maxLength={2000}
            />
            <p className="text-xs text-stone-500 mt-1">{description.length}/2000 caracteres</p>
          </div>

          {/* User info */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg">
            <p className="text-xs text-stone-600 mb-2">
              <strong>Información del ticket:</strong>
            </p>
            <p className="text-xs text-stone-600">Usuario: {user.displayName} ({user.email})</p>
            {userData?.orgAccess && Object.keys(userData.orgAccess).length > 0 && (
              <p className="text-xs text-stone-600">
                Organización: {Object.values(userData.orgAccess)[0]?.organizationName || 'N/A'}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/support')}
              className="px-6 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creando ticket...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Crear Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
