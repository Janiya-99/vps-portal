package proxy

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type ProxyService struct {
	npmBaseURL string
	npmEmail   string
	npmPass    string
	token      string
	tokenExp   time.Time
}

func NewProxyService() *ProxyService {
	baseURL := os.Getenv("NPM_BASE_URL")
	if baseURL == "" {
		baseURL = "http://infra-proxy:81/api"
	}
	email := os.Getenv("NPM_EMAIL")
	if email == "" {
		email = "admin@example.com"
	}
	pass := os.Getenv("NPM_PASSWORD")
	if pass == "" {
		pass = "changeme"
	}

	return &ProxyService{
		npmBaseURL: baseURL,
		npmEmail:   email,
		npmPass:    pass,
	}
}

func (p *ProxyService) authenticate() error {
	if p.token != "" && time.Now().Before(p.tokenExp) {
		return nil
	}

	payload, _ := json.Marshal(map[string]string{
		"identity": p.npmEmail,
		"secret":   p.npmPass,
	})

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Post(fmt.Sprintf("%s/tokens", p.npmBaseURL), "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("npm auth failed with status %d", resp.StatusCode)
	}

	var res struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return err
	}

	p.token = res.Token
	p.tokenExp = time.Now().Add(2 * time.Hour)
	return nil
}

type ProxyHostItem struct {
	ID            int      `json:"id"`
	DomainNames   []string `json:"domain_names"`
	ForwardHost   string   `json:"forward_host"`
	ForwardPort   int      `json:"forward_port"`
	CertificateID int      `json:"certificate_id"`
	SSLForced     bool     `json:"ssl_forced"`
	Enabled       bool     `json:"enabled"`
	CreatedOn     string   `json:"created_on"`
}

func (p *ProxyService) HandleListProxyHosts(w http.ResponseWriter, r *http.Request) {
	if err := p.authenticate(); err != nil {
		// Return empty list if NPM API isn't yet configured or credentials not set
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]ProxyHostItem{})
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	req, _ := http.NewRequestWithContext(r.Context(), "GET", fmt.Sprintf("%s/nginx/proxy-hosts", p.npmBaseURL), nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.token))

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"NPM request failed: %s"}`, err.Error()), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	var items []interface{}
	_ = json.NewDecoder(resp.Body).Decode(&items)
	json.NewEncoder(w).Encode(items)
}

type CreateProxyHostRequest struct {
	DomainNames   []string `json:"domain_names"`
	ForwardHost   string   `json:"forward_host"`
	ForwardPort   int      `json:"forward_port"`
	SSLForced     bool     `json:"ssl_forced"`
	BlockExploits bool     `json:"block_exploits"`
}

func (p *ProxyService) HandleCreateProxyHost(w http.ResponseWriter, r *http.Request) {
	var body CreateProxyHostRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, `{"error":"Invalid payload"}`, http.StatusBadRequest)
		return
	}

	if err := p.authenticate(); err != nil {
		http.Error(w, `{"error":"NPM Authentication failed. Please check NPM credentials."}`, http.StatusUnauthorized)
		return
	}

	npmPayload := map[string]interface{}{
		"domain_names":             body.DomainNames,
		"forward_scheme":           "http",
		"forward_host":             body.ForwardHost,
		"forward_port":             body.ForwardPort,
		"access_list_id":           "0",
		"certificate_id":           0,
		"ssl_forced":               body.SSLForced,
		"caching_enabled":          false,
		"block_exploits":           body.BlockExploits,
		"advanced_config":          "",
		"meta":                     map[string]interface{}{"letsencrypt_agree": true},
		"allow_websocket_upgrade": true,
		"http2_support":            true,
	}

	b, _ := json.Marshal(npmPayload)
	client := &http.Client{Timeout: 10 * time.Second}
	req, _ := http.NewRequestWithContext(r.Context(), "POST", fmt.Sprintf("%s/nginx/proxy-hosts", p.npmBaseURL), bytes.NewBuffer(b))
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", p.token))
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"NPM Host creation error: %s"}`, err.Error()), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		http.Error(w, fmt.Sprintf(`{"error":"NPM returned status %d"}`, resp.StatusCode), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Proxy host created successfully in Nginx Proxy Manager",
	})
}

