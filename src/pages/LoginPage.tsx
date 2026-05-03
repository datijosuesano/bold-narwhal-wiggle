// ... (garde tes imports actuels)

const LoginPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  // ... (tes autres states email, password, etc.)

  // Redirection stable après chargement
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) showError(`Erreur: ${error.message}`);
      // La redirection est gérée automatiquement par le useEffect ci-dessus
    } catch (err) {
      showError("Erreur de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (user) return null; // Le useEffect s'occupe de la redirection

  return (
    // ... (garde ton code de design de la carte de login)
  );
};