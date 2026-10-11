package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Record map[string]any
type Store struct {
	mu       sync.RWMutex
	tables   map[string][]Record
	counters map[string]int
}
type API struct{ store *Store }

func NewStore() *Store {
	return &Store{tables: map[string][]Record{
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
	}, counters: map[string]int{"orders": 248, "customers": 86, "services": 2, "team": 4}}
}

func (a *API) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
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
		a.write(w, http.StatusOK, Record{"status": "ok", "service": "hudumadesk-api", "version": "v1", "time_zone": "Africa/Dar_es_Salaam", "currency": "TZS"}, requestID, nil)
		return
	}
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
		a.store.tables[resource] = append([]Record{in}, a.store.tables[resource]...)
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
		if row := find(a.store.tables[resource], id); row != nil {
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
		a.store.mu.Lock()
		defer a.store.mu.Unlock()
		for _, row := range a.store.tables[resource] {
			if row["id"] == id {
				for k, v := range patch {
					row[k] = v
				}
				if err := validate(resource, row); err != nil {
					a.fail(w, r, rid, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error(), nil)
					return
				}
				a.write(w, http.StatusOK, row, rid, nil)
				return
			}
		}
		a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Record not found", Record{"resource": resource, "id": id})
	case http.MethodDelete:
		a.store.mu.Lock()
		defer a.store.mu.Unlock()
		rows := a.store.tables[resource]
		for i, row := range rows {
			if row["id"] == id {
				a.store.tables[resource] = append(rows[:i], rows[i+1:]...)
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
	for _, row := range rows {
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
		amount := number(o["amount"])
		paid := number(o["paid"])
		out = append(out, Record{"id": "PAY-" + strings.TrimPrefix(fmt.Sprint(o["id"]), "ORD-"), "order_id": o["id"], "customer": o["customer"], "amount": amount, "paid": paid, "due": amount - paid, "currency": "TZS", "method": o["method"], "status": map[bool]string{true: "paid", false: "pending"}[paid >= amount]})
	}
	a.write(w, http.StatusOK, out, rid, Record{"pagination": Record{"page": 1, "page_size": len(out), "total": len(out), "total_pages": 1}})
}
func (s *Store) nextID(resource string) string {
	s.counters[resource]++
	prefix := map[string]string{"orders": "ORD", "customers": "CUS", "services": "SRV", "team": "TM"}[resource]
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
	required := map[string][]string{"customers": {"name", "phone"}, "orders": {"customer", "service", "amount"}, "services": {"name", "price"}, "team": {"name", "phone"}}[resource]
	for _, k := range required {
		v, ok := r[k]
		if !ok || strings.TrimSpace(fmt.Sprint(v)) == "" {
			return fmt.Errorf("%s is required", k)
		}
	}
	if resource == "orders" || resource == "services" {
		if number(r[map[bool]string{true: "amount", false: "price"}[resource == "orders"]]) <= 0 {
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
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	api := &API{store: NewStore()}
	srv := &http.Server{Addr: "0.0.0.0:" + port, Handler: api, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second}
	log.Printf("HudumaDesk API listening on :%s", port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
