---
id: ISP-002
prinzip: ISP
schweregrad: mittel
layer: domain
status: Proposed
---

# 1. Problem
`IWindowController` vereint Render-Hooks, State-Updates, Action-Dispatch, Persistenz und ViewModel-Zugriff in einer Schnittstelle. Konsumenten, die nur Render-Hooks brauchen (z.B. Foundry Wrapper), muessen Methoden akzeptieren, die sie nicht verwenden. Das erschwert Test-Doubles und alternative Controller-Varianten.

# 2. Evidence (Belege)
`src/domain/windows/ports/window-controller-port.interface.ts`:
```
onFoundryRender(element: HTMLElement): Promise<Result<void, WindowError>>;
onFoundryUpdate(element: HTMLElement): Promise<Result<void, WindowError>>;
onFoundryClose(): Promise<Result<void, WindowError>>;
updateStateLocal(...): Promise<Result<void, WindowError>>;
applyRemotePatch(...): Promise<Result<void, WindowError>>;
dispatchAction(...): Promise<Result<void, WindowError>>;
persist(meta?: PersistMeta): Promise<Result<void, WindowError>>;
restore(): Promise<Result<void, WindowError>>;
getViewModel(): ViewModel;
```

# 3. SOLID-Analyse
Verstoss gegen ISP: Clients muessen eine breite Schnittstelle konsumieren, obwohl sie nur Teilfunktionalitaet brauchen. Das koppelt fuer Tests und Adapter an mehr Methoden als notwendig und erschwert alternative Implementierungen (z.B. readonly Controller fuer Headless).

# 4. Zielbild
Schnittstellen sind nach Nutzern getrennt:
- `IWindowRenderHooks` fuer `onFoundryRender/Update/Close`
- `IWindowStateController` fuer State/Actions
- `IWindowPersistence` fuer Persist/Restore
- `IWindowViewModelProvider` fuer `getViewModel`

# 5. Loesungsvorschlag
**Approach A (empfohlen):**
- Interface in mehrere Ports aufteilen.
- `WindowController` implementiert weiterhin alle Ports.
- Adapter (Foundry Wrapper) verlangen nur `IWindowRenderHooks`.

**Approach B (Alternative):**
- Behalte `IWindowController` als Kompositions-Typ, aber expose die Einzelports separat und reduziere Abhaengigkeiten im Code.

Trade-offs: Mehr Interfaces, aber geringere Kopplung und bessere Substituierbarkeit.

# 6. Refactoring-Schritte
1. Neue Ports definieren (RenderHooks, State, Persistence, ViewModel).
2. `IWindowController` optional als Aggregat belassen oder entfernen.
3. Abhaengigkeiten in Infrastructure/Framework auf kleinere Ports umstellen.
4. Tests auf neue Ports aktualisieren.

# 7. Beispiel-Code
**After:**
```
export interface IWindowRenderHooks {
  onFoundryRender(element: RenderTargetRef): Promise<Result<void, WindowError>>;
  onFoundryUpdate(element: RenderTargetRef): Promise<Result<void, WindowError>>;
  onFoundryClose(): Promise<Result<void, WindowError>>;
}
```

# 8. Tests & Quality Gates
- Mock-Tests fuer RenderHooks ohne State/Persistence.
- Typchecks fuer alle Adapter-Konstruktoren (keine unnnoetigen Ports).

# 9. Akzeptanzkriterien
- Foundry Wrapper haengt nur von `IWindowRenderHooks` ab.
- `IWindowController` ist nicht mehr die minimale Schnittstelle fuer alle Consumer.
