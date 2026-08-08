import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, LoaderCircle, Mail, RefreshCw, X } from 'lucide-react';
import BrandLogo from './BrandLogo';

type EmailVerificationModalProps = {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onSuccess?: () => void;
  apiBaseUrl?: string;
};

export default function EmailVerificationModal({
  isOpen,
  email,
  onClose,
  onSuccess,
  apiBaseUrl = '',
}: EmailVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus no primeiro input quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      setSuccessMsg(null);
      setResendCooldown(60);
      setCanResend(false);

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Timer de Cooldown para Reenvio
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && !canResend && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, canResend, resendCooldown]);

  // Tecla ESC para fechar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Manipulador de digitação dos 6 inputs individuais
  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, ''); // apenas números

    if (!cleanValue) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Suporte a Colar (Paste) múltiplos dígitos de uma só vez (ex: "849203")
    if (cleanValue.length > 1) {
      const pastedDigits = cleanValue.slice(0, 6).split('');
      const newDigits = [...digits];
      pastedDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Digitação normal de um único caractere
    const newDigits = [...digits];
    newDigits[index] = cleanValue.slice(-1);
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-avança para o próximo campo
    if (index < 5 && cleanValue) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const codeString = digits.join('');

  // Submeter código de verificação
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (codeString.length !== 6 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeString }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Código incorreto ou expirado.');
      }

      setSuccessMsg('E-mail verificado com sucesso!');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao validar código.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Solicitar novo envio de e-mail OTP
  const handleResendCode = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Falha ao reenviar e-mail de verificação.');
      }

      setSuccessMsg('Novo código enviado para seu e-mail!');
      setCanResend(false);
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao solicitar novo código.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSubmitting) onClose();
          }}
        >
          <motion.div
            className="glass-panel relative w-full max-w-md overflow-hidden p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10 bg-[var(--bg-main)] text-[var(--text-main)]"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Botão Fechar */}
            <button
              type="button"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-soft)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>

            {/* Cabeçalho */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ink-main)] text-white dark:bg-white dark:text-black mb-4 shadow-sm">
                <Mail size={22} />
              </div>

              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-soft)] mb-1">
                // PLATONE VERIFICATION
              </div>

              <h3 className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">
                Verifique seu E-mail
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-[var(--text-soft)] max-w-xs">
                Enviamos um código de 6 dígitos para{' '}
                <strong className="text-[var(--text-main)] font-mono">{email || 'seu e-mail'}</strong>.
              </p>
            </div>

            {/* Alertas de Erro ou Sucesso */}
            {errorMsg && (
              <motion.div
                className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* Formulário dos 6 Dígitos */}
            <form onSubmit={handleVerify} className="mt-6">
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isSubmitting || !!successMsg}
                    className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 text-center font-mono text-xl font-bold text-[var(--text-main)] transition-all focus:border-[var(--text-main)] focus:bg-transparent focus:outline-none focus:ring-1 focus:ring-[var(--text-main)] disabled:opacity-50 shadow-xs"
                  />
                ))}
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={codeString.length !== 6 || isSubmitting || !!successMsg}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink-main)] font-mono text-xs uppercase font-bold tracking-wider text-white dark:bg-white dark:text-black shadow-md transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Confirmar Código'
                )}
              </button>
            </form>

            {/* Opção de Reenviar Código */}
            <div className="mt-6 flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-4 text-xs">
              <span className="text-[var(--text-soft)]">Não recebeu o código?</span>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || isResending || isSubmitting}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-main)] font-semibold hover:underline disabled:text-[var(--text-soft)] disabled:no-underline disabled:opacity-50 transition-colors"
              >
                {isResending ? (
                  <>
                    <LoaderCircle size={12} className="animate-spin" />
                    Enviando...
                  </>
                ) : canResend ? (
                  <>
                    <RefreshCw size={12} />
                    Reenviar E-mail
                  </>
                ) : (
                  `Aguarde ${resendCooldown}s`
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
