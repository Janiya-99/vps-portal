package ops

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type OpsService struct{}

func NewOpsService() *OpsService {
	return &OpsService{}
}

type BackupArchiveItem struct {
	Filename  string `json:"filename"`
	SizeBytes int64  `json:"size_bytes"`
	SizeHuman string `json:"size_human"`
	CreatedAt string `json:"created_at"`
}

func (o *OpsService) HandleListBackups(w http.ResponseWriter, r *http.Request) {
	dir := "/opt/ops/backups/archives"
	entries, err := os.ReadDir(dir)
	if err != nil {
		// return empty list
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]BackupArchiveItem{})
		return
	}

	archives := make([]BackupArchiveItem, 0)
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql.gz") {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}

		archives = append(archives, BackupArchiveItem{
			Filename:  entry.Name(),
			SizeBytes: info.Size(),
			SizeHuman: formatBytesHuman(info.Size()),
			CreatedAt: info.ModTime().Format("2006-01-02 15:04:05 UTC"),
		})
	}

	// Sort newest first
	sort.Slice(archives, func(i, j int) bool {
		return archives[i].CreatedAt > archives[j].CreatedAt
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(archives)
}

func (o *OpsService) HandleRunBackup(w http.ResponseWriter, r *http.Request) {
	script := "/opt/ops/backups/db-backup.sh"
	if _, err := os.Stat(script); os.IsNotExist(err) {
		http.Error(w, `{"error":"Backup script not found at /opt/ops/backups/db-backup.sh"}`, http.StatusInternalServerError)
		return
	}

	cmd := exec.Command("bash", script)
	output, err := cmd.CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"Backup script failed: %s - %s"}`, err.Error(), string(output)), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Backup script executed successfully",
		"file":    fmt.Sprintf("all_db_%s.sql.gz", time.Now().Format("20060102")),
	})
}

func (o *OpsService) HandleDownloadBackup(w http.ResponseWriter, r *http.Request) {
	filename := chi.URLParam(r, "filename")
	cleanFilename := filepath.Base(filename)

	path := filepath.Join("/opt/ops/backups/archives", cleanFilename)
	file, err := os.Open(path)
	if err != nil {
		http.Error(w, "Archive file not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", cleanFilename))
	w.Header().Set("Content-Type", "application/gzip")
	io.Copy(w, file)
}

func (o *OpsService) HandleDockerPrune(w http.ResponseWriter, r *http.Request) {
	script := "/opt/ops/maintenance/docker-cleanup.sh"
	var output []byte
	var err error

	if _, statErr := os.Stat(script); statErr == nil {
		cmd := exec.Command("bash", script)
		output, err = cmd.CombinedOutput()
	} else {
		// Fallback direct commands
		cmd := exec.Command("docker", "image", "prune", "-af", "--filter", "until=168h")
		output, err = cmd.CombinedOutput()
	}

	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error":"Cleanup error: %s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Docker prune executed successfully",
		"output":  string(output),
	})
}

func formatBytesHuman(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}

