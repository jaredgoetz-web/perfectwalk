import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Apple, Mail, MessageSquareText } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSignupDraft, type SignupDraft } from "@/lib/authDraft";
import { sendEmailOtp, sendPhoneOtp, startOAuth, useAuth, verifyEmailOtp, verifyPhoneOtp } from "@/lib/auth";

const goalOptions = [
  { value: "clarity", label: "More clarity" },
  { value: "confidence", label: "More confidence" },
  { value: "peace", label: "A calmer nervous system" },
  { value: "momentum", label: "Stronger momentum" },
];

const windowOptions: Array<{ value: SignupDraft["preferredWindow"]; label: string }> = [
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "evening", label: "Evening" },
  { value: "anytime", label: "Anytime" },
];

const durationOptions: Array<{ value: SignupDraft["walkDuration"]; label: string }> = [
  { value: "5-10", label: "5–10 min" },
  { value: "10-20", label: "10–20 min" },
  { value: "20+", label: "20+ min" },
];

const languageOptions = ["God", "Source", "Universe", "Higher Self", "Truth", "No preference"];

const AuthPage = () => {
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>(["clarity"]);
  const [preferredWindow, setPreferredWindow] = useState<SignupDraft["preferredWindow"]>("morning");
  const [walkDuration, setWalkDuration] = useState<SignupDraft["walkDuration"]>("10-20");
  const [spiritualLanguage, setSpiritualLanguage] = useState("Truth");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [pendingMethod, setPendingMethod] = useState<"email" | "phone" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
    setNotice(null);
  }, [step]);

  const draft = useMemo<SignupDraft>(
    () => ({ goals, preferredWindow, walkDuration, spiritualLanguage }),
    [goals, preferredWindow, walkDuration, spiritualLanguage],
  );

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const persistDraft = () => saveSignupDraft(draft);

  const toggleGoal = (value: string) => {
    setGoals((current) => {
      if (current.includes(value)) {
        if (current.length === 1) return current;
        return current.filter((goal) => goal !== value);
      }
      return [...current, value];
    });
  };

  const handleOAuth = async (provider: "apple" | "google") => {
    setSubmitting(true);
    setError(null);
    persistDraft();
    const { error: authError } = await startOAuth(provider);
    if (authError) {
      setError(authError.message);
      setSubmitting(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setSubmitting(true);
    setError(null);
    setNotice(null);
    persistDraft();
    const { error: authError } = await sendEmailOtp(email);
    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }
    setPendingMethod("email");
    setNotice("Check your email for a magic link or a one-time code. If you received a code, enter it below.");
    setSubmitting(false);
  };

  const handleVerifyEmailOtp = async () => {
    setSubmitting(true);
    setError(null);
    const { error: authError } = await verifyEmailOtp(email, emailOtp);
    if (authError) {
      setError(authError.message);
    }
    setSubmitting(false);
  };

  const handleSendPhoneOtp = async () => {
    setSubmitting(true);
    setError(null);
    setNotice(null);
    persistDraft();
    const { error: authError } = await sendPhoneOtp(phone);
    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }
    setPendingMethod("phone");
    setNotice("We sent a verification code to your phone.");
    setSubmitting(false);
  };

  const handleVerifyPhoneOtp = async () => {
    setSubmitting(true);
    setError(null);
    const { error: authError } = await verifyPhoneOtp(phone, phoneOtp);
    if (authError) {
      setError(authError.message);
    }
    setSubmitting(false);
  };

  const canContinue =
    (step === 0 && goals.length > 0) ||
    (step === 1 && Boolean(preferredWindow)) ||
    (step === 2 && Boolean(walkDuration)) ||
    step === 3;

  return (
    <div className="min-h-screen bg-[hsl(30_30%_97%)] px-5 py-8 text-foreground">
      <div className="mx-auto max-w-lg">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">The Perfect Walk</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight">
            Start with a few quick questions.
            <br />
            Then save your practice for good.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
            The highest-converting apps in this category personalize first, then ask for the account once the value is clear.
            We’re using that same pattern here.
          </p>
        </motion.div>

        <div className="mt-8 flex gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all ${index <= step ? "bg-primary" : "bg-primary/15"}`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-8 rounded-[28px] bg-card p-6 shadow-elevated"
        >
          {step === 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Question 1 of 4</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">What do you want more of from your walks?</h2>
              <div className="mt-5 grid gap-3">
                {goalOptions.map((option) => {
                  const selected = goals.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleGoal(option.value)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        selected ? "border-primary bg-primary/8 text-primary" : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm text-muted-foreground">Question 2 of 4</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">When do you most want support?</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {windowOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPreferredWindow(option.value)}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      preferredWindow === option.value ? "border-primary bg-primary/8 text-primary" : "border-border bg-background hover:border-primary/30"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-muted-foreground">Question 3 of 4</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">What kind of walk fits your real life?</h2>
              <div className="mt-5 grid gap-3">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setWalkDuration(option.value)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      walkDuration === option.value ? "border-primary bg-primary/8 text-primary" : "border-border bg-background hover:border-primary/30"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-sm text-muted-foreground">What language feels right for the divine during your walk?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {languageOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSpiritualLanguage(option)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      spiritualLanguage === option ? "border-primary bg-primary/8 text-primary" : "border-border bg-background hover:border-primary/30"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm text-muted-foreground">Create your account</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Save your progress across every device.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                We’ll save your streak, guided prompts, coach context, and walk history to your account.
              </p>

              <div className="mt-6 grid gap-3">
                <Button type="button" variant="outline" className="h-12 justify-start rounded-2xl" onClick={() => void handleOAuth("apple")} disabled={submitting}>
                  <Apple className="mr-2 h-4 w-4" />
                  Continue with Apple
                </Button>
                <Button type="button" variant="outline" className="h-12 justify-start rounded-2xl" onClick={() => void handleOAuth("google")} disabled={submitting}>
                  <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 2.9 14.6 2 12 2 6.9 2 2.8 6.5 2.8 12s4.1 10 9.2 10c5.3 0 8.9-3.8 8.9-9.1 0-.6-.1-1.1-.2-1.6H12Z" />
                  </svg>
                  Continue with Google
                </Button>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </div>
                <Input className="mt-3 h-12 rounded-xl" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                {pendingMethod === "email" && (
                  <Input className="mt-3 h-12 rounded-xl" inputMode="numeric" placeholder="Email code (optional)" value={emailOtp} onChange={(event) => setEmailOtp(event.target.value)} />
                )}
                <div className="mt-3 flex gap-2">
                  <Button type="button" className="flex-1 rounded-xl" onClick={() => void handleSendEmailOtp()} disabled={!email || submitting}>
                    Send email link
                  </Button>
                  {pendingMethod === "email" && (
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => void handleVerifyEmailOtp()} disabled={!emailOtp || submitting}>
                      Verify code
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquareText className="h-4 w-4 text-primary" />
                  Phone number
                </div>
                <Input className="mt-3 h-12 rounded-xl" type="tel" placeholder="+1 555 123 4567" value={phone} onChange={(event) => setPhone(event.target.value)} />
                {pendingMethod === "phone" && (
                  <Input className="mt-3 h-12 rounded-xl" inputMode="numeric" placeholder="SMS code" value={phoneOtp} onChange={(event) => setPhoneOtp(event.target.value)} />
                )}
                <div className="mt-3 flex gap-2">
                  <Button type="button" className="flex-1 rounded-xl" onClick={() => void handleSendPhoneOtp()} disabled={!phone || submitting}>
                    Send text code
                  </Button>
                  {pendingMethod === "phone" && (
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => void handleVerifyPhoneOtp()} disabled={!phoneOtp || submitting}>
                      Verify code
                    </Button>
                  )}
                </div>
              </div>

              {notice && <p className="mt-4 text-sm text-primary">{notice}</p>}
              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            </div>
          )}

          {step < 3 && (
            <div className="mt-8 flex items-center justify-between">
              <Button type="button" variant="ghost" className="rounded-full" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
                Back
              </Button>
              <Button
                type="button"
                className="rounded-full px-6"
                onClick={() => {
                  persistDraft();
                  setStep((current) => Math.min(3, current + 1));
                }}
                disabled={!canContinue}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
