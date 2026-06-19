import { MessageType } from "../shared/messages";

let sidePanelOpen = false;
const sidePanelPorts = new Set<chrome.runtime.Port>();

function setSidePanelOpen(open: boolean): void {
  sidePanelOpen = open;
}

// Open side panel on extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    setSidePanelOpen(true);
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "sidepanel") return;

  sidePanelPorts.add(port);
  setSidePanelOpen(true);

  port.onDisconnect.addListener(() => {
    sidePanelPorts.delete(port);
    if (sidePanelPorts.size === 0) {
      setSidePanelOpen(false);
    }
  });
});

// Relay messages between content script and side panel
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === MessageType.IsSidePanelOpen) {
    sendResponse({ open: sidePanelOpen });
    return;
  }

  if (message.type === MessageType.WordSelected) {
    // Forward to side panel
    chrome.runtime.sendMessage(message).catch(() => {
      // Side panel might not be open yet
    });
  }

  if (message.type === MessageType.GetPageUrl) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0]?.url || "" });
    });
    return true; // async response
  }

  if (message.type === MessageType.GetCssText) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
          sendResponse(response);
        });
      }
    });
    return true;
  }

  if (message.type === MessageType.ClearHighlights) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }

  if (message.type === MessageType.RemoveWordHighlights) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
});
