package main

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
)

var adminResources = []string{"businesses", "customers", "services", "orders", "team", "expenses"}

func (a *API) adminHTTP(w http.ResponseWriter, r *http.Request, rid string, parts []string) {
	if !a.authorizeAdmin(w, r, rid) {
		return
	}
	if a.store.db == nil {
		a.fail(w, r, rid, http.StatusServiceUnavailable, "ADMIN_REQUIRES_DATABASE", "Admin operations require persistent storage", nil)
		return
	}
	if len(parts) == 1 {
		switch parts[0] {
		case "overview":
			if r.Method != http.MethodGet {
				a.methodNotAllowed(w, r, rid, "GET")
				return
			}
			a.adminOverview(w, r, rid)
		case "accounts":
			a.adminAccounts(w, r, rid, parts[1:])
		case "usage":
			if r.Method != http.MethodGet {
				a.methodNotAllowed(w, r, rid, "GET")
				return
			}
			a.adminUsage(w, r, rid)
		case "health":
			if r.Method != http.MethodGet {
				a.methodNotAllowed(w, r, rid, "GET")
				return
			}
			a.adminHealth(w, r, rid)
		case "audit":
			if r.Method != http.MethodGet {
				a.methodNotAllowed(w, r, rid, "GET")
				return
			}
			a.adminAudit(w, r, rid)
		default:
			a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Admin endpoint not found", nil)
		}
		return
	}
	if parts[0] == "accounts" {
		a.adminAccounts(w, r, rid, parts[1:])
		return
	}
	a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Admin endpoint not found", nil)
}

func (a *API) adminHealth(w http.ResponseWriter, r *http.Request, rid string) {
	database := "healthy"
	if err := a.store.db.PingContext(r.Context()); err != nil {
		database = "unavailable"
	}
	accountsURL := a.accountsURL
	if accountsURL == "" {
		accountsURL = os.Getenv("CAMEL_ACCOUNTS_URL")
	}
	if accountsURL == "" {
		accountsURL = "https://accounts.camelcreatives.com"
	}
	accountsState := "configured"
	if strings.TrimSpace(accountsURL) == "" {
		accountsState = "not_configured"
	}
	status := "healthy"
	if database != "healthy" {
		status = "degraded"
	}
	uptime := int64(0)
	if !a.startedAt.IsZero() {
		uptime = int64(time.Since(a.startedAt).Seconds())
	}
	a.write(w, http.StatusOK, Record{"status": status, "database": database, "camel_accounts": accountsState, "admin_api": "enabled", "uptime_seconds": uptime, "checked_at": time.Now().UTC().Format(time.RFC3339)}, rid, nil)
}

func (a *API) authorizeAdmin(w http.ResponseWriter, r *http.Request, rid string) bool {
	expected := strings.TrimSpace(os.Getenv("SIMAMIA_ADMIN_TOKEN"))
	provided := r.Header.Get("X-Simamia-Admin-Key")
	if len(expected) < 32 {
		a.fail(w, r, rid, http.StatusServiceUnavailable, "ADMIN_DISABLED", "Admin API is not configured", nil)
		return false
	}
	if len(provided) != len(expected) || subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) != 1 {
		a.fail(w, r, rid, http.StatusUnauthorized, "ADMIN_UNAUTHORIZED", "Admin authentication required", nil)
		return false
	}
	return true
}

func (a *API) adminOverview(w http.ResponseWriter, r *http.Request, rid string) {
	a.store.mu.RLock()
	defer a.store.mu.RUnlock()
	accounts := map[string]Record{}
	resourceCounts := Record{}
	for _, resource := range adminResources {
		rows := a.store.tables[resource]
		resourceCounts[resource] = len(rows)
		for _, row := range rows {
			owner := strings.TrimSpace(fmt.Sprint(row["owner_sub"]))
			if owner == "" || owner == "<nil>" {
				continue
			}
			entry, ok := accounts[owner]
			if !ok {
				entry = Record{"owner_sub": owner, "record_count": 0, "resources": Record{}, "business_name": ""}
				accounts[owner] = entry
			}
			entry["record_count"] = number(entry["record_count"]) + 1
			counts := entry["resources"].(Record)
			counts[resource] = number(counts[resource]) + 1
			if resource == "businesses" && entry["business_name"] == "" {
				name := row["businessName"]
				if name == nil {
					name = row["name"]
				}
				if name != nil {
					entry["business_name"] = name
				}
			}
		}
	}
	total := 0
	for _, account := range accounts {
		total += int(number(account["record_count"]))
	}
	a.write(w, http.StatusOK, Record{"account_count": len(accounts), "record_count": total, "resources": resourceCounts, "database": "sqlite", "admin_enabled": true}, rid, nil)
}

func (a *API) adminAccounts(w http.ResponseWriter, r *http.Request, rid string, parts []string) {
	if len(parts) == 0 {
		if r.Method != http.MethodGet {
			a.methodNotAllowed(w, r, rid, "GET")
			return
		}
		a.adminAccountList(w, r, rid)
		return
	}
	owner := parts[0]
	if owner == "" || strings.Contains(owner, "/") {
		a.fail(w, r, rid, http.StatusBadRequest, "INVALID_ACCOUNT", "Account subject is invalid", nil)
		return
	}
	if len(parts) == 1 {
		if r.Method != http.MethodGet {
			a.methodNotAllowed(w, r, rid, "GET")
			return
		}
		account, ok := a.adminAccount(owner)
		if !ok {
			a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Simamia account not found", nil)
			return
		}
		a.write(w, http.StatusOK, account, rid, nil)
		return
	}
	resource := parts[1]
	if resource == "payments" {
		a.fail(w, r, rid, http.StatusMethodNotAllowed, "READ_ONLY", "Payments are derived from orders and cannot be edited", Record{"allow": "GET"})
		return
	}
	if !containsString(adminResources, resource) {
		a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Admin resource not found", nil)
		return
	}
	if len(parts) == 2 {
		a.adminAccountCollection(w, r, rid, owner, resource)
		return
	}
	if len(parts) == 3 {
		a.adminAccountItem(w, r, rid, owner, resource, parts[2])
		return
	}
	a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Admin endpoint not found", nil)
}

func (a *API) adminAccountList(w http.ResponseWriter, r *http.Request, rid string) {
	a.store.mu.RLock()
	defer a.store.mu.RUnlock()
	byOwner := map[string]Record{}
	for _, resource := range adminResources {
		for _, row := range a.store.tables[resource] {
			owner := strings.TrimSpace(fmt.Sprint(row["owner_sub"]))
			if owner == "" || owner == "<nil>" {
				continue
			}
			entry := byOwner[owner]
			if entry == nil {
				entry = Record{"owner_sub": owner, "record_count": 0, "business_name": "", "resources": Record{}}
				byOwner[owner] = entry
			}
			entry["record_count"] = number(entry["record_count"]) + 1
			counts := entry["resources"].(Record)
			counts[resource] = number(counts[resource]) + 1
			if resource == "businesses" && entry["business_name"] == "" {
				name := row["businessName"]
				if name == nil {
					name = row["name"]
				}
				if name != nil {
					entry["business_name"] = name
				}
			}
		}
	}
	q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	list := make([]Record, 0, len(byOwner))
	for _, entry := range byOwner {
		if q != "" && !strings.Contains(strings.ToLower(fmt.Sprint(entry["owner_sub"])+" "+fmt.Sprint(entry["business_name"])), q) {
			continue
		}
		list = append(list, entry)
	}
	sort.Slice(list, func(i, j int) bool { return fmt.Sprint(list[i]["owner_sub"]) < fmt.Sprint(list[j]["owner_sub"]) })
	page, size := parsePositive(r.URL.Query().Get("page"), 1), parsePositive(r.URL.Query().Get("page_size"), 50)
	if size > 200 {
		size = 200
	}
	start := min((page-1)*size, len(list))
	end := min(start+size, len(list))
	a.write(w, http.StatusOK, list[start:end], rid, Record{"pagination": Record{"page": page, "page_size": size, "total": len(list), "total_pages": (len(list) + size - 1) / size}})
}

func (a *API) adminAccount(owner string) (Record, bool) {
	a.store.mu.RLock()
	defer a.store.mu.RUnlock()
	account := Record{"owner_sub": owner, "record_count": 0, "business_name": "", "businesses": []Record{}, "resources": Record{}}
	found := false
	for _, resource := range adminResources {
		for _, row := range a.store.tables[resource] {
			if row["owner_sub"] != owner {
				continue
			}
			found = true
			account["record_count"] = number(account["record_count"]) + 1
			counts := account["resources"].(Record)
			counts[resource] = number(counts[resource]) + 1
			if resource == "businesses" {
				account["businesses"] = append(account["businesses"].([]Record), cloneRecord(row))
				if account["business_name"] == "" {
					name := row["businessName"]
					if name == nil {
						name = row["name"]
					}
					if name != nil {
						account["business_name"] = name
					}
				}
			}
		}
	}
	return account, found
}

func (a *API) adminAccountCollection(w http.ResponseWriter, r *http.Request, rid, owner, resource string) {
	switch r.Method {
	case http.MethodGet:
		q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
		page, size := parsePositive(r.URL.Query().Get("page"), 1), parsePositive(r.URL.Query().Get("page_size"), 50)
		if size > 200 {
			size = 200
		}
		a.store.mu.RLock()
		rows := make([]Record, 0)
		for _, row := range a.store.tables[resource] {
			if row["owner_sub"] != owner {
				continue
			}
			if q != "" {
				blob, _ := json.Marshal(row)
				if !strings.Contains(strings.ToLower(string(blob)), q) {
					continue
				}
			}
			rows = append(rows, cloneRecord(row))
		}
		a.store.mu.RUnlock()
		total := len(rows)
		start := min((page-1)*size, total)
		end := min(start+size, total)
		a.write(w, http.StatusOK, rows[start:end], rid, Record{"pagination": Record{"page": page, "page_size": size, "total": total, "total_pages": (total + size - 1) / size}})
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
		id := a.store.nextID(resource)
		in["id"] = id
		in["owner_sub"] = owner
		if resource == "businesses" {
			in["ownerSub"] = owner
		}
		if resource == "orders" {
			if in["currency"] == nil {
				in["currency"] = "TZS"
			}
			if in["status"] == nil {
				in["status"] = "New"
			}
			if in["paid"] == nil {
				in["paid"] = 0
			}
		}
		if resource == "services" {
			if in["currency"] == nil {
				in["currency"] = "TZS"
			}
			if in["active"] == nil {
				in["active"] = true
			}
		}
		if err := a.store.insert(resource, in); err != nil {
			a.store.mu.Unlock()
			a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not save record", nil)
			return
		}
		a.store.tables[resource] = append([]Record{in}, a.store.tables[resource]...)
		a.store.mu.Unlock()
		a.audit(r, "create", resource, id, owner, recordFields(in))
		slog.Info("admin_record_created", "resource", resource, "record_id", id)
		a.write(w, http.StatusCreated, in, rid, nil)
	default:
		a.methodNotAllowed(w, r, rid, "GET, POST")
	}
}

func (a *API) adminAccountItem(w http.ResponseWriter, r *http.Request, rid, owner, resource, id string) {
	switch r.Method {
	case http.MethodGet:
		a.store.mu.RLock()
		row := cloneRecord(findOwned(a.store.tables[resource], id, owner))
		a.store.mu.RUnlock()
		if row == nil {
			a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Record not found", nil)
			return
		}
		a.write(w, http.StatusOK, row, rid, nil)
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
		var updated Record
		for i, row := range a.store.tables[resource] {
			if row["id"] != id || row["owner_sub"] != owner {
				continue
			}
			updated = make(Record, len(row)+len(patch))
			for k, v := range row {
				updated[k] = v
			}
			for k, v := range patch {
				updated[k] = v
			}
			if err := validate(resource, updated); err != nil {
				a.store.mu.Unlock()
				a.fail(w, r, rid, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error(), nil)
				return
			}
			if err := a.store.replace(resource, id, updated); err != nil {
				a.store.mu.Unlock()
				a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not update record", nil)
				return
			}
			a.store.tables[resource][i] = updated
			break
		}
		a.store.mu.Unlock()
		if updated == nil {
			a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Record not found", nil)
			return
		}
		a.audit(r, "update", resource, id, owner, recordFields(patch))
		slog.Info("admin_record_updated", "resource", resource, "record_id", id)
		a.write(w, http.StatusOK, updated, rid, nil)
	case http.MethodDelete:
		a.store.mu.Lock()
		rows := a.store.tables[resource]
		deleted := false
		for i, row := range rows {
			if row["id"] == id && row["owner_sub"] == owner {
				if err := a.store.remove(resource, id); err != nil {
					a.store.mu.Unlock()
					a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not delete record", nil)
					return
				}
				a.store.tables[resource] = append(rows[:i], rows[i+1:]...)
				deleted = true
				break
			}
		}
		a.store.mu.Unlock()
		if !deleted {
			a.fail(w, r, rid, http.StatusNotFound, "NOT_FOUND", "Record not found", nil)
			return
		}
		a.audit(r, "delete", resource, id, owner, nil)
		slog.Info("admin_record_deleted", "resource", resource, "record_id", id)
		a.write(w, http.StatusOK, Record{"id": id, "deleted": true}, rid, nil)
	default:
		a.methodNotAllowed(w, r, rid, "GET, PATCH, DELETE")
	}
}

func (a *API) adminUsage(w http.ResponseWriter, r *http.Request, rid string) {
	rows, err := a.store.db.Query(`SELECT resource, COUNT(*), COALESCE(SUM(length(payload)),0), COALESCE(SUM(CASE WHEN created_at >= datetime('now','-30 days') THEN 1 ELSE 0 END),0), MAX(updated_at) FROM records GROUP BY resource`)
	if err != nil {
		a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not read usage", nil)
		return
	}
	defer rows.Close()
	resources := Record{}
	totalRecords, totalBytes, recent := 0, 0, 0
	for rows.Next() {
		var name, latest string
		var count, bytes, recentCount int
		if err := rows.Scan(&name, &count, &bytes, &recentCount, &latest); err != nil {
			a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not read usage", nil)
			return
		}
		resources[name] = Record{"records": count, "payload_bytes": bytes, "created_last_30_days": recentCount, "last_updated": latest}
		totalRecords += count
		totalBytes += bytes
		recent += recentCount
	}
	if err := rows.Err(); err != nil {
		a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not read usage", nil)
		return
	}
	var auditCount int
	_ = a.store.db.QueryRow(`SELECT COUNT(*) FROM admin_audit`).Scan(&auditCount)
	a.write(w, http.StatusOK, Record{"records": totalRecords, "payload_bytes": totalBytes, "created_last_30_days": recent, "admin_mutations": auditCount, "resources": resources, "sampled_at": time.Now().UTC().Format(time.RFC3339)}, rid, nil)
}

func (a *API) adminAudit(w http.ResponseWriter, r *http.Request, rid string) {
	page, size := parsePositive(r.URL.Query().Get("page"), 1), parsePositive(r.URL.Query().Get("page_size"), 50)
	if size > 200 {
		size = 200
	}
	rows, err := a.store.db.Query(`SELECT id,actor,action,resource,record_id,owner_sub,occurred_at,changed_fields FROM admin_audit ORDER BY id DESC LIMIT ? OFFSET ?`, size, (page-1)*size)
	if err != nil {
		a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not read audit log", nil)
		return
	}
	defer rows.Close()
	items := make([]Record, 0, size)
	for rows.Next() {
		var id int64
		var actor, action, resource, recordID, owner, occurred, fields string
		if err := rows.Scan(&id, &actor, &action, &resource, &recordID, &owner, &occurred, &fields); err != nil {
			a.fail(w, r, rid, http.StatusInternalServerError, "STORAGE_ERROR", "Could not read audit log", nil)
			return
		}
		var changed []string
		_ = json.Unmarshal([]byte(fields), &changed)
		items = append(items, Record{"id": id, "actor": actor, "action": action, "resource": resource, "record_id": recordID, "owner_sub": owner, "occurred_at": occurred, "changed_fields": changed})
	}
	var total int
	_ = a.store.db.QueryRow(`SELECT COUNT(*) FROM admin_audit`).Scan(&total)
	a.write(w, http.StatusOK, items, rid, Record{"pagination": Record{"page": page, "page_size": size, "total": total, "total_pages": (total + size - 1) / size}})
}

func (a *API) audit(r *http.Request, action, resource, id, owner string, fields []string) {
	actor := strings.TrimSpace(os.Getenv("SIMAMIA_ADMIN_ACTOR"))
	if actor == "" {
		actor = "simamia-admin"
	}
	encoded, _ := json.Marshal(fields)
	if _, err := a.store.db.Exec(`INSERT INTO admin_audit(actor,action,resource,record_id,owner_sub,occurred_at,changed_fields) VALUES(?,?,?,?,?,?,?)`, actor, action, resource, id, owner, time.Now().UTC().Format(time.RFC3339), string(encoded)); err != nil {
		slog.Error("admin_audit_write_failed", "action", action, "resource", resource, "error", err)
	}
}

func recordFields(record Record) []string {
	fields := make([]string, 0, len(record))
	for key := range record {
		if key != "id" && key != "owner_sub" && key != "ownerSub" {
			fields = append(fields, key)
		}
	}
	sort.Strings(fields)
	return fields
}
func containsString(items []string, item string) bool {
	for _, value := range items {
		if value == item {
			return true
		}
	}
	return false
}

func cloneRecord(record Record) Record {
	if record == nil {
		return nil
	}
	cloned := make(Record, len(record))
	for key, value := range record {
		cloned[key] = value
	}
	return cloned
}
