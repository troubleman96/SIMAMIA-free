package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type Record map[string]any
type Store struct {
	mu       sync.RWMutex
	tables   map[string][]Record
	counters map[string]int
	db       *sql.DB
}
type API struct {
	store       *Store
	accountsURL string
	startedAt   time.Time
}
type ownerSubContextKey struct{}

func (a *API) authenticate(w http.ResponseWriter, r *http.Request, requestID string) (string, bool) {
	if a.store.db == nil {
		return "local-preview", true
	}
	header := r.Header.Get("Authorization")
	token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
	if token == "" || token == header {
		a.fail(w, r, requestID, http.StatusUnauthorized, "UNAUTHORIZED", "Camel Accounts bearer token required", nil)
		return "", false
	}
	issuer := a.accountsURL
	if issuer == "" {
		issuer = os.Getenv("CAMEL_ACCOUNTS_URL")
	}
	if issuer == "" {
		issuer = "https://accounts.camelcreatives.com"
	}
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, strings.TrimRight(issuer, "/")+"/oauth/userinfo", nil)
	if err != nil {
		a.fail(w, r, requestID, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authentication", nil)
		return "", false
	}
	request.Header.Set("Authorization", "Bearer "+token)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		a.fail(w, r, requestID, http.StatusServiceUnavailable, "AUTH_UNAVAILABLE", "Camel Accounts could not be reached", nil)
		return "", false
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		a.fail(w, r, requestID, http.StatusUnauthorized, "UNAUTHORIZED", "Camel Accounts token is invalid or expired", nil)
		return "", false
	}
	var claims struct {
		Sub  string `json:"sub"`
		Data struct {
			Sub string `json:"sub"`
		} `json:"data"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&claims); err != nil {
		a.fail(w, r, requestID, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid Camel Accounts identity response", nil)
		return "", false
	}
	if claims.Sub == "" {
		claims.Sub = claims.Data.Sub
	}
	if claims.Sub == "" {
		a.fail(w, r, requestID, http.StatusUnauthorized, "UNAUTHORIZED", "Camel Accounts identity is missing", nil)
		return "", false
	}
	return claims.Sub, true
}

func NewStore() *Store {
	store := &Store{tables: map[string][]Record{
		"orders": {
			{"id": "ORD-0248", "customer": "Demo Customer 01", "phone": "+255 700 000 001", "service": "Laundry · Express", "date": "2026-10-11T10:30:00+03:00", "amount": 48000, "paid": 48000, "currency": "TZS", "status": "In progress", "method": "M-Pesa", "assignee": "Demo Staff 01"},
			{"id": "ORD-0247", "customer": "Demo Customer 02", "phone": "+255 700 000 002", "service": "AC maintenance", "date": "2026-10-11T09:00:00+03:00", "amount": 120000, "paid": 60000, "currency": "TZS", "status": "Ready", "method": "Mixx by Yas", "assignee": "Demo Staff 02"},
			{"id": "ORD-0246", "customer": "Demo Customer 03", "phone": "+255 700 000 003", "service": "Office cleaning", "date": "2026-10-11T08:00:00+03:00", "amount": 185000, "paid": 185000, "currency": "TZS", "status": "Completed", "method": "Airtel Money", "assignee": "Demo Staff 01"},
			{"id": "ORD-0245", "customer": "Demo Customer 04", "phone": "+255 700 000 004", "service": "Plumbing · Call-out", "date": "2026-10-10T16:30:00+03:00", "amount": 95000, "paid": 0, "currency": "TZS", "status": "New", "method": "—", "assignee": "Demo Staff 03"},
		},
		"customers": {
			{"id": "CUS-0086", "name": "Demo Customer 01", "phone": "+255 700 000 001", "email": "demo.customer01@example.test", "location": "Kinondoni, Dar es Salaam", "orders": 8, "spent": 540000, "currency": "TZS"},
			{"id": "CUS-0085", "name": "Demo Customer 02", "phone": "+255 700 000 002", "email": "demo.customer02@example.test", "location": "Arusha CBD, Arusha", "orders": 5, "spent": 725000, "currency": "TZS"},
			{"id": "CUS-0084", "name": "Demo Customer 03", "phone": "+255 700 000 003", "email": "demo.customer03@example.test", "location": "Upanga, Dar es Salaam", "orders": 3, "spent": 185000, "currency": "TZS"},
			{"id": "CUS-0083", "name": "Demo Customer 04", "phone": "+255 700 000 004", "email": "demo.customer04@example.test", "location": "Mwanza City, Mwanza", "orders": 1, "spent": 0, "currency": "TZS"},
		},
		"services": {
			{"id": "SRV-01", "name": "Laundry · Wash & fold", "category": "Laundry", "duration": "24 hours", "price": 25000, "currency": "TZS", "active": true},
			{"id": "SRV-02", "name": "AC maintenance", "category": "Repairs", "duration": "2 hours", "price": 120000, "currency": "TZS", "active": true},
		},
		"team": {
			{"id": "TM-04", "name": "Demo Staff 01", "role": "Service lead", "phone": "+255 700 001 001", "active": true},
			{"id": "TM-03", "name": "Demo Staff 02", "role": "Technician", "phone": "+255 700 001 002", "active": true},
			{"id": "TM-02", "name": "Demo Staff 03", "role": "Technician", "phone": "+255 700 001 003", "active": true},
			{"id": "TM-01", "name": "Demo Admin", "role": "Owner", "phone": "+255 700 001 004", "active": true},
		},
		"expenses":   {},
		"businesses": {},
	}, counters: map[string]int{"orders": 248, "customers": 86, "services": 2, "team": 4}}
	for _, records := range store.tables {
		for _, record := range records {
			record["owner_sub"] = "local-preview"
		}
	}
	return store
}

func OpenStore(path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
		return nil, fmt.Errorf("create database directory: %w", err)
	}
	db, err := sql.Open("sqlite3", "file:"+filepath.ToSlash(path)+"?_busy_timeout=5000&_journal_mode=WAL&_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}
	db.SetMaxOpenConns(1)
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("connect to database: %w", err)
	}
	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS records (
		resource TEXT NOT NULL,
		id TEXT NOT NULL,
		payload TEXT NOT NULL,
		created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (resource, id)
	)`); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("initialize record storage: %w", err)
	}
	if _, err := db.Exec(`CREATE TABLE IF NOT EXISTS admin_audit (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		actor TEXT NOT NULL,
		action TEXT NOT NULL,
		resource TEXT NOT NULL,
		record_id TEXT NOT NULL DEFAULT '',
		owner_sub TEXT NOT NULL DEFAULT '',
		occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
		changed_fields TEXT NOT NULL DEFAULT '[]'
	)`); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("initialize admin audit storage: %w", err)
	}

	store := &Store{tables: make(map[string][]Record), counters: make(map[string]int), db: db}
	for _, resource := range []string{"orders", "customers", "services", "team", "expenses", "businesses"} {
		store.tables[resource] = []Record{}
	}
	rows, err := db.Query(`SELECT resource, id, payload FROM records ORDER BY rowid DESC`)
	if err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("load records: %w", err)
	}
	for rows.Next() {
		var resource, id, payload string
		if err := rows.Scan(&resource, &id, &payload); err != nil {
			_ = rows.Close()
			_ = db.Close()
			return nil, fmt.Errorf("read stored record: %w", err)
		}
		var record Record
		if err := json.Unmarshal([]byte(payload), &record); err != nil {
			_ = rows.Close()
			_ = db.Close()
			return nil, fmt.Errorf("decode stored %s record %s: %w", resource, id, err)
		}
		if _, known := store.tables[resource]; !known {
			store.tables[resource] = []Record{}
		}
		store.tables[resource] = append(store.tables[resource], record)
		if separator := strings.LastIndex(id, "-"); separator >= 0 {
			if sequence, parseErr := strconv.Atoi(id[separator+1:]); parseErr == nil && sequence > store.counters[resource] {
				store.counters[resource] = sequence
			}
		}
	}
	if err := rows.Err(); err != nil {
		_ = rows.Close()
		_ = db.Close()
		return nil, fmt.Errorf("finish loading records: %w", err)
	}
	_ = rows.Close()
	if len(store.tables["orders"])+len(store.tables["customers"])+len(store.tables["services"])+len(store.tables["team"]) == 0 {
		seed := NewStore()
		for resource, records := range seed.tables {
			store.tables[resource] = records
			store.counters[resource] = seed.counters[resource]
			for i := len(records) - 1; i >= 0; i-- {
				if err := store.insert(resource, records[i]); err != nil {
					_ = db.Close()
					return nil, fmt.Errorf("seed %s records: %w", resource, err)
				}
			}
		}
	}
	return store, nil
}

func (s *Store) insert(resource string, record Record) error {
	if s.db == nil {
		return nil
	}
	payload, err := json.Marshal(record)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(`INSERT INTO records (resource, id, payload) VALUES (?, ?, ?)`, resource, fmt.Sprint(record["id"]), string(payload))
	return err
}

func (s *Store) replace(resource string, id string, record Record) error {
	if s.db == nil {
		return nil
	}
	payload, err := json.Marshal(record)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(`UPDATE records SET payload = ?, updated_at = CURRENT_TIMESTAMP WHERE resource = ? AND id = ?`, string(payload), resource, id)
	return err
}

func (s *Store) remove(resource string, id string) error {
	if s.db == nil {
		return nil
	}
	_, err := s.db.Exec(`DELETE FROM records WHERE resource = ? AND id = ?`, resource, id)
	return err
}

type responseRecorder struct {
	http.ResponseWriter
	status int
}

func (w *responseRecorder) WriteHeader(status int) {
	if w.status != 0 {
		return
	}
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *responseRecorder) Write(body []byte) (int, error) {
	if w.status == 0 {
		w.WriteHeader(http.StatusOK)
	}
	return w.ResponseWriter.Write(body)
}

func (a *API) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	started := time.Now()
	requestID := r.Header.Get("X-Request-ID")
	response := &responseRecorder{ResponseWriter: w}
	a.handleHTTP(response, r)
	status := response.status
	if status == 0 {
		status = http.StatusOK
	}
	attrs := []any{
		"method", r.Method,
		"route", logRoute(r.URL.Path),
		"status", status,
		"duration_ms", time.Since(started).Milliseconds(),
	}
	if requestID == "" {
		requestID = response.Header().Get("X-Request-ID")
	}
	if safeRequestID(requestID) {
		attrs = append(attrs, "request_id", requestID)
	}
	if status >= http.StatusInternalServerError {
		slog.Error("http_request", attrs...)
	} else if status >= http.StatusBadRequest {
		slog.Warn("http_request", attrs...)
	} else {
		slog.Info("http_request", attrs...)
	}
}

func safeRequestID(requestID string) bool {
	if len(requestID) != 20 || !strings.HasPrefix(requestID, "req_") {
		return false
	}
	_, err := hex.DecodeString(strings.TrimPrefix(requestID, "req_"))
	return err == nil
}

func logRoute(path string) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) >= 3 && parts[0] == "api" && parts[1] == "v1" {
		resource := parts[2]
		if resource == "admin" {
			return "/api/v1/admin"
		}
		if resource == "health" && len(parts) == 3 {
			return "/api/v1/health"
		}
		switch resource {
		case "businesses", "customers", "services", "orders", "team", "expenses", "payments":
			if len(parts) > 3 {
				return "/api/v1/" + resource + "/{id}"
			}
			return "/api/v1/" + resource
		}
		return "/api/v1/{resource}"
	}
	return "/{path}"
}

func (a *API) handleHTTP(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w, r)
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Expose-Headers", "X-Request-ID")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "no-store")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	requestID := r.Header.Get("X-Request-ID")
	if requestID == "" {
		requestID = randomID("req_")
	}
	w.Header().Set("X-Request-ID", requestID)
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 || parts[0] != "api" || parts[1] != "v1" {
		a.fail(w, r, requestID, http.StatusNotFound, "NOT_FOUND", "Endpoint not found", nil)
		return
	}
	if parts[2] == "health" && len(parts) == 3 {
		if r.Method != http.MethodGet {
			a.methodNotAllowed(w, r, requestID, "GET")
			return
		}
		a.write(w, http.StatusOK, Record{"status": "ok", "service": "mishe-api", "version": "v1", "time_zone": "Africa/Dar_es_Salaam", "currency": "TZS"}, requestID, nil)
		return
	}
	if parts[2] == "admin" {
		a.adminHTTP(w, r, requestID, parts[3:])
		return
	}
	ownerSub, ok := a.authenticate(w, r, requestID)
	if !ok {
		return
	}
	r = r.WithContext(context.WithValue(r.Context(), ownerSubContextKey{}, ownerSub))
	resource := parts[2]
	if resource == "payments" {
		if len(parts) > 3 {
			a.fail(w, r, requestID, http.StatusNotFound, "NOT_FOUND", "Payment resource not found", nil)
			return
		}
		if r.Method != http.MethodGet {
			a.methodNotAllowed(w, r, requestID, "GET")
			return
		}
		a.listPayments(w, r, requestID)
		return
	}
	if _, ok := a.store.tables[resource]; !ok {
		a.fail(w, r, requestID, http.StatusNotFound, "NOT_FOUND", "Resource not found", nil)
		return
	}
	if len(parts) == 3 {
		a.collection(w, r, requestID, resource)
		return
	}
	if len(parts) == 4 && parts[3] != "" {
		a.item(w, r, requestID, resource, parts[3])
		return
	}
	a.fail(w, r, requestID, http.StatusNotFound, "NOT_FOUND", "Endpoint not found", nil)
}

func setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	configured := strings.Split(os.Getenv("CORS_ALLOWED_ORIGINS"), ",")
	if len(configured) == 1 && strings.TrimSpace(configured[0]) == "" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		return
	}
	for _, allowed := range configured {
		allowed = strings.TrimSpace(allowed)
		if allowed == "*" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			return
		}
		if origin != "" && origin == allowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Add("Vary", "Origin")
			return
		}
	}
}

func (a *API) collection(w http.ResponseWriter, r *http.Request, rid, resource string) {
	switch r.Method {
	case http.MethodGet:
		a.list(w, r, rid, resource)
	case http.MethodPost:
		var in Record
		if err := decodeBody(r, &in); err != nil {
			a.fail(w, r, rid, http.StatusBadRequest, "INVALID_JSON", err.Error(), nil)
			return
		}
		if err := validate(resource, in); err != nil {
			a.fail(w, r, rid, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error(), nil)
			return
		}
		a.store.mu.Lock()
		defer a.store.mu.Unlock()
		id := a.store.nextID(resource)
		in["id"] = id
		ownerSub := r.Context().Value(ownerSubContextKey{}).(string)
		in["owner_sub"] = ownerSub
		if resource == "businesses" {
			in["ownerSub"] = ownerSub
		}
		if resource == "orders" {
			if _, ok := in["currency"]; !ok {
				in["currency"] = "TZS"
			}
			if _, ok := in["status"]; !ok {
				in["status"] = "New"
			}
			if _, ok := in["paid"]; !ok {
				in["paid"] = 0
			}
		}
		if resource == "services" {
			if _, ok := in["currency"]; !ok {
				in["currency"] = "TZS"
			}
			if _, ok := in["active"]; !ok {
				in["active"] = true
			}
		}
		if err := a.store.insert(resource, in); err != nil {
			slog.Error("record_write_failed", "operation", "create", "resource", resource, "error", err)
			a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not save record", nil)
			return
		}
		a.store.tables[resource] = append([]Record{in}, a.store.tables[resource]...)
		slog.Info("record_created", "resource", resource, "record_id", id)
		a.write(w, http.StatusCreated, in, rid, nil)
	default:
		a.methodNotAllowed(w, r, rid, "GET, POST")
	}
}
func (a *API) item(w http.ResponseWriter, r *http.Request, rid, resource, id string) {
	switch r.Method {
	case http.MethodGet:
		a.store.mu.RLock()
		defer a.store.mu.RUnlock()
		if row := findOwned(a.store.tables[resource], id, r.Context().Value(ownerSubContextKey{}).(string)); row != nil {
			a.write(w, http.StatusOK, row, rid, nil)
			return
		}
		a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Record not found", Record{"resource": resource, "id": id})
	case http.MethodPatch:
		var patch Record
		if err := decodeBody(r, &patch); err != nil {
			a.fail(w, r, rid, http.StatusBadRequest, "INVALID_JSON", err.Error(), nil)
			return
		}
		delete(patch, "id")
		delete(patch, "owner_sub")
		delete(patch, "ownerSub")
		a.store.mu.Lock()
		defer a.store.mu.Unlock()
		ownerSub := r.Context().Value(ownerSubContextKey{}).(string)
		for _, row := range a.store.tables[resource] {
			if row["id"] == id && row["owner_sub"] == ownerSub {
				updated := make(Record, len(row)+len(patch))
				for key, value := range row {
					updated[key] = value
				}
				for k, v := range patch {
					updated[k] = v
				}
				if err := validate(resource, updated); err != nil {
					a.fail(w, r, rid, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error(), nil)
					return
				}
				if err := a.store.replace(resource, id, updated); err != nil {
					slog.Error("record_write_failed", "operation", "update", "resource", resource, "record_id", id, "error", err)
					a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not update record", nil)
					return
				}
				for i, existing := range a.store.tables[resource] {
					if existing["id"] == id {
						a.store.tables[resource][i] = updated
						break
					}
				}
				slog.Info("record_updated", "resource", resource, "record_id", id)
				a.write(w, http.StatusOK, updated, rid, nil)
				return
			}
		}
		a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Record not found", Record{"resource": resource, "id": id})
	case http.MethodDelete:
		a.store.mu.Lock()
		defer a.store.mu.Unlock()
		rows := a.store.tables[resource]
		ownerSub := r.Context().Value(ownerSubContextKey{}).(string)
		for i, row := range rows {
			if row["id"] == id && row["owner_sub"] == ownerSub {
				if err := a.store.remove(resource, id); err != nil {
					slog.Error("record_write_failed", "operation", "delete", "resource", resource, "record_id", id, "error", err)
					a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not delete record", nil)
					return
				}
				a.store.tables[resource] = append(rows[:i], rows[i+1:]...)
				slog.Info("record_deleted", "resource", resource, "record_id", id)
				a.write(w, http.StatusOK, Record{"id": id, "deleted": true}, rid, nil)
				return
			}
		}
		a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Record not found", Record{"resource": resource, "id": id})
	default:
		a.methodNotAllowed(w, r, rid, "GET, PATCH, DELETE")
	}
}
func (a *API) list(w http.ResponseWriter, r *http.Request, rid, resource string) {
	q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	page := parsePositive(r.URL.Query().Get("page"), 1)
	size := parsePositive(r.URL.Query().Get("page_size"), 20)
	if size > 100 {
		size = 100
	}
	a.store.mu.RLock()
	rows := append([]Record(nil), a.store.tables[resource]...)
	a.store.mu.RUnlock()
	filtered := make([]Record, 0, len(rows))
	ownerSub := r.Context().Value(ownerSubContextKey{}).(string)
	for _, row := range rows {
		if row["owner_sub"] != ownerSub {
			continue
		}
		if status != "" && fmt.Sprint(row["status"]) != status {
			continue
		}
		if q != "" {
			blob, _ := json.Marshal(row)
			if !strings.Contains(strings.ToLower(string(blob)), q) {
				continue
			}
		}
		filtered = append(filtered, row)
	}
	total := len(filtered)
	start := (page - 1) * size
	if start > total {
		start = total
	}
	end := start + size
	if end > total {
		end = total
	}
	meta := Record{"pagination": Record{"page": page, "page_size": size, "total": total, "total_pages": (total + size - 1) / size}}
	a.write(w, http.StatusOK, filtered[start:end], rid, meta)
}
func (a *API) listPayments(w http.ResponseWriter, r *http.Request, rid string) {
	a.store.mu.RLock()
	rows := append([]Record(nil), a.store.tables["orders"]...)
	a.store.mu.RUnlock()
	out := make([]Record, 0, len(rows))
	for _, o := range rows {
		if o["owner_sub"] != r.Context().Value(ownerSubContextKey{}).(string) {
			continue
		}
		amount := number(o["amount"])
		paid := number(o["paid"])
		out = append(out, Record{"id": "PAY-" + strings.TrimPrefix(fmt.Sprint(o["id"]), "ORD-"), "order_id": o["id"], "customer": o["customer"], "amount": amount, "paid": paid, "due": amount - paid, "currency": "TZS", "method": o["method"], "status": map[bool]string{true: "paid", false: "pending"}[paid >= amount]})
	}
	a.write(w, http.StatusOK, out, rid, Record{"pagination": Record{"page": 1, "page_size": len(out), "total": len(out), "total_pages": 1}})
}
func (s *Store) nextID(resource string) string {
	s.counters[resource]++
	prefix := map[string]string{"orders": "ORD", "customers": "CUS", "services": "SRV", "team": "TM", "expenses": "EXP", "businesses": "BIZ"}[resource]
	if resource == "services" {
		return fmt.Sprintf("%s-%02d", prefix, s.counters[resource])
	}
	return fmt.Sprintf("%s-%04d", prefix, s.counters[resource])
}
func find(rows []Record, id string) Record {
	for _, r := range rows {
		if r["id"] == id {
			return r
		}
	}
	return nil
}
func findOwned(rows []Record, id, ownerSub string) Record {
	for _, row := range rows {
		if row["id"] == id && row["owner_sub"] == ownerSub {
			return row
		}
	}
	return nil
}
func decodeBody(r *http.Request, dst *Record) error {
	defer r.Body.Close()
	dec := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	if err := dec.Decode(dst); err != nil {
		return err
	}
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		return errors.New("request body must contain one JSON object")
	}
	if *dst == nil {
		return errors.New("request body must be a JSON object")
	}
	return nil
}
func validate(resource string, r Record) error {
	required := map[string][]string{"customers": {"name", "phone"}, "orders": {"customer", "service", "amount"}, "services": {"name", "price"}, "team": {"name", "phone"}, "expenses": {"description", "category", "amount", "date"}}[resource]
	for _, k := range required {
		v, ok := r[k]
		if !ok || strings.TrimSpace(fmt.Sprint(v)) == "" {
			return fmt.Errorf("%s is required", k)
		}
	}
	if resource == "orders" || resource == "services" || resource == "expenses" {
		amountField := "price"
		if resource == "orders" || resource == "expenses" {
			amountField = "amount"
		}
		if number(r[amountField]) <= 0 {
			return errors.New("amount must be greater than zero")
		}
	}
	return nil
}
func number(v any) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case float32:
		return float64(n)
	case int:
		return float64(n)
	case int64:
		return float64(n)
	case json.Number:
		f, _ := n.Float64()
		return f
	}
	f, _ := strconv.ParseFloat(fmt.Sprint(v), 64)
	return f
}
func parsePositive(s string, def int) int {
	n, e := strconv.Atoi(s)
	if e != nil || n < 1 {
		return def
	}
	return n
}
func randomID(prefix string) string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return prefix + strconv.FormatInt(time.Now().UnixNano(), 36)
	}
	return prefix + hex.EncodeToString(b[:])
}
func (a *API) write(w http.ResponseWriter, status int, data any, rid string, extra Record) {
	meta := Record{"request_id": rid, "timestamp": time.Now().UTC().Format(time.RFC3339Nano)}
	for k, v := range extra {
		meta[k] = v
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(Record{"data": data, "meta": meta})
}
func (a *API) fail(w http.ResponseWriter, r *http.Request, rid string, status int, code, message string, details Record) {
	meta := Record{"request_id": rid, "timestamp": time.Now().UTC().Format(time.RFC3339Nano)}
	body := Record{"error": Record{"code": code, "message": message}, "meta": meta}
	if details != nil {
		body["error"].(Record)["details"] = details
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
func (a *API) methodNotAllowed(w http.ResponseWriter, r *http.Request, rid, allow string) {
	w.Header().Set("Allow", allow)
	a.fail(w, r, rid, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Method not allowed", Record{"allow": allow})
}
func main() {
	level := new(slog.LevelVar)
	switch strings.ToLower(strings.TrimSpace(os.Getenv("LOG_LEVEL"))) {
	case "debug":
		level.Set(slog.LevelDebug)
	case "warn", "warning":
		level.Set(slog.LevelWarn)
	case "error":
		level.Set(slog.LevelError)
	default:
		level.Set(slog.LevelInfo)
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	databasePath := os.Getenv("MISHE_DB_PATH")
	if databasePath == "" {
		databasePath = os.Getenv("HUDUMADESK_DB_PATH") // Backward compatibility for existing deployments.
	}
	if databasePath == "" {
		databasePath = "data/mishe.db"
		if _, err := os.Stat(databasePath); errors.Is(err, os.ErrNotExist) {
			for _, legacy := range []string{"data/simamia.db", "data/hudumadesk.db"} {
				if _, legacyErr := os.Stat(legacy); legacyErr == nil {
					databasePath = legacy
					break
				}
			}
		}
	}
	store, err := OpenStore(databasePath)
	if err != nil {
		slog.Error("startup_failed", "component", "storage", "error", err)
		os.Exit(1)
	}
	defer store.db.Close()
	api := &API{store: store, accountsURL: os.Getenv("CAMEL_ACCOUNTS_URL"), startedAt: time.Now()}
	srv := &http.Server{Addr: "0.0.0.0:" + port, Handler: api, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second}
	slog.Info("service_started", "service", "mishe-api", "port", port, "database", databasePath)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("service_stopped_unexpectedly", "error", err)
		os.Exit(1)
	}
}
