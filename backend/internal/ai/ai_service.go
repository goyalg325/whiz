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
	"strings"
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
	log.Printf("NewGeminiClient called with API key length: %d", len(apiKey))
	if len(apiKey) > 0 {
		log.Printf("API key starts with: %s...", apiKey[:min(10, len(apiKey))])
	}

	useMock := apiKey == "" || apiKey == "mock-api-key"
	log.Printf("UseMockResponses set to: %v (empty: %v, mock-api-key: %v)", useMock, apiKey == "", apiKey == "mock-api-key")

	if useMock {
		log.Println("Using mock responses for Gemini AI - for production, set a valid API key")
	} else {
		log.Println("Using real Gemini API with provided API key")
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

	log.Printf("GenerateMessageContext called - UseMockResponses: %v, APIKey length: %d", g.UseMockResponses, len(g.APIKey))

	// If using mock responses or no API key is set
	if g.UseMockResponses {
		log.Printf("Using mock response because UseMockResponses=true")
		return g.generateMockMessageContext(req)
	}

	log.Printf("Proceeding with real Gemini API call...")

	// Prepare thread context for Gemini
	var threadText string
	for _, msg := range req.Thread {
		timeStr := msg.Timestamp.Format("15:04:05")
		threadText += fmt.Sprintf("[%s] %s: %s\n", timeStr, msg.Username, msg.Content)
	}

	prompt := fmt.Sprintf(
		`You are an intelligent chat assistant helping a user understand the context behind a specific message. 

**Target Message:** "%s"

**Conversation Thread:**
%s

Please provide a well-structured analysis that helps the user understand this message in context. Your response should include:

1. **What this message is about:** Summarize the main point or purpose of this specific message
2. **Conversation context:** What topic or discussion thread is this part of?
3. **Response relationship:** If this message is responding to someone, explain what it's responding to
4. **Significance:** Why is this message important or noteworthy in the conversation?
5. **Key participants:** Who are the main people involved in this discussion?

Format your response to be clear and scannable, using bullet points or short paragraphs. Focus on helping the user quickly understand both the immediate message and its place in the broader conversation flow.`,
		req.MessageText,
		threadText,
	)

	log.Printf("Making Gemini API call with prompt length: %d", len(prompt))
	response, err := g.callGeminiAPI(ctx, prompt)
	if err != nil {
		log.Printf("Error calling Gemini API: %v, falling back to mock", err)
		return g.generateMockMessageContext(req)
	}

	log.Printf("Gemini API call successful, response length: %d", len(response))
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
		`You are an intelligent chat assistant helping a user catch up on missed messages in the "%s" channel. 

Since their last visit on %s, there have been %d new messages. Your task is to provide a meaningful, insightful summary that helps the user quickly understand what happened without overwhelming them.

Messages to analyze:
%s

Please provide a summary that:
1. Identifies the main topics, themes, or conversations that took place
2. Highlights any important decisions, announcements, or action items
3. Notes who the most active participants were
4. Mentions any questions asked that might need the user's attention
5. Captures the overall tone/mood of the conversations (casual chat, serious discussion, problem-solving, etc.)
6. Organizes information by importance rather than chronological order

Keep the summary concise but informative - focus on what the user actually needs to know to feel caught up, not just what was said. Use a friendly, professional tone.`,
		req.ChannelName,
		req.StartTime.Format("Jan 2 at 3:04 PM"),
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
	// Analyze the message and thread to provide a meaningful mock response
	messageText := req.MessageText
	threadCount := len(req.Thread)

	// Try to determine if it's a question, response, or statement
	isQuestion := strings.Contains(strings.ToLower(messageText), "?") ||
		strings.HasPrefix(strings.ToLower(messageText), "how ") ||
		strings.HasPrefix(strings.ToLower(messageText), "what ") ||
		strings.HasPrefix(strings.ToLower(messageText), "why ") ||
		strings.HasPrefix(strings.ToLower(messageText), "when ") ||
		strings.HasPrefix(strings.ToLower(messageText), "where ")

	var analysis string
	if isQuestion {
		analysis = "**Message Type:** Question seeking information or clarification\n\n**Context:** This message is asking for input from the team about a specific topic that came up in the recent discussion."
	} else if strings.Contains(strings.ToLower(messageText), "thanks") || strings.Contains(strings.ToLower(messageText), "got it") {
		analysis = "**Message Type:** Acknowledgment or appreciation\n\n**Context:** This message is responding to help or information provided earlier in the conversation."
	} else {
		analysis = "**Message Type:** Information sharing or discussion contribution\n\n**Context:** This message is contributing new information or perspective to the ongoing discussion."
	}

	threadInfo := ""
	if threadCount > 1 {
		threadInfo = fmt.Sprintf("\n\n**Thread Context:** Part of an active conversation with %d messages. The discussion appears to be focused on collaborative work or problem-solving.", threadCount)
	} else {
		threadInfo = "\n\n**Thread Context:** This appears to be the start of a new conversation topic."
	}

	return fmt.Sprintf("🔍 **Message Analysis**\n\n%s%s\n\n**Significance:** This message helps move the conversation forward by either requesting information, providing updates, or acknowledging team input.\n\n*Note: This is a sample analysis. Enable Gemini AI for detailed contextual understanding.*",
		analysis, threadInfo), nil
}

func (g *GeminiClient) generateMockMissedMessagesSummary(req SummaryRequest) (string, error) {
	// Get some basic info about the messages
	messageCount := len(req.Messages)
	if messageCount == 0 {
		return "No new messages since your last visit.", nil
	}

	// Get unique participants
	participants := make(map[string]bool)
	for _, msg := range req.Messages {
		participants[msg.Username] = true
	}

	participantList := make([]string, 0, len(participants))
	for username := range participants {
		participantList = append(participantList, username)
	}

	// Create a more realistic mock summary
	var summary string
	if messageCount <= 3 {
		summary = fmt.Sprintf("**Main Activity:** Brief conversation between %d participants. The discussion covered general topics and casual chat.", len(participantList))
	} else if messageCount <= 10 {
		summary = fmt.Sprintf("**Main Topics:** Active discussion with %d participants (%s and others) covering several topics. Key conversations included project updates and general coordination.", len(participantList), participantList[0])
	} else {
		summary = fmt.Sprintf("**Busy Period:** High activity with %d messages from %d participants. Main themes included ongoing project discussions, planning sessions, and team coordination. %s was particularly active in driving conversations.", messageCount, len(participantList), participantList[0])
	}

	return fmt.Sprintf("📊 **Channel Update for #%s**\n\n%s\n\n**Period:** %s to %s\n**Messages:** %d total\n**Participants:** %s\n\n*Note: This is a sample summary. Enable Gemini AI for detailed analysis.*",
		req.ChannelName,
		summary,
		req.StartTime.Format("Jan 2 at 3:04 PM"),
		req.EndTime.Format("3:04 PM"),
		messageCount,
		fmt.Sprintf("%v", participantList)), nil
}
