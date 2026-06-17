let sidePanelOpen = false
const sidePanelPorts = new Set<chrome.runtime.Port>()

function setSidePanelOpen(open: boolean): void {
  sidePanelOpen = open
}

// Open side panel on extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    setSidePanelOpen(true)
    chrome.sidePanel.open({ tabId: tab.id })
  }
})

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sidepanel') return

  sidePanelPorts.add(port)
  setSidePanelOpen(true)

  port.onDisconnect.addListener(() => {
    sidePanelPorts.delete(port)
    if (sidePanelPorts.size === 0) {
      setSidePanelOpen(false)
    }
  })
})

// Relay messages between content script and side panel
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === 'IS_SIDE_PANEL_OPEN') {
    sendResponse({ open: sidePanelOpen })
    return
  }

  if (message.type === 'WORD_SELECTED') {
    // Forward to side panel
    chrome.runtime.sendMessage(message).catch(() => {
      // Side panel might not be open yet
    })
  }

  if (message.type === 'GET_PAGE_URL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0]?.url || '' })
    })
    return true // async response
  }

  if (message.type === 'GET_CSS_TEXT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
          sendResponse(response)
        })
      }
    })
    return true
  }

  if (message.type === 'CLEAR_HIGHLIGHTS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message)
      }
    })
  }

  if (message.type === 'REMOVE_WORD_HIGHLIGHTS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message)
      }
    })
  }
})
