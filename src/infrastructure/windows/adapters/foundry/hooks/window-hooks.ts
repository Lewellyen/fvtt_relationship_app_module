import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { IRemoteSyncGate } from "@/domain/windows/ports/remote-sync-gate-port.interface";
import type { ISharedDocumentCache } from "@/application/windows/ports/shared-document-cache-port.interface";
import type { IWindowHooksBridge } from "@/application/windows/ports/window-hooks-bridge-port.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { FoundryHookCallback } from "@/infrastructure/adapters/foundry/types";

/**
 * WindowHooksBridge - Foundry Hooks → WindowController
 *
 * Registriert Foundry Hooks und delegiert an WindowController für Remote-Sync.
 */
export class WindowHooksBridge implements IWindowHooksBridge {
  constructor(
    private readonly registry: IWindowRegistry,
    private readonly remoteSyncGate: IRemoteSyncGate,
    private readonly sharedDocumentCache: ISharedDocumentCache
  ) {}

  register(): void {
    // Hook für Document-Updates
    if (typeof Hooks !== "undefined") {
      // Type-safe cast for dynamic hook names
      // Foundry's Hooks API supports dynamic hook names, but fvtt-types
      // has strict keyof HookConfig typing that doesn't allow runtime strings
      const hooksApi = Hooks as {
        on: (name: string, callback: FoundryHookCallback) => number;
      };

      hooksApi.on("updateDocument", (...args: unknown[]) => {
        const [document, _update, options] = args;
        // type-coverage:ignore-next-line
        this.handleDocumentUpdate(document as FoundryDocument, _update, options);
      });

      // Hook für Setting-Updates

      hooksApi.on("settingChange", (...args: unknown[]) => {
        const [namespace, key, value, options] = args;
        this.handleSettingChange(
          // type-coverage:ignore-next-line
          namespace as string,
          // type-coverage:ignore-next-line
          key as string,
          value,
          options
        );
      });
    }
  }

  private handleDocumentUpdate(document: FoundryDocument, update: unknown, options: unknown): void {
    // type-coverage:ignore-next-line
    const optionsRecord = options as Record<string, unknown> | undefined;

    // Finde alle aktiven Fenster
    const instances = this.registry.listInstances();

    for (const instance of instances) {
      // WICHTIG: window-scoped, nicht client-scoped!
      // Diese Regel gilt für ALLE Hook-Handler (updateDocument, settingChange, etc.)
      if (this.remoteSyncGate.isFromWindow(optionsRecord, instance.instanceId)) {
        continue; // Update von diesem Window, bereits angewendet
      }

      const instanceResult = this.registry.getInstance(instance.instanceId);
      if (!instanceResult.ok) continue;

      const definitionResult = this.registry.getDefinition(instance.definitionId);
      if (!definitionResult.ok) continue;

      const definition = definitionResult.value;

      // Prüfe, ob Window relevant ist (Dependency-basiert, nicht nur "boundToDocument")
      if (this.isRelevant(definition, document, update)) {
        // Remote-Patch anwenden
        const controller = instanceResult.value.controller;
        if (controller) {
          const patch = this.extractPatch(document, update);
          controller.applyRemotePatch(patch);
        }
      }
    }

    // Update Shared Document Cache
    this.updateSharedCache(document, update);
  }

  private handleSettingChange(
    namespace: string,
    key: string,
    value: unknown,
    options: unknown
  ): void {
    const instances = this.registry.listInstances();
    // type-coverage:ignore-next-line
    const optionsRecord = options as Record<string, unknown> | undefined;

    for (const instance of instances) {
      // WICHTIG: window-scoped, nicht client-scoped!
      if (this.remoteSyncGate.isFromWindow(optionsRecord, instance.instanceId)) {
        continue; // Ignorieren für dieses Window
      }

      const definitionResult = this.registry.getDefinition(instance.definitionId);
      if (!definitionResult.ok) continue;

      const definition = definitionResult.value;

      // Prüfe, ob Window relevant ist
      if (this.isRelevantForSetting(definition, namespace, key)) {
        // TODO: applyRemotePatch für Settings
        // const patch = this.extractSettingPatch(namespace, key, value);
        // controller.applyRemotePatch(patch);
      }
    }
  }

  private isRelevantForSetting(
    definition: WindowDefinition,
    namespace: string,
    key: string
  ): boolean {
    // Prüfe PersistConfig (Settings)
    if (
      definition.persist?.type === "setting" &&
      definition.persist.namespace === namespace &&
      definition.persist.key === key
    ) {
      return true;
    }

    // Prüfe Dependencies (Settings)
    if (definition.dependencies) {
      for (const dep of definition.dependencies) {
        if (dep.type === "setting" && dep.namespace === namespace && dep.key === key) {
          return true;
        }
      }
    }

    return false;
  }

  private isRelevant(
    definition: WindowDefinition,
    document: FoundryDocument,
    _update: unknown
  ): boolean {
    // MVP: Grobe Prüfung - später mit DependencyTracker optimieren

    // 1. Prüfe PersistConfig (direkte Bindung)
    if (definition.persist) {
      if (definition.persist.type === "flag" && definition.persist.documentId === document.id) {
        return true;
      }
      if (definition.persist.type === "journal" && definition.persist.documentId === document.id) {
        return true;
      }
    }

    // 2. Prüfe Dependencies (explizite Dependency-Descriptors)
    if (definition.dependencies) {
      for (const dep of definition.dependencies) {
        if (dep.type === "document" && dep.documentId === document.id) {
          return true;
        }
        // HINWEIS: constructor.name ist MVP/fragil (Minification/Refactor/Foundry intern).
        // Besser wäre ein stabiler Document-Type-Identifier (z.B. document.documentName).
        if (dep.type === "document" && dep.documentType) {
          const docType = (document.constructor as { name?: string })?.name;
          if (docType === dep.documentType) {
            return true;
          }
        }
      }
    }

    // TODO: Erweiterte Dependency-Prüfung (Phase 2)
    // - Item-Update betrifft Actor-Fenster? (via DependencyTracker)
    // - Actor-Update betrifft Item-Fenster?
    // - Cross-Document-Dependencies

    return false;
  }

  private extractPatch(
    document: FoundryDocument,
    update: unknown
  ): Partial<Record<string, unknown>> {
    // TODO: Update aus document/update extrahieren und als Patch-Format konvertieren
    // MVP: Einfache Implementierung
    // type-coverage:ignore-next-line
    const updateRecord = update as Record<string, unknown>;
    return updateRecord || {};
  }

  private updateSharedCache(document: FoundryDocument, update: unknown): void {
    // Update Shared Document Cache basierend auf Document-Type
    const documentType = (document.constructor as { name?: string })?.name || "";
    // type-coverage:ignore-next-line
    const updateRecord = (update as Record<string, unknown>) || {};
    const docRecord = document as Record<string, unknown>;

    if (documentType === "Actor" || document.id.startsWith("Actor.")) {
      // Extract relevant actor fields
      const actorSnapshot: Partial<
        import("@/application/windows/ports/shared-document-cache-port.interface").ActorSnapshot
      > = {
        id: document.id,
        // type-coverage:ignore-next-line
        name: (docRecord.name as string) || "",
        system:
          // type-coverage:ignore-next-line
          (updateRecord.system as Record<string, unknown>) ||
          // type-coverage:ignore-next-line
          (docRecord.system as Record<string, unknown>) ||
          {},
        flags:
          // type-coverage:ignore-next-line
          (updateRecord.flags as Record<string, unknown>) ||
          // type-coverage:ignore-next-line
          (docRecord.flags as Record<string, unknown>) ||
          {},
      };
      this.sharedDocumentCache.patchActor(document.id, actorSnapshot);
    } else if (documentType === "Item" || document.id.startsWith("Item.")) {
      // Extract relevant item fields
      const itemSnapshot: Partial<
        import("@/application/windows/ports/shared-document-cache-port.interface").ItemSnapshot
      > = {
        id: document.id,
        // type-coverage:ignore-next-line
        name: (docRecord.name as string) || "",
        system:
          // type-coverage:ignore-next-line
          (updateRecord.system as Record<string, unknown>) ||
          // type-coverage:ignore-next-line
          (docRecord.system as Record<string, unknown>) ||
          {},
        flags:
          // type-coverage:ignore-next-line
          (updateRecord.flags as Record<string, unknown>) ||
          // type-coverage:ignore-next-line
          (docRecord.flags as Record<string, unknown>) ||
          {},
        // type-coverage:ignore-next-line
        actorId: (updateRecord.actorId as string) || (docRecord.actorId as string),
      };
      this.sharedDocumentCache.patchItem(document.id, itemSnapshot);
    }
  }

  /**
   * Entfernt die Hook-Registrierungen.
   * Sollte bei Shutdown aufgerufen werden.
   */
  unregister(): void {
    // TODO: Implement unregistration if needed
    // Currently, Foundry hooks are registered permanently.
    // If unregistration is needed, we would need to store hook IDs and call Hooks.off()
  }
}

// Type declarations for Foundry
interface FoundryDocument {
  id: string;
  [key: string]: unknown;
}
