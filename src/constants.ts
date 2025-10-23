/**
 * Globale Konstanten für die relationship-app
 */

// Modul-Identifikator
export const MODULE_ID = "relationship-app";

// Modul-Identifikator-Prefix
export const MODULE_ID_PREFIX = `[${MODULE_ID}] |`;

// Modul-Name für Anzeige
export const MODULE_NAME = "Relationship App";

// Modul-Version - wird dynamisch aus module.json gelesen
// Verwendung: game?.modules?.get(MODULE_ID)?.version

// Modul-Metadata-Key
export const MODULE_METADATA_KEY = "metadata";

// Settings-Keys
export const SETTINGS_KEYS = {
  DEBUG_LOGS: "debugLogs",
  METADATA: "metadata",
} as const;

// Service Names
export const SERVICE_NAMES = {
  FOUNDRY_ADAPTER: "foundryAdapter",
  LOGGER: "logger",
  ERROR_HANDLER: "errorHandler",
  NOTIFICATION_SERVICE: "notificationService",
  SERVICE_CONTAINER: "serviceContainer",
  SERVICE_REGISTRAR: "serviceRegistrar",
  API_MANAGER: "apiManager",
  GRAPH_SERVICE: "graphService",
  GRAPH_REPOSITORY: "graphRepository",
  ID_GENERATOR: "idGenerator",
  TIME_SOURCE: "timeSource",
  DEBUG_HELPERS: "debugHelpers",
} as const;

// CSS Classes
export const CSS_CLASSES = {
  DYNAMIC_DIALOG: "dynamic-dialog",
  DYNAMIC_TABLE: "dynamic-table",
  METADATA_MANAGEMENT: "metadata-management",
  RELATIONSHIP_GRAPH: "relationship-graph",
} as const;

// Application IDs
export const APP_IDS = {
  DYNAMIC_DIALOG: "DynamicDialogApp",
  DYNAMIC_TABLE: "DynamicTableApp",
  METADATA_MANAGEMENT: "MetadataManagementApplication",
  RELATIONSHIP_GRAPH: "JournalEntryPageRelationshipGraphSheet",
} as const;

// Module References
export const MODULE_REFERENCES = {
  MODULE_ID: "relationship-app",
  MODULE_NAME: "relationship-app",
} as const;

// Legacy CSS-Klassen (deprecated - use CSS_CLASSES above)
export const LEGACY_CSS_CLASSES = {
  // Haupt-Container
  mainContainer: "relationship-app",

  // Beziehungsgraph
  relationshipGraph: "relationship-graph",

  // Knoten
  node: "relationship-node",
  nodeSelected: "relationship-node-selected",

  // Kanten
  edge: "relationship-edge",
  edgeSelected: "relationship-edge-selected",

  // Toolbar
  toolbar: "relationship-toolbar",

  // Formulare
  form: "relationship-form",
  formGroup: "form-group",
  formLabel: "form-label",
  formInput: "form-input",
  formButton: "form-button",
};

// Event-Namen
export const EVENTS = {
  // Beziehungsgraph-Events
  relationshipGraphUpdated: "relationship-graph-updated",
  nodeSelected: "node-selected",
  edgeSelected: "edge-selected",

  // Daten-Events
  dataLoaded: "data-loaded",
  dataSaved: "data-saved",

  // UI-Events
  viewChanged: "view-changed",
  settingsChanged: "settings-changed",
};

// API-Endpunkte
export const API_ENDPOINTS = {
  // Beziehungsdaten
  relationships: "/api/relationships",

  // Metadaten
  metadata: "/api/metadata",

  // Export/Import
  export: "/api/export",
  import: "/api/import",
};

// Validierungsregeln
export const VALIDATION_RULES = {
  // Minimale Länge für Namen
  minNameLength: 1,

  // Maximale Länge für Namen
  maxNameLength: 100,

  // Minimale Länge für Beschreibungen
  minDescriptionLength: 0,

  // Maximale Länge für Beschreibungen
  maxDescriptionLength: 1000,
};

// Standard-Fehlermeldungen
export const ERROR_MESSAGES = {
  // Allgemeine Fehler
  generalError: "Ein unerwarteter Fehler ist aufgetreten.",

  // Validierungsfehler
  validationError: "Die eingegebenen Daten sind ungültig.",

  // Netzwerkfehler
  networkError: "Netzwerkfehler beim Laden der Daten.",

  // Speicherfehler
  saveError: "Fehler beim Speichern der Daten.",

  // Lade-Fehler
  loadError: "Fehler beim Laden der Daten.",
};

// Erfolgsmeldungen
export const SUCCESS_MESSAGES = {
  // Speichern erfolgreich
  saveSuccess: "Daten wurden erfolgreich gespeichert.",

  // Löschen erfolgreich
  deleteSuccess: "Element wurde erfolgreich gelöscht.",

  // Import erfolgreich
  importSuccess: "Daten wurden erfolgreich importiert.",

  // Export erfolgreich
  exportSuccess: "Daten wurden erfolgreich exportiert.",
};

// Zeitkonstanten
export const TIMING = {
  // Debounce-Verzögerung für Eingaben
  inputDebounce: 300,

  // Animation-Dauer
  animationDuration: 200,

  // Auto-Save-Intervall
  autoSaveInterval: 5000,
};

// Z-Index-Werte
export const Z_INDEX = {
  // Hintergrund
  background: 0,

  // Beziehungsgraph
  graph: 1,

  // Knoten
  nodes: 2,

  // Kanten
  edges: 3,

  // Tooltips
  tooltips: 10,

  // Modals
  modals: 100,
};
