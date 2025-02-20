// background.js - Ensures content.js is injected properly and handles communication with FastAPI

chrome.runtime.onInstalled.addListener(() => {
    console.log("Background script loaded and running.");
});

chrome.runtime.onStartup.addListener(() => {
    console.log("Extension started. Background script running.");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.url.includes("search.google.com/")) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
        }).then(() => {
            console.log("Successfully injected content.js into:", tab.url);
        }).catch((error) => {
            console.error("Failed to inject content.js:", error);
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background.js:", message);

    if (message.command === "checkSimilarity") {
        console.log("Forwarding similarity request to FastAPI...");
        fetch("http://127.0.0.1:8000/cosine-similarity/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: message.url,
                keywords: message.queries
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Received response from FastAPI:", data);
            chrome.runtime.sendMessage({ results: data }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to popup:", chrome.runtime.lastError);
                }
            });
        })
        .catch(error => {
            console.error("Error communicating with FastAPI:", error);
            chrome.runtime.sendMessage({ error: "Failed to connect to FastAPI." }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending error message to popup:", chrome.runtime.lastError);
                }
            });
        });

        sendResponse({ status: "processing" });
        return true;

    }
});
