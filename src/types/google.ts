export type GoogleTaskStatus = "needsAction" | "completed";

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
  selfLink?: string;
}

export interface GoogleTask {
  id: string;
  title?: string;
  notes?: string;
  status?: GoogleTaskStatus;
  due?: string;
  completed?: string;
  updated?: string;
  deleted?: boolean;
  hidden?: boolean;
  parent?: string;
  position?: string;
  webViewLink?: string;
}

export interface GoogleEventDate {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  htmlLink?: string;
  start?: GoogleEventDate;
  end?: GoogleEventDate;
  updated?: string;
}

export type CalendarAccessRole = "none" | "freeBusyReader" | "reader" | "writer" | "owner";

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  selected?: boolean;
  accessRole?: CalendarAccessRole;
  timeZone?: string;
}

export interface GoogleListResponse<T> {
  items?: T[];
  nextPageToken?: string;
  nextSyncToken?: string;
}
