package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func testAPI() *API { return &API{store: NewStore()} }
func call(t *testing.T, a *API, method, path, body string) (*httptest.ResponseRecorder, Record) {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	a.ServeHTTP(rec, req)
	var payload Record
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("response is not JSON: %v (%s)", err, rec.Body.String())
	}
	return rec, payload
}
func TestHealthUsesStandardEnvelope(t *testing.T) {
	rec, p := call(t, testAPI(), http.MethodGet, "/api/v1/health", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d", rec.Code)
	}
	data, ok := p["data"].(map[string]any)
	if !ok || data["status"] != "ok" {
		t.Fatalf("unexpected data: %#v", p["data"])
	}
	meta, ok := p["meta"].(map[string]any)
	if !ok || meta["request_id"] == nil || meta["timestamp"] == nil {
		t.Fatalf("missing standard metadata: %#v", p["meta"])
	}
}
func TestListSearchAndPagination(t *testing.T) {
	rec, p := call(t, testAPI(), http.MethodGet, "/api/v1/orders?q=Demo+Customer+01&page=1&page_size=1", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	rows, ok := p["data"].([]any)
	if !ok || len(rows) != 1 {
		t.Fatalf("expected one matching order, got %#v", p["data"])
	}
	meta := p["meta"].(map[string]any)
	pagination := meta["pagination"].(map[string]any)
	if pagination["total"].(float64) != 1 {
		t.Fatalf("unexpected pagination: %#v", pagination)
	}
}
func TestCreateCustomerAndValidation(t *testing.T) {
	a := testAPI()
	rec, p := call(t, a, http.MethodPost, "/api/v1/customers", `{"name":"Demo Created","phone":"+255 700 000 010","email":"demo.created@example.test"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	d := p["data"].(map[string]any)
	id := d["id"].(string)
	if !strings.HasPrefix(id, "CUS-") {
		t.Fatalf("unexpected id: %s", id)
	}
	rec, p = call(t, a, http.MethodPost, "/api/v1/customers", `{"name":"No phone"}`)
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", rec.Code)
	}
	if p["error"].(map[string]any)["code"] != "VALIDATION_ERROR" {
		t.Fatalf("unexpected error: %#v", p["error"])
	}
}
func TestPatchAndDeleteOrder(t *testing.T) {
	a := testAPI()
	rec, p := call(t, a, http.MethodPatch, "/api/v1/orders/ORD-0248", `{"status":"Completed"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("patch status=%d body=%s", rec.Code, rec.Body.String())
	}
	if p["data"].(map[string]any)["status"] != "Completed" {
		t.Fatalf("patch not applied: %#v", p["data"])
	}
	rec, p = call(t, a, http.MethodDelete, "/api/v1/orders/ORD-0248", "")
	if rec.Code != http.StatusOK || p["data"].(map[string]any)["deleted"] != true {
		t.Fatalf("delete failed: %d %#v", rec.Code, p)
	}
	rec, p = call(t, a, http.MethodGet, "/api/v1/orders/ORD-0248", "")
	if rec.Code != http.StatusNotFound || p["error"].(map[string]any)["code"] != "NOT_FOUND" {
		t.Fatalf("expected not found: %d %#v", rec.Code, p)
	}
}
func TestPaymentLedgerIsDerivedAndReadOnly(t *testing.T) {
	a := testAPI()
	rec, p := call(t, a, http.MethodGet, "/api/v1/payments", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d", rec.Code)
	}
	rows := p["data"].([]any)
	if len(rows) == 0 {
		t.Fatal("expected seeded payment ledger")
	}
	row := rows[0].(map[string]any)
	if row["currency"] != "TZS" || row["due"] == nil {
		t.Fatalf("unexpected ledger row: %#v", row)
	}
	rec, p = call(t, a, http.MethodPost, "/api/v1/payments", `{}`)
	if rec.Code != http.StatusMethodNotAllowed || p["error"].(map[string]any)["code"] != "METHOD_NOT_ALLOWED" {
		t.Fatalf("expected 405: %d %#v", rec.Code, p)
	}
}
