package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"
)

type URL struct {
	ID           string    `json:"id"`
	OriginalURL  string    `json:"original_url"`
	ShortURL     string    `json:"short_url"`
	CreationDate time.Time `json:"creation_date"`
}

var urlDB = make(map[string]URL)

func generateShortURL(originalURL string) string {
	hasher := md5.New()
	hasher.Write([]byte(originalURL))
	hash := hex.EncodeToString(hasher.Sum(nil))
	return hash[:5]
}

func createURL(originalURL string) (string, error) {
    if _, err := url.ParseRequestURI(originalURL); err != nil {
        return "", errors.New("invalid URL")
    }

    // Check if the original URL already exists in the DB
    for _, u := range urlDB {
        if u.OriginalURL == originalURL {
            return u.ShortURL, nil // Return the existing short URL
        }
    }

    shortURL := generateShortURL(originalURL)
    id := shortURL

    // Check for hash collision (for very unlikely cases)
    if _, ok := urlDB[id]; ok {
        return "", errors.New("hash collision")
    }

    // Save the new URL in the database
    urlDB[id] = URL{
        ID:           id,
        OriginalURL:  originalURL,
        ShortURL:     shortURL,
        CreationDate: time.Now(),
    }
    return shortURL, nil
}


func getURL(id string) (URL, error) {
	url, ok := urlDB[id]
	if !ok {
		return URL{}, errors.New("URL not found in DB")
	}
	return url, nil
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		if len(r.URL.Path) > 1 {
			shortURL := r.URL.Path[1:]
			if len(shortURL) == 5 {
				url, err := getURL(shortURL)
				if err != nil {
					http.Error(w, "Page Not Found", http.StatusNotFound)
					return
				}
				http.Redirect(w, r, url.OriginalURL, http.StatusFound)
				return
			} else {
				http.Error(w, "Page Not Found", http.StatusNotFound)
				return
			}
		} else {
			http.ServeFile(w, r, "./static/index.html")
			return
		}
	} else if r.Method == http.MethodPost {
		var data struct {
			URL string `json:"url"`
		}
		err := json.NewDecoder(r.Body).Decode(&data)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		shortURL, err := createURL(data.URL)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		response := struct {
			ShortURL string `json:"short_url"`
		}{ShortURL: shortURL}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
		return
	} else {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
}

func main() {
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.HandleFunc("/", handleRoot)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	fmt.Println("Starting server on port ...", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		fmt.Println("Error on starting server:", err)
	}
}
