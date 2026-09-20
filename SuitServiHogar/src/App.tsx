import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Currency, EscrowOrder, ScreenId, ServiceCategory, Technician } from './types';
import { INITIAL_ORDER } from './data/mockData';
import { fetchCategories } from './services/categoryService';
import { fetchTechnicians } from './services/technicianService';
import { getCurrentUser, signOut, getTechnicianByEmail } from './services/authService';
import { updateOrderStatus } from './services/bookingService';
import { stripePromise } from './lib/stripe';
import { supabase } from './lib/supabase';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/screens/HomeScreen';
import { ExploreScreen } from './components/screens/ExploreScreen';
import { BookingEscrowScreen } from './components/screens/BookingEscrowScreen';
import { ProPortalScreen } from './components/screens/ProPortalScreen';
import { SettlementEscrowScreen } from './components/screens/SettlementEscrowScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { FeedbackWidget } from './components/FeedbackWidget';
import { OnlineStatusBanner } from './components/OnlineStatusBanner';
import { TechnicianOrdersScreen } from './components/screens/TechnicianOrdersScreen';
import { ChatScreen } from './components/screens/ChatScreen';
import { ReviewScreen } from './components/screens/ReviewScreen';
import { GlossaryScreen } from './components/screens/GlossaryScreen';
import { AdminScreen } from './components/screens/AdminScreen';
import { PrivacyPolicyScreen } from './components/screens/PrivacyPolicyScreen';
import { TermsScreen } from './components/screens/TermsScreen';
import { TechnicianProfileModal } from './components/modals/TechnicianProfileModal';
import { ColoniaSelectorModal } from './components/modals/ColoniaSelectorModal';
import { ScheduleVisitModal } from './components/modals/ScheduleVisitModal';
import { PaymentSuccessModal } from './components/modals/PaymentSuccessModal';
import { RulesModal } from './components/modals/RulesModal';
import { useDevAuth } from './hooks/useDevAuth';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('inicio');
  const [previousScreen, setPreviousScreen] = useState<ScreenId>('inicio');
  const [selectedColonia, setSelectedColonia] = useState('Las Fuentes');
  const [currency, setCurrency] = useState<Currency>('MXN');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('climas');

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [currentTechnician, setCurrentTechnician] = useState<any>(null);

  // Data from Supabase
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Modals & Active Selections
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [currentOrder, setCurrentOrder] = useState<EscrowOrder>(INITIAL_ORDER);
  const [showColoniaModal, setShowColoniaModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingBookingTech, setPendingBookingTech] = useState<Technician | null>(null);

  // Chat state
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [chatOrderIdShort, setChatOrderIdShort] = useState('');
  const [chatCounterpartName, setChatCounterpartName] = useState('');
  const [chatUserRole, setChatUserRole] = useState<'client' | 'technician'>('client');

  // Review state
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [revieweeId, setRevieweeId] = useState('');
  const [revieweeName, setRevieweeName] = useState('');
  const [reviewUserRole, setReviewUserRole] = useState<'client' | 'technician'>('client');

  // Dev mode auto-login + seed
  const [loginLegalScreen, setLoginLegalScreen] = useState<'privacy' | 'terms' | null>(null);
  useDevAuth({
    setUser,
    setCurrentTechnician,
    setAuthLoading,
  });

  // Auth listener
  useEffect(() => {
    const isDevTech = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('tech');
    if (isDevTech) { setAuthLoading(false); return; }

    getCurrentUser().then(async (u) => {
      setUser(u);
      if (u?.email) {
        const tech = await getTechnicianByEmail(u.email);
        setCurrentTechnician(tech);
        setIsAdmin(tech?.role === 'admin');
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        const tech = await getTechnicianByEmail(session.user.email);
        setCurrentTechnician(tech);
        setIsAdmin(tech?.role === 'admin');
      } else {
        setCurrentTechnician(null);
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data from Supabase on mount
  useEffect(() => {
    const isDevTech = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('tech');
    if (isDevTech) { setDataLoading(false); return; }

    const loadData = async () => {
      setDataLoading(true);
      try {
        const [cats, techs] = await Promise.all([
          fetchCategories(),
          fetchTechnicians()
        ]);
        setCategories(cats);
        setTechnicians(techs);
      } catch (err) {
        console.error('Error loading data from Supabase:', err);
        showToast('Error al cargar datos. Usando datos de respaldo.');
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleNavigate = (newScreen: ScreenId) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(newScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (currentScreen === 'solicitud') {
      setCurrentScreen(previousScreen === 'solicitud' ? 'explorar' : previousScreen);
    } else if (currentScreen === 'escrow') {
      setCurrentScreen('inicio');
    } else if (currentScreen === 'chat') {
      setCurrentScreen(chatUserRole === 'technician' ? 'tecnico' : 'inicio');
      setChatOrderId(null);
    } else if (currentScreen === 'review') {
      setCurrentScreen('tecnico');
      setReviewOrderId(null);
    } else if (currentScreen === 'glossary') {
      setCurrentScreen('perfil');
    } else if (currentScreen === 'admin') {
      setCurrentScreen('perfil');
    } else if (currentScreen === 'privacy' || currentScreen === 'terms') {
      setCurrentScreen('inicio');
    }
  };

  const handleBookTechnician = (tech: Technician) => {
    if (!user) {
      setPendingBookingTech(tech);
      setShowLoginScreen(true);
      return;
    }
    setPendingBookingTech(null);
    setCurrentOrder((prev) => ({
      ...prev,
      technician: tech,
      serviceTitle: tech.tags[0] ? `${tech.tags[0]} - ${tech.title}` : prev.serviceTitle,
      basePriceMxn: tech.priceMxn,
      basePriceUsd: tech.priceUsd,
      totalMxn: tech.priceMxn,
      totalUsd: tech.priceUsd
    }));
    setPreviousScreen(currentScreen);
    setCurrentScreen('solicitud');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaySuccess = async () => {
    try {
      await updateOrderStatus(currentOrder.id, 'funded');
    } catch (err) {
      console.error('Error updating order status:', err);
    }
    setCurrentOrder((prev) => ({ ...prev, status: 'funded' }));
    setShowPaymentSuccessModal(true);
  };

  const handlePayError = (msg: string) => {
    showToast(msg);
  };

  const handlePay = async () => {
    if (!stripePromise) {
      handlePayError('Stripe no disponible');
      return;
    }
    const stripe = await stripePromise;
    if (!stripe) {
      handlePayError('No se pudo cargar Stripe');
      return;
    }
    const { error } = await stripe.confirmCardPayment(
      currentOrder.clientSecret || '',
      { payment_method: { card: null } }
    );
    if (error) {
      handlePayError(error.message || 'Error al procesar el pago');
    } else {
      handlePaySuccess();
    }
  };

  const formatMxnUsd = (mxn: number, usd: number) => {
    if (currency === 'USD') {
      return `$${usd.toFixed(2)} USD (~$${mxn.toFixed(2)} MXN)`;
    }
    return `$${mxn.toFixed(2)} MXN (~$${usd.toFixed(2)} USD)`;
  };

  if (authLoading) {
    return (
      <Elements stripe={stripePromise}>
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-body-md text-text-muted">Cargando...</p>
          </div>
        </div>
      </Elements>
    );
  }

  if (showLoginScreen) {
    return (
      <Elements stripe={stripePromise}>
        {loginLegalScreen === 'privacy' ? (
          <PrivacyPolicyScreen onBack={() => setLoginLegalScreen(null)} />
        ) : loginLegalScreen === 'terms' ? (
          <TermsScreen onBack={() => setLoginLegalScreen(null)} />
        ) : (
          <LoginScreen
            onLoginSuccess={(isGuest) => {
              setShowLoginScreen(false);
              if (isGuest || pendingBookingTech) handleBookTechnician(pendingBookingTech!);
            }}
            onNavigate={(screen) => setLoginLegalScreen(screen)}
          />
        )}
      </Elements>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-surface flex flex-col">
        <Header
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          user={user}
          technician={currentTechnician}
          isAdmin={isAdmin}
          onLogout={async () => {
            await signOut();
            setUser(null);
            setCurrentTechnician(null);
            setIsAdmin(false);
            setCurrentScreen('inicio');
          }}
          currency={currency}
          onCurrencyChange={setCurrency}
        />

        <main className="flex-1 pb-20 overflow-y-auto">
          {showColoniaModal && (
            <ColoniaSelectorModal
              selectedColonia={selectedColonia}
              onSelect={setSelectedColonia}
              onClose={() => setShowColoniaModal(false)}
            />
          )}

          {!dataLoading && currentScreen === 'inicio' && (
            <HomeScreen
              onNavigate={handleNavigate}
              selectedColonia={selectedColonia}
              onColoniaChange={setSelectedColonia}
              currency={currency}
              technicians={technicians}
              categories={categories}
            />
          )}

          {!dataLoading && currentScreen === 'explorar' && (
            <ExploreScreen
              technicians={technicians}
              categories={categories}
              selectedCategory={selectedCategoryFilter}
              onCategoryChange={setSelectedCategoryFilter}
              onBookTechnician={handleBookTechnician}
              currency={currency}
              onNavigate={handleNavigate}
            />
          )}

          {!dataLoading && currentScreen === 'solicitud' && (
            <BookingEscrowScreen
              order={currentOrder}
              currency={currency}
              onPaySuccess={handlePaySuccess}
              onPayError={handlePayError}
              onBack={handleBack}
              onShowRules={() => setShowRulesModal(true)}
              stripeAccountId={currentTechnician?.stripeAccountId}
              userId={user?.id}
            />
          )}

          {!dataLoading && currentScreen === 'perfil' && (
            <ProPortalScreen
              onScheduleVisit={() => setShowScheduleModal(true)}
              onUploadDoc={() => showToast('Abriendo selector de archivos para constancia DC-3 / INE...')}
              onWhatsAppHelp={() => showToast('Conectando con mesa de ayuda Reynosa (+52 899)...')}
              onNavigate={handleNavigate}
              isTechnician={!!currentTechnician}
            />
          )}

          {!dataLoading && currentScreen === 'escrow' && (
            <SettlementEscrowScreen
              onBack={handleBack}
              onDownloadPdf={() => showToast('Descargando Comprobante Fiscal CFDI 4.0 en PDF...')}
              onDownloadXml={() => showToast('Descargando XML timbrado ante el SAT...')}
              onViewMonthlyEarnings={() => showToast('Cargando corte acumulado del mes (Octubre 2024)...')}
              onAskClarification={() => showToast('Mesa de mediación fiscal abierta con soporte Reynosa.')}
              onShare={handleNavigate}
            />
          )}

          {!dataLoading && currentScreen === 'tecnico' && !currentTechnician && (
            <div className="text-center py-20 space-y-4">
              <span className="material-symbols-outlined text-5xl text-text-muted opacity-40">lock</span>
              <p className="text-body-md text-text-muted font-medium">
                Esta sección es solo para técnicos aliados verificados.
              </p>
              <button onClick={handleBack} className="text-primary font-bold text-label-md">
                Volver
              </button>
            </div>
          )}

          {!dataLoading && currentScreen === 'tecnico' && currentTechnician && (
            <TechnicianOrdersScreen
              technician={currentTechnician}
              onBack={handleBack}
              onOpenChat={(orderId, orderIdShort, clientName) => {
                setChatOrderId(orderId);
                setChatOrderIdShort(orderIdShort);
                setChatCounterpartName(clientName);
                setChatUserRole('technician');
                setCurrentScreen('chat');
              }}
              onReview={(orderId, revId, revName, role) => {
                setReviewOrderId(orderId);
                setRevieweeId(revId);
                setRevieweeName(revName);
                setReviewUserRole(role);
                setCurrentScreen('review');
              }}
            />
          )}

          {!dataLoading && currentScreen === 'chat' && chatOrderId && (
            <ChatScreen
              orderId={chatOrderId}
              orderIdShort={chatOrderIdShort}
              counterpartName={chatCounterpartName}
              userRole={chatUserRole}
              userId={user?.id || chatUserRole === 'technician' ? 'tech-dev-1' : 'client-dev-1'}
              onBack={handleBack}
              orderTotalMxn={currentOrder.totalMxn}
            />
          )}

          {!dataLoading && currentScreen === 'review' && reviewOrderId && user && (
            <ReviewScreen
              orderId={reviewOrderId}
              revieweeId={revieweeId}
              reviewerId={user.id}
              reviewerRole={reviewUserRole}
              revieweeName={revieweeName}
              onBack={() => {
                setCurrentScreen('tecnico');
                setReviewOrderId(null);
              }}
            />
          )}

          {!dataLoading && currentScreen === 'glossary' && (
            <GlossaryScreen onBack={handleBack} />
          )}

          {!dataLoading && currentScreen === 'admin' && isAdmin && (
            <AdminScreen onBack={handleBack} />
          )}

          {!dataLoading && currentScreen === 'privacy' && (
            <PrivacyPolicyScreen onBack={handleBack} />
          )}

          {!dataLoading && currentScreen === 'terms' && (
            <TermsScreen onBack={handleBack} />
          )}
        </main>

        {currentScreen !== 'chat' && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
          />
        )}

        {showColoniaModal && (
          <ColoniaSelectorModal
            selectedColonia={selectedColonia}
            onSelect={setSelectedColonia}
            onClose={() => setShowColoniaModal(false)}
          />
        )}

        {showScheduleModal && (
          <ScheduleVisitModal
            onClose={() => setShowScheduleModal(false)}
            onScheduled={(date, time) => {
              setShowScheduleModal(false);
              showToast(`¡Visita de auditoría física agendada para el ${date} en horario ${time}!`);
            }}
          />
        )}

        {showPaymentSuccessModal && (
          <PaymentSuccessModal
            order={currentOrder}
            onViewSettlement={() => {
              setShowPaymentSuccessModal(false);
              handleNavigate('escrow');
            }}
            onClose={() => {
              setShowPaymentSuccessModal(false);
              handleNavigate('inicio');
            }}
            onOpenChat={() => {
              setShowPaymentSuccessModal(false);
              setChatOrderId(currentOrder.id);
              setChatOrderIdShort(currentOrder.id.slice(-6));
              setChatCounterpartName(currentOrder.technician.name);
              setChatUserRole('client');
              setCurrentScreen('chat');
            }}
            onReview={() => {
              setShowPaymentSuccessModal(false);
              setReviewOrderId(currentOrder.id);
              setRevieweeId(currentOrder.technician.id);
              setRevieweeName(currentOrder.technician.name);
              setReviewUserRole('client');
              setCurrentScreen('review');
            }}
          />
        )}

        {showRulesModal && (
          <RulesModal onClose={() => setShowRulesModal(false)} />
        )}

        <OnlineStatusBanner heartbeatUrl="/" heartbeatInterval={30000} />
        <FeedbackWidget />
      </div>
    </Elements>
  );
}