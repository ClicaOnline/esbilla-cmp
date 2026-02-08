import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { MessageCircle, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SupportTicket } from '../types';

export function SupportTicketsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isSuperAdmin } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowSuccess(true);
      // Remove query param
      navigate('/support', { replace: true });
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (!user || !db) return;
    loadTickets();
  }, [user]);

  async function loadTickets() {
    if (!db || !user) return;

    try {
      setLoading(true);

      let q;
      if (isSuperAdmin) {
        // Superadmins see all tickets
        q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
      } else {
        // Regular users see only their tickets
        q = query(
          collection(db, 'supportTickets'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const ticketList: SupportTicket[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        ticketList.push({
          id: doc.id,
          userId: data.userId,
          userEmail: data.userEmail,
          userName: data.userName,
          organizationId: data.organizationId,
          organizationName: data.organizationName,
          category: data.category,
          subject: data.subject,
          description: data.description,
          status: data.status,
          priority: data.priority,
          assignedTo: data.assignedTo,
          assignedToName: data.assignedToName,
          resolvedAt: data.resolvedAt?.toDate(),
          resolvedBy: data.resolvedBy,
          closedAt: data.closedAt?.toDate(),
          notes: data.notes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      setTickets(ticketList);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: SupportTicket['status']) {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} className="text-blue-500" />;
      case 'in_progress':
        return <Clock size={16} className="text-amber-500" />;
      case 'resolved':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'closed':
        return <XCircle size={16} className="text-stone-400" />;
    }
  }

  function getStatusLabel(status: SupportTicket['status']) {
    const labels = {
      open: 'Abierto',
      in_progress: 'En progreso',
      resolved: 'Resuelto',
      closed: 'Cerrado',
    };
    return labels[status];
  }

  function getPriorityBadge(priority: SupportTicket['priority']) {
    const classes = {
      low: 'bg-stone-100 text-stone-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${classes[priority]}`}>
        {labels[priority]}
      </span>
    );
  }

  function getCategoryLabel(category: SupportTicket['category']) {
    const labels = {
      access: 'Acceso',
      billing: 'Facturación',
      technical: 'Técnico',
      feature_request: 'Funcionalidad',
      other: 'Otro',
    };
    return labels[category];
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="text-amber-500" size={32} />
              <h1 className="text-3xl font-artesana text-madera">Tickets de Soporte</h1>
            </div>
            <p className="text-stone-600">
              {isSuperAdmin
                ? 'Gestiona todos los tickets de soporte'
                : 'Tus solicitudes de ayuda y soporte'}
            </p>
          </div>
          <button
            onClick={() => navigate('/support/new')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus size={18} />
            Nuevo Ticket
          </button>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <CheckCircle size={18} />
            <span>Ticket creado correctamente. Te responderemos lo antes posible.</span>
          </div>
        )}

        {/* Tickets list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            <p className="text-stone-600 mt-4">Cargando tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <MessageCircle size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-medium text-stone-800 mb-2">No hay tickets</h3>
            <p className="text-stone-600 mb-4">
              {isSuperAdmin
                ? 'No hay tickets de soporte creados'
                : 'Aún no has creado ningún ticket de soporte'}
            </p>
            {!isSuperAdmin && (
              <button
                onClick={() => navigate('/support/new')}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Crear primer ticket
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-xl border border-stone-200 p-6 hover:border-amber-300 transition-colors cursor-pointer"
                onClick={() => navigate(`/support/${ticket.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(ticket.status)}
                      <h3 className="font-medium text-stone-800">{ticket.subject}</h3>
                    </div>
                    <p className="text-sm text-stone-600 line-clamp-2 mb-3">
                      {ticket.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      <span className="px-2 py-1 bg-stone-100 rounded">
                        {getCategoryLabel(ticket.category)}
                      </span>
                      {getPriorityBadge(ticket.priority)}
                      <span className="flex items-center gap-1">
                        {getStatusIcon(ticket.status)}
                        {getStatusLabel(ticket.status)}
                      </span>
                      {isSuperAdmin && (
                        <>
                          <span>•</span>
                          <span>{ticket.userName} ({ticket.userEmail})</span>
                        </>
                      )}
                      {ticket.organizationName && (
                        <>
                          <span>•</span>
                          <span>{ticket.organizationName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-stone-500">
                    <p>{ticket.createdAt.toLocaleDateString()}</p>
                    <p>{ticket.createdAt.toLocaleTimeString()}</p>
                  </div>
                </div>

                {ticket.assignedToName && (
                  <div className="mt-3 pt-3 border-t border-stone-100 text-xs text-stone-600">
                    Asignado a: <span className="font-medium">{ticket.assignedToName}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
