package service

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"math/big"
	"net/http"
	"net/mail"
	"net/smtp"
	"os"
	"path/filepath"
	"time"
)

type EmailService struct {
	ResendAPIKey string
	SMTPHost     string
	SMTPPort     string
	FromEmail    string
	Password     string
}

func NewEmailService() *EmailService {
	resendKey := os.Getenv("RESEND_API_KEY")

	host := os.Getenv("SMTP_HOST")
	if host == "" {
		host = "smtp.resend.com"
	}
	port := os.Getenv("SMTP_PORT")
	if port == "" {
		port = "587"
	}
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		// Endereço de envio padrão do Resend para ambientes sem domínio próprio validado
		from = "PlatOne <onboarding@resend.dev>"
	}
	pass := os.Getenv("SMTP_PASS")

	return &EmailService{
		ResendAPIKey: resendKey,
		SMTPHost:     host,
		SMTPPort:     port,
		FromEmail:    from,
		Password:     pass,
	}
}

// ValidateEmailFormat verifica se a string possui um formato de e-mail válido.
func ValidateEmailFormat(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

// GenerateOTPCode gera um código numérico de 6 dígitos seguro contra adivinhação.
func GenerateOTPCode() (string, error) {
	const digits = "0123456789"
	code := make([]byte, 6)
	for i := range code {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		code[i] = digits[num.Int64()]
	}
	return string(code), nil
}

type resendEmailRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

// sendViaResendAPI faz envio direto via HTTP REST API da Resend
func (s *EmailService) sendViaResendAPI(toEmail, subject, htmlContent string) error {
	payload := resendEmailRequest{
		From:    s.FromEmail,
		To:      []string{toEmail},
		Subject: subject,
		HTML:    htmlContent,
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("erro ao codificar JSON para Resend: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("erro ao criar requisição Resend: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.ResendAPIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("falha ao conectar à API do Resend: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("API do Resend retornou erro (status %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// SendVerificationOTP renderiza o template HTML e dispara o e-mail real via Resend API ou SMTP.
func (s *EmailService) SendVerificationOTP(toEmail, code string) error {
	tmplPath := filepath.Join("templates", "email_verification.html")
	
	var bodyBuffer bytes.Buffer
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		fallbackHTML := fmt.Sprintf(`
			<div style="font-family: sans-serif; background: #000; color: #fff; padding: 30px;">
				<h2>PlatOne - Código de Verificação</h2>
				<p>Seu código de confirmação é:</p>
				<h1 style="background: #111; color: #fff; padding: 12px 24px; border: 1px solid #333; letter-spacing: 8px;">%s</h1>
				<p>Válido por 15 minutos.</p>
			</div>
		`, code)
		bodyBuffer.WriteString(fallbackHTML)
	} else {
		data := struct {
			Code string
		}{
			Code: code,
		}
		if err := tmpl.Execute(&bodyBuffer, data); err != nil {
			return fmt.Errorf("erro ao renderizar template de email: %w", err)
		}
	}

	subject := "Código de Verificação - PlatOne"
	htmlContent := bodyBuffer.String()

	// 1. Prioridade: Resend REST API (usando RESEND_API_KEY)
	if s.ResendAPIKey != "" {
		return s.sendViaResendAPI(toEmail, subject, htmlContent)
	}

	// 2. Segunda opção: Envio via servidor SMTP (se a senha SMTP estiver configurada)
	if s.Password != "" {
		smtpSubject := fmt.Sprintf("Subject: %s\n", subject)
		mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
		msg := append([]byte(smtpSubject+mime), bodyBuffer.Bytes()...)

		auth := smtp.PlainAuth("", s.FromEmail, s.Password, s.SMTPHost)
		addr := fmt.Sprintf("%s:%s", s.SMTPHost, s.SMTPPort)
		return smtp.SendMail(addr, auth, s.FromEmail, []string{toEmail}, msg)
	}

	// Se nenhuma credencial de envio for encontrada, retorna erro explícito (Modo de simulação removido)
	return fmt.Errorf("envio cancelado: nenhuma chave de e-mail configurada. Defina RESEND_API_KEY ou SMTP_PASS no arquivo .env")
}
