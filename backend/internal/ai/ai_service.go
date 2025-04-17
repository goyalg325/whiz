package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

const (
	geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
)

type GeminiClient struct {
	APIKey           string
	UseMockResponses bool
}

type SummaryRequest struct {
	Messages    []Message
	StartTime   time.Time
	EndTime     time.Time
	ChannelName string
}

type ContextRequest struct {
	MessageID   int
	MessageText string
	Thread      []Message
}

type Message struct {
	ID        int
	UserID    int
	Username  string
	Content   string
	Timestamp time.Time
}

// Gemini API request structure
type GeminiRequest struct {
	Contents []Content `json:"contents"`
}

type Content struct {
	Parts []Part `json:"parts"`
}

type Part struct {
	Text string `json:"text"`
}

// Gemini API response structure
type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func NewGeminiClient(apiKey string) *GeminiClient {
	useMock := apiKey == "" || apiKey == "mock-api-key"

	if useMock {
		log.Println("Using mock responses for Gemini AI - for production, set a valid API key")
	}

	return &GeminiClient{
		APIKey:           apiKey,
		UseMockResponses: useMock,
	}
}

func (g *GeminiClient) GenerateSummary(ctx context.Context, req SummaryRequest) (string, error) {
	if len(req.Messages) == 0 {
		return "", errors.New("no messages to summarize")
	}

	// If using mock responses or no API key is set
	if g.UseMockResponses {
		return g.generateMockSummary(req)
	}

	// Prepare conversation history for Gemini
	var conversationText string
	for _, msg := range req.Messages {
		timeStr := msg.Timestamp.Format("15:04:05")
		conversationText += fmt.Sprintf("[%s] %s: %s\n", timeStr, msg.Username, msg.Content)
	}

	prompt := fmt.Sprintf(
		"Please summarize the following conversation that occurred in the channel '%s' from %s to %s:\n\n%s",
		req.ChannelName,
		req.StartTime.Format("Jan 2 15:04"),
		req.EndTime.Format("Jan 2 15:04"),
		conversationText,
	)

	response, err := g.callGeminiAPI(ctx, prompt)
	if err != nil {
		log.Printf("Error calling Gemini API: %v, falling back to mock", err)
		return g.generateMockSummary(req)
	}

	return response, nil
}

func (g *GeminiClient) GenerateMessageContext(ctx context.Context, req ContextRequest) (string, error) {
	if req.MessageID == 0 || req.MessageText == "" {
		return "", errors.New("invalid message information")
	}

	// If using mock responses or no API key is set
	if g.UseMockResponses {
		return g.generateMockMessageContext(req)
	}

	// Prepare thread context for Gemini
	var threadText string
	for _, msg := range req.Thread {
		timeStr := msg.Timestamp.Format("15:04:05")
		threadText += fmt.Sprintf("[%s] %s: %s\n", timeStr, msg.Username, msg.Content)
	}

	prompt := fmt.Sprintf(
		"I need context for the following message: \"%s\"\n\nHere's the conversation thread it's part of:\n\n%s\n\nProvide a brief analysis explaining what this message is about, what it's responding to, and its significance in the conversation.",
		req.MessageText,
		threadText,
	)

	response, err := g.callGeminiAPI(ctx, prompt)
	if err != nil {
		log.Printf("Error calling Gemini API: %v, falling back to mock", err)
		return g.generateMockMessageContext(req)
	}

	return response, nil
}

func (g *GeminiClient) GenerateMissedMessagesSummary(ctx context.Context, req SummaryRequest) (string, error) {
	if len(req.Messages) == 0 {
		return "No new messages since your last visit.", nil
	}

	// If using mock responses or no API key is set
	if g.UseMockResponses {
		return g.generateMockMissedMessagesSummary(req)
	}

	// Prepare missed messages for Gemini
	var messagesText string
	for _, msg := range req.Messages {
		timeStr := msg.Timestamp.Format("15:04:05")
		messagesText += fmt.Sprintf("[%s] %s: %s\n", timeStr, msg.Username, msg.Content)
	}

	prompt := fmt.Sprintf(
		"Since the user last visited the channel '%s' on %s, there have been %d new messages. Here they are:\n\n%s\n\nPlease provide a concise summary of what the user missed.",
		req.ChannelName,
		req.StartTime.Format("Jan 2 15:04"),
		len(req.Messages),
		messagesText,
	)

	response, err := g.callGeminiAPI(ctx, prompt)
	if err != nil {
		log.Printf("Error calling Gemini API: %v, falling back to mock", err)
		return g.generateMockMissedMessagesSummary(req)
	}

	return response, nil
}

// Helper function to call Gemini API
func (g *GeminiClient) callGeminiAPI(ctx context.Context, prompt string) (string, error) {
	// The API key should be passed as a query parameter, not in the URL itself
	url := fmt.Sprintf("%s?key=%s", geminiEndpoint, g.APIKey)

	log.Printf("Making Gemini API call to: %s", geminiEndpoint)
	log.Printf("Using API key starting with: %s...", g.APIKey[:min(5, len(g.APIKey))])

	// Prepare request body
	reqBody := GeminiRequest{
		Contents: []Content{
			{
				Parts: []Part{
					{
						Text: prompt,
					},
				},
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		log.Printf("Error marshaling request: %v", err)
		return "", fmt.Errorf("error marshaling request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error creating request: %v", err)
		return "", fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	// Send request
	log.Printf("Sending request to Gemini API...")
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending request: %v", err)
		return "", fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %v", err)
		return "", fmt.Errorf("error reading response: %w", err)
	}

	log.Printf("Received response with status: %d", resp.StatusCode)
	if resp.StatusCode != http.StatusOK {
		log.Printf("API error response: %s", string(body))
		return "", fmt.Errorf("API returned non-200 status: %d, body: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var geminiResp GeminiResponse
	err = json.Unmarshal(body, &geminiResp)
	if err != nil {
		log.Printf("Error unmarshaling response: %v, response body: %s", err, string(body))
		return "", fmt.Errorf("error unmarshaling response: %w", err)
	}

	// Extract text from response
	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		log.Printf("Empty response from Gemini API: %s", string(body))
		return "", errors.New("empty response from Gemini API")
	}

	log.Printf("Successfully extracted text from Gemini API response")
	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

// Helper function for safe substring
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Mock response generators
func (g *GeminiClient) generateMockSummary(req SummaryRequest) (string, error) {
	return fmt.Sprintf("Here's a summary of the conversation in %s from %s to %s: [AI-generated summary would appear here, summarizing %d messages]",
		req.ChannelName,
		req.StartTime.Format("Jan 2 15:04"),
		req.EndTime.Format("Jan 2 15:04"),
		len(req.Messages)), nil
}

func (g *GeminiClient) generateMockMessageContext(req ContextRequest) (string, error) {
	return "This message is part of a discussion about [topic]. It was in response to a question about [subject]. " +
		"The conversation started with [context] and is currently focused on [current focus].", nil
}

func (g *GeminiClient) generateMockMissedMessagesSummary(req SummaryRequest) (string, error) {
	return fmt.Sprintf("Since you last visited %s on %s, there have been %d new messages. Here's what you missed: [AI-generated summary of missed content]",
		req.ChannelName,
		req.StartTime.Format("Jan 2 15:04"),
		len(req.Messages)), nil
}
