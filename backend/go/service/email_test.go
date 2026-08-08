package service

import (
	"strings"
	"testing"
)

func TestValidateEmailFormat(t *testing.T) {
	tests := []struct {
		email    string
		expected bool
	}{
		{"user@example.com", true},
		{"player.one@platone.app", true},
		{"invalid-email", false},
		{"@domain.com", false},
		{"user@", false},
		{"", false},
	}

	for _, tt := range tests {
		got := ValidateEmailFormat(tt.email)
		if got != tt.expected {
			t.Errorf("ValidateEmailFormat(%q) = %v; esperado %v", tt.email, got, tt.expected)
		}
	}
}

func TestGenerateOTPCode(t *testing.T) {
	code1, err := GenerateOTPCode()
	if err != nil {
		t.Fatalf("Erro inesperado ao gerar OTP: %v", err)
	}

	if len(code1) != 6 {
		t.Errorf("Esperado código de tamanho 6, obtido %d", len(code1))
	}

	for _, ch := range code1 {
		if ch < '0' || ch > '9' {
			t.Errorf("Caractere inválido no código OTP: %c", ch)
		}
	}

	code2, _ := GenerateOTPCode()
	if code1 == code2 {
		t.Errorf("Códigos OTP consecutivos não deveriam ser idênticos: %s == %s", code1, code2)
	}
}

func TestSendVerificationNoCredentialsReturnsError(t *testing.T) {
	svc := NewEmailService()
	svc.ResendAPIKey = ""
	svc.Password = "" // Sem credenciais

	err := svc.SendVerificationOTP("test@example.com", "123456")
	if err == nil {
		t.Fatalf("Esperado erro ao tentar enviar e-mail sem credenciais, mas nenhum erro foi retornado")
	}

	if !strings.Contains(err.Error(), "nenhuma chave de e-mail configurada") {
		t.Errorf("Mensagem de erro inesperada: %v", err)
	}
}
