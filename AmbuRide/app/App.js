import { useEffect, useState } from 'react';
import { supabase } from './src/lib/supabase';
import WelcomeScreen from './src/screens/WelcomeScreen';
import PhoneScreen from './src/screens/PhoneScreen';
import OtpScreen from './src/screens/OtpScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HomeScreen from './src/screens/HomeScreen';

// Solo 5 pantallas en el MVP: una state machine simple alcanza,
// no hace falta react-navigation todavía.
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando sesión
  const [hasProfile, setHasProfile] = useState(false);
  const [step, setStep] = useState('welcome'); // welcome | phone | otp
  const [phone, setPhone] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('usuarios')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setHasProfile(!!data));
  }, [session]);

  if (session === undefined) return null; // evita flash de la pantalla equivocada

  if (!session) {
    if (step === 'phone') {
      return (
        <PhoneScreen
          onCodeSent={(p) => {
            setPhone(p);
            setStep('otp');
          }}
          onBack={() => setStep('welcome')}
        />
      );
    }
    if (step === 'otp') {
      return <OtpScreen phone={phone} onBack={() => setStep('phone')} />;
    }
    return <WelcomeScreen onStart={() => setStep('phone')} />;
  }

  if (!hasProfile) {
    return <ProfileScreen userId={session.user.id} phone={session.user.phone} onDone={() => setHasProfile(true)} />;
  }

  return <HomeScreen />;
}
