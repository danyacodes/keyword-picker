export const MessageType = {
  IsSidePanelOpen: "IS_SIDE_PANEL_OPEN",
  WordSelected: "WORD_SELECTED",
  WordDeselected: "WORD_DESELECTED",
  GetPageUrl: "GET_PAGE_URL",
  GetCssText: "GET_CSS_TEXT",
  ClearHighlights: "CLEAR_HIGHLIGHTS",
  RemoveWordHighlights: "REMOVE_WORD_HIGHLIGHTS",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];
