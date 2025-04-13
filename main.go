package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
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

func HashURL(OriginalURL string) string {
	hasher := md5.New()
	hasher.Write([]byte(OriginalURL)) // Converts the url string to a byte slice
	data := hasher.Sum(nil)
	hash := hex.EncodeToString(data)
	fmt.Println("hash url : ", hash[:8])
	return hash[:8]
}

func createURL(originalURL string) string {
	shortURL := HashURL(originalURL)
	id := shortURL
	urlDB[id] = URL{
		ID:           id,
		OriginalURL:  originalURL,
		ShortURL:     shortURL,
		CreationDate: time.Now(),
	}
	return shortURL
}

func getURL(id string) (URL, error) {
	url, ok := urlDB[id]
	if !ok {
		return URL{}, errors.New("URL not found in DB")
	}
	return url, nil
}

func ShortURLHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		URL string `json:"url"`
	}
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	res, err := http.Get(data.URL)
	if err != nil {
		http.Error(w, "Invalid URL ", http.StatusNotFound)
		return
	}

	defer res.Body.Close()

	shortURL := createURL(data.URL)
	response := struct {
		ShortURL string `json:"short_url"`
	}{ShortURL: shortURL}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

func RedirectURLHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/rd/"):]
	url, err := getURL(id)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusNotFound)
	}
	http.Redirect(w, r, url.OriginalURL, http.StatusFound)
}

func main() {
	// fmt.Println("URL shortener code ")

	// Serve static files from the "static" directory
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Handle root ("/") to serve index.html
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./static/index.html")
	})

	// Created handler function to handle all requests to the URL's ("/")
	http.HandleFunc("/sort", ShortURLHandler)
	http.HandleFunc("/rd/", RedirectURLHandler)

	// Start the HTTP server on port
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
