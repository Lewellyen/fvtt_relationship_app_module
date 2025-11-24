#!/usr/bin/env python3
import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
from tkinter.scrolledtext import ScrolledText
import re
import json
from pathlib import Path
import subprocess
import sys
from datetime import datetime
from release_utils import (
    update_version_in_file, run_command, update_documentation, update_metadata, 
    remove_bom_in_paths, write_unreleased_changes, read_unreleased_changes, 
    verify_metadata_update, detect_change_type, get_changed_files_info
)

class ReleaseGUI:
    def __init__(self, root, test_mode=False):
        self.root = root
        self.root.title("Release Manager")
        self.root.geometry("750x900")  # Höher für neuen Modus-Bereich
        
        # Test-Modus Flag setzen
        self._test_mode = test_mode
        
        # Style konfigurieren
        self.setup_styles()
        
        # Hauptframe
        main_frame = ttk.Frame(root, padding="20", style="Main.TFrame")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        main_frame.columnconfigure(0, weight=1)
        
        # Header
        header_frame = ttk.Frame(main_frame, style="Header.TFrame")
        header_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 20))
        
        ttk.Label(header_frame, text="Release Manager", style="Header.TLabel").pack(pady=10)
        
        # ========== NEU: Automatische Erkennung & Modus-Auswahl ==========
        self.detected_type = detect_change_type()
        self.changes_info = get_changed_files_info()
        
        # Info-Banner mit Erkennungsergebnis
        self.info_frame = ttk.Frame(main_frame, style="Info.TFrame")
        self.info_frame.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 15))
        
        self.info_label = tk.Text(self.info_frame, height=4, wrap=tk.WORD, 
                                  font=("Segoe UI", 10), relief=tk.FLAT,
                                  state=tk.DISABLED)
        self.info_label.pack(fill=tk.X, padx=10, pady=10)
        
        self.update_info_banner()
        
        # Modus-Auswahl
        mode_frame = ttk.LabelFrame(main_frame, text="Modus auswählen", 
                                    padding="15", style="Card.TLabelframe")
        mode_frame.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(0, 20))
        
        self.mode_var = tk.StringVar(value='code' if self.detected_type == 'code' else 'docs')
        
        release_radio = ttk.Radiobutton(
            mode_frame, 
            text="🚀 Release erstellen (Version hochsetzen, Build, Tag, GitHub Release)",
            variable=self.mode_var,
            value='code',
            command=self.update_ui_for_mode,
            style="Custom.TRadiobutton"
        )
        release_radio.pack(anchor=tk.W, pady=5)
        
        docs_radio = ttk.Radiobutton(
            mode_frame,
            text="📝 Nur Commit (Dokumentation, keine neue Version)",
            variable=self.mode_var,
            value='docs',
            command=self.update_ui_for_mode,
            style="Custom.TRadiobutton"
        )
        docs_radio.pack(anchor=tk.W, pady=5)
        
        # ========== Versionen Frame (nur bei Release-Modus sichtbar) ==========
        # Aktuelle Version aus scripts/constants.cjs lesen
        self.current_version = self.get_current_version()
        
        self.version_frame = ttk.LabelFrame(main_frame, text="Versionsverwaltung", 
                                           padding="15", style="Card.TLabelframe")
        self.version_frame.grid(row=3, column=0, sticky=(tk.W, tk.E), pady=(0, 20))
        
        # Aktuelle Version
        current_version_frame = ttk.Frame(self.version_frame)
        current_version_frame.pack(fill=tk.X, pady=(0, 15))
        ttk.Label(current_version_frame, text="Aktuelle Version:", style="Bold.TLabel").pack(side=tk.LEFT)
        self.current_version_label = ttk.Label(current_version_frame, text=self.current_version, 
                                              style="Version.TLabel")
        self.current_version_label.pack(side=tk.LEFT, padx=(10, 0))
        
        # Version Controls Frame
        controls_frame = ttk.Frame(self.version_frame)
        controls_frame.pack(fill=tk.X, pady=(10, 0))
        
        # Version Eingabefelder
        version_parts_frame = ttk.Frame(controls_frame)
        version_parts_frame.pack(side=tk.LEFT)
        
        # Major
        major_frame = ttk.Frame(version_parts_frame)
        major_frame.pack(side=tk.LEFT, padx=10)
        ttk.Button(major_frame, text="▲", style="Small.TButton", 
                  command=lambda: self.adjust_version(0, 1)).pack(side=tk.TOP)
        self.major_var = tk.StringVar(value=self.current_version.split('.')[0])
        ttk.Entry(major_frame, textvariable=self.major_var, width=3, 
                 style="Version.TEntry").pack(side=tk.TOP, padx=2, pady=2)
        ttk.Button(major_frame, text="▼", style="Small.TButton", 
                  command=lambda: self.adjust_version(0, -1)).pack(side=tk.TOP)
        
        ttk.Label(version_parts_frame, text=".", style="Dot.TLabel").pack(side=tk.LEFT)
        
        # Minor
        minor_frame = ttk.Frame(version_parts_frame)
        minor_frame.pack(side=tk.LEFT, padx=10)
        ttk.Button(minor_frame, text="▲", style="Small.TButton", 
                  command=lambda: self.adjust_version(1, 1)).pack(side=tk.TOP)
        self.minor_var = tk.StringVar(value=self.current_version.split('.')[1])
        ttk.Entry(minor_frame, textvariable=self.minor_var, width=3, 
                 style="Version.TEntry").pack(side=tk.TOP, padx=2, pady=2)
        ttk.Button(minor_frame, text="▼", style="Small.TButton", 
                  command=lambda: self.adjust_version(1, -1)).pack(side=tk.TOP)
        
        ttk.Label(version_parts_frame, text=".", style="Dot.TLabel").pack(side=tk.LEFT)
        
        # Patch
        patch_frame = ttk.Frame(version_parts_frame)
        patch_frame.pack(side=tk.LEFT, padx=10)
        ttk.Button(patch_frame, text="▲", style="Small.TButton", 
                  command=lambda: self.adjust_version(2, 1)).pack(side=tk.TOP)
        self.patch_var = tk.StringVar(value=self.current_version.split('.')[2])
        ttk.Entry(patch_frame, textvariable=self.patch_var, width=3, 
                 style="Version.TEntry").pack(side=tk.TOP, padx=2, pady=2)
        ttk.Button(patch_frame, text="▼", style="Small.TButton", 
                  command=lambda: self.adjust_version(2, -1)).pack(side=tk.TOP)

        # Neue Version als Text
        self.new_version_label = ttk.Label(version_parts_frame, text=self.get_new_version(), 
                                         style="Version.TLabel")
        self.new_version_label.pack(side=tk.LEFT, padx=(20, 0))
        
        # Schnell-Buttons
        quick_frame = ttk.Frame(controls_frame)
        quick_frame.pack(side=tk.RIGHT)
        
        ttk.Button(quick_frame, text="Major", style="Action.TButton", width=8,
                  command=self.set_major).pack(side=tk.LEFT, padx=5)
        ttk.Button(quick_frame, text="Minor", style="Action.TButton", width=8,
                  command=self.set_minor).pack(side=tk.LEFT, padx=5)
        ttk.Button(quick_frame, text="Patch", style="Action.TButton", width=8,
                  command=self.set_patch).pack(side=tk.LEFT, padx=5)
        ttk.Button(quick_frame, text="Reset", style="Reset.TButton", width=8,
                  command=self.reset_version).pack(side=tk.LEFT, padx=5)
        
        # Release-Optionen Frame
        self.options_frame = ttk.LabelFrame(main_frame, text="Release-Optionen", 
                                     padding="15", style="Card.TLabelframe")
        self.options_frame.grid(row=4, column=0, sticky=(tk.W, tk.E), pady=(0, 20))
        self.options_frame.columnconfigure(0, weight=1)
        self.options_frame.columnconfigure(1, weight=1)
        
        # Checkbox-Variablen
        self.update_constants_var = tk.BooleanVar(value=True)
        self.run_build_var = tk.BooleanVar(value=True)
        self.git_add_var = tk.BooleanVar(value=True)
        self.git_commit_var = tk.BooleanVar(value=True)
        self.git_tag_var = tk.BooleanVar(value=True)
        self.git_push_var = tk.BooleanVar(value=True)
        self.update_docs_var = tk.BooleanVar(value=True)
        self.remove_bom_var = tk.BooleanVar(value=True)
        
        # Checkboxen in 2x4 Grid
        options = [
            ("Konstanten-Datei aktualisieren", self.update_constants_var),
            ("Metadaten aktualisieren", self.run_build_var),
            ("BOM entfernen", self.remove_bom_var),
            ("Dokumentation aktualisieren", self.update_docs_var)
        ]
        
        git_options = [
            ("Git: Änderungen stagen", self.git_add_var),
            ("Git: Änderungen committen", self.git_commit_var),
            ("Git: Tag erstellen", self.git_tag_var),
            ("Git: Änderungen hochladen", self.git_push_var)
        ]
        
        # Erste Spalte: Hauptoptionen
        ttk.Label(self.options_frame, text="Vorbereitung", 
                 style="Bold.TLabel").grid(row=0, column=0, 
                 sticky=tk.W, pady=(0, 10))
        
        for i, (text, var) in enumerate(options):
            ttk.Checkbutton(self.options_frame, text=text, variable=var, 
                          style="Custom.TCheckbutton").grid(row=i+1, column=0, 
                          sticky=tk.W, pady=5, padx=10)
        
        # Git-Operationen Label
        ttk.Label(self.options_frame, text="Git-Operationen", 
                 style="Bold.TLabel").grid(row=0, column=1, 
                 sticky=tk.W, pady=(0, 10))
        
        # Zweite Spalte: Git-Optionen
        for i, (text, var) in enumerate(git_options):
            ttk.Checkbutton(self.options_frame, text=text, variable=var, 
                          style="Custom.TCheckbutton").grid(row=i+1, column=1, 
                          sticky=tk.W, pady=5, padx=10)
        
        # Ausführen Button Frame
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=5, column=0, pady=(20, 20))
        
        self.execute_button = ttk.Button(
            button_frame,
            text="Ausführen",
            command=self.execute_action,
            style="Execute.TButton"
        )
        self.execute_button.pack(side=tk.LEFT, padx=5)
        
        # Test Button
        self.test_button = ttk.Button(
            button_frame,
            text="Testlauf (Simulation)",
            command=lambda: self.execute_action(test_mode=True),
            style="Test.TButton"
        )
        self.test_button.pack(side=tk.LEFT, padx=5)
        
        # Status Label
        status_frame = ttk.Frame(main_frame, style="Main.TFrame")
        status_frame.grid(row=6, column=0, sticky=(tk.W, tk.E), pady=(0, 20))
        self.status_label = ttk.Label(status_frame, text="", style="Status.TLabel", wraplength=700)
        self.status_label.pack(fill=tk.X, padx=10)
        
        # Spacer
        spacer = ttk.Frame(main_frame, style="Main.TFrame")
        spacer.grid(row=7, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        spacer.rowconfigure(0, weight=1)
        
        # Bottom Frame
        bottom_frame = ttk.Frame(main_frame, style="Main.TFrame")
        bottom_frame.grid(row=8, column=0, sticky=(tk.S, tk.E, tk.W), pady=(20, 10))
        
        ttk.Button(
            bottom_frame,
            text="Beenden",
            command=self.root.destroy,
            style="Reset.TButton",
            width=15
        ).pack()
        
        # Validierung der Eingaben
        self.major_var.trace('w', self.validate_input)
        self.minor_var.trace('w', self.validate_input)
        self.patch_var.trace('w', self.validate_input)
        
        # Initiale UI-Anpassung basierend auf Modus
        self.update_ui_for_mode()
        self.validate_input()
        
        # Configure grid weights
        root.columnconfigure(0, weight=1)
        root.rowconfigure(0, weight=1)
    
    def update_info_banner(self):
        """Aktualisiert das Info-Banner mit Erkennungsergebnis."""
        self.info_label.config(state=tk.NORMAL)
        self.info_label.delete("1.0", tk.END)
        
        # Alle geänderten Dateien (zur Info)
        all_files = self.changes_info['code'] + self.changes_info['docs']
        
        if self.detected_type == 'docs':
            # Nur Dokumentation
            bg_color = "#fff3cd"
            fg_color = "#856404"
            title = "ℹ️ Automatische Erkennung: Nur Dokumentations-Änderungen\n"
            
            files_text = f"Geänderte Dateien ({len(all_files)} insgesamt):\n"
            for f in all_files[:10]:  # Zeige bis zu 10 Dateien
                files_text += f"  • {f}\n"
            if len(all_files) > 10:
                files_text += f"  ... und {len(all_files) - 10} weitere\n"
            
            files_text += "\n💡 Empfohlen: Nur Commit (keine neue Version)"
        else:
            # Code-Änderungen
            bg_color = "#d4edda"
            fg_color = "#155724"
            title = "ℹ️ Automatische Erkennung: Code-Änderungen gefunden\n"
            
            files_text = f"Geänderte Code-Dateien ({len(self.changes_info['code'])} Code, {len(self.changes_info['docs'])} Doku/Tooling):\n"
            # Zeige Code-Dateien zuerst
            for f in self.changes_info['code'][:7]:
                files_text += f"  • {f}\n"
            if len(self.changes_info['code']) > 7:
                files_text += f"  ... und {len(self.changes_info['code']) - 7} weitere Code-Dateien\n"
            
            # Zeige auch Doku-Dateien wenn vorhanden
            if self.changes_info['docs']:
                files_text += f"\nPlus Doku/Tooling:\n"
                for f in self.changes_info['docs'][:3]:
                    files_text += f"  • {f}\n"
                if len(self.changes_info['docs']) > 3:
                    files_text += f"  ... und {len(self.changes_info['docs']) - 3} weitere\n"
            
            files_text += "\n💡 Empfohlen: Release erstellen (neue Version)"
        
        self.info_label.insert("1.0", title + "\n" + files_text)
        self.info_label.config(state=tk.DISABLED, bg=bg_color, fg=fg_color)
    
    def update_ui_for_mode(self):
        """Passt UI basierend auf gewähltem Modus an."""
        is_release = self.mode_var.get() == 'code'
        
        # Version-Frame nur bei Release anzeigen
        if is_release:
            self.version_frame.grid()
            self.options_frame.grid()
            self.execute_button.config(text="Release erstellen")
            self.root.title("Release Manager - Release Modus")
            # Git Tag und Version-Updates aktivieren
            self.git_tag_var.set(True)
            self.update_constants_var.set(True)
            self.run_build_var.set(True)
        else:
            self.version_frame.grid_remove()
            self.options_frame.grid_remove()
            self.execute_button.config(text="Commit erstellen")
            self.root.title("Release Manager - Dokumentations-Modus")
        
        # Validierung neu ausführen (wichtig für Button-Status)
        self.validate_input()
    
    def setup_styles(self):
        """Konfiguriert die Styles für ein modernes Aussehen."""
        style = ttk.Style()
        
        # Hauptfarben
        PRIMARY_COLOR = "#1976D2"
        SECONDARY_COLOR = "#424242"
        WARNING_COLOR = "#FF9800"
        TEST_COLOR = "#4CAF50"
        BG_COLOR = "#F5F5F5"
        CARD_BG = "#FFFFFF"
        
        # Hauptframe
        style.configure("Main.TFrame", background=BG_COLOR)
        style.configure("Header.TFrame", background=BG_COLOR)
        style.configure("Info.TFrame", background=BG_COLOR)
        
        # Header
        style.configure("Header.TLabel", 
                       font=("Segoe UI", 24, "bold"),
                       background=BG_COLOR,
                       foreground=SECONDARY_COLOR)
        
        # Labels
        style.configure("Bold.TLabel", 
                       font=("Segoe UI", 10, "bold"),
                       background=CARD_BG)
        style.configure("Version.TLabel", 
                       font=("Segoe UI", 10),
                       background=CARD_BG)
        style.configure("Dot.TLabel", 
                       font=("Segoe UI", 12, "bold"),
                       background=CARD_BG)
        style.configure("Status.TLabel", 
                       font=("Segoe UI", 10),
                       foreground="red",
                       background=BG_COLOR)
        
        # Frames
        style.configure("Card.TLabelframe", 
                       background=CARD_BG)
        style.configure("Card.TLabelframe.Label", 
                       font=("Segoe UI", 11, "bold"),
                       background=BG_COLOR,
                       foreground=SECONDARY_COLOR)
        
        # Buttons
        style.configure("Small.TButton", 
                       padding=1,
                       width=2)
        style.configure("Action.TButton", 
                       padding=5,
                       font=("Segoe UI", 9))
        style.configure("Reset.TButton", 
                       padding=5,
                       font=("Segoe UI", 9))
        style.configure("Execute.TButton", 
                       padding=10,
                       font=("Segoe UI", 11, "bold"),
                       background=PRIMARY_COLOR)
        style.configure("Test.TButton",
                       padding=10,
                       font=("Segoe UI", 11),
                       background=TEST_COLOR)
        
        # Entry
        style.configure("Version.TEntry", 
                       font=("Segoe UI", 10))
        
        # Checkbutton & Radiobutton
        style.configure("Custom.TCheckbutton", 
                       font=("Segoe UI", 10),
                       background=CARD_BG)
        style.configure("Custom.TRadiobutton",
                       font=("Segoe UI", 10),
                       background=CARD_BG)
        
    def get_current_version(self):
        """Liest die aktuelle Version aus scripts/constants.cjs."""
        constants_cjs = Path("scripts/constants.cjs")
        if not constants_cjs.exists():
            if not self._test_mode:
                messagebox.showerror("Fehler", "scripts/constants.cjs nicht gefunden!")
                sys.exit(1)
            return "0.0.1"
        with open(constants_cjs, 'r', encoding='utf-8') as f:
            content = f.read()
        match = re.search(r'MODULE_VERSION:\s*[\'"]([^\'"]+)[\'"]', content)
        if not match:
            if not self._test_mode:
                messagebox.showerror("Fehler", "Version in constants.cjs nicht gefunden!")
                sys.exit(1)
            return "0.0.1"
        return match.group(1)
    
    def get_new_version(self):
        """Gibt die neue Version als String zurück."""
        return f"{self.major_var.get()}.{self.minor_var.get()}.{self.patch_var.get()}"
    
    def validate_input(self, *args):
        """Validiert die Eingaben und aktiviert/deaktiviert den Ausführen-Button."""
        # Im Dokumentations-Modus keine Versions-Validierung
        if self.mode_var.get() == 'docs':
            self.execute_button.state(['!disabled'])
            self.status_label.config(text="")
            return
        
        # Im Release-Modus: Versions-Validierung
        try:
            new_version = self.get_new_version()
            if hasattr(self, 'new_version_label'):
                self.new_version_label.config(text=new_version)
            current_parts = [int(x) for x in self.current_version.split('.')]
            new_parts = [int(x) for x in new_version.split('.')]
            
            if new_parts > current_parts:
                self.execute_button.state(['!disabled'])
                self.status_label.config(text="")
            else:
                self.execute_button.state(['disabled'])
                self.status_label.config(text="Neue Version muss größer als aktuelle Version sein!")
        except ValueError:
            self.execute_button.state(['disabled'])
            self.status_label.config(text="Bitte nur Zahlen eingeben!")
    
    def adjust_version(self, index, delta):
        """Ändert die Version um delta an der Position index."""
        parts = [int(self.major_var.get()), int(self.minor_var.get()), int(self.patch_var.get())]
        current = parts[index]
        new = max(0, current + delta)
        
        if index == 0:
            self.major_var.set(str(new))
        elif index == 1:
            self.minor_var.set(str(new))
        else:
            self.patch_var.set(str(new))
    
    def set_major(self):
        """Setzt die nächste Major-Version."""
        current = int(self.major_var.get())
        self.major_var.set(str(current + 1))
        self.minor_var.set("0")
        self.patch_var.set("0")
    
    def set_minor(self):
        """Setzt die nächste Minor-Version."""
        current = int(self.minor_var.get())
        self.minor_var.set(str(current + 1))
        self.patch_var.set("0")
    
    def set_patch(self):
        """Setzt die nächste Patch-Version."""
        current = int(self.patch_var.get())
        self.patch_var.set(str(current + 1))
    
    def reset_version(self):
        """Setzt die Zielversion auf die aktuelle Version zurück."""
        major, minor, patch = self.current_version.split('.')
        self.major_var.set(major)
        self.minor_var.set(minor)
        self.patch_var.set(patch)
        self.validate_input()
    
    def refresh_version_display(self):
        """Aktualisiert die Anzeige der aktuellen Version."""
        self.current_version = self.get_current_version()
        self.current_version_label.config(text=self.current_version)
        self.reset_version()
        self.validate_input()

    def execute_action(self, test_mode=False):
        """Hauptfunktion: Führt je nach Modus Release oder Docs-Commit aus."""
        if self.mode_var.get() == 'docs':
            self.documentation_commit(test_mode)
        else:
            self.execute_release(test_mode)
    
    def documentation_commit(self, test_mode=False):
        """Nur Commit + Push, keine Version, kein Tag."""
        # Commit-Message abfragen
        commit_msg = simpledialog.askstring(
            "Commit-Message",
            "Beschreibung der Dokumentations-Änderungen:\n(Prefix 'docs:' wird automatisch hinzugefügt)",
            parent=self.root
        )
        
        if not commit_msg:
            return
        
        # Conventional Commit Format
        if not commit_msg.startswith("docs:"):
            commit_msg = f"docs: {commit_msg}"
        
        # Bestätigung
        confirmation = f"Dokumentations-Commit erstellen:\n\n" + \
                      f"Commit-Message: {commit_msg}\n\n" + \
                      f"Änderungen:\n"
        
        for f in self.changes_info['docs'][:10]:
            confirmation += f"  • {f}\n"
        if len(self.changes_info['docs']) > 10:
            confirmation += f"  ... und {len(self.changes_info['docs']) - 10} weitere\n"
        
        confirmation += "\n❌ KEINE neue Version\n"
        confirmation += "❌ KEIN Git-Tag\n"
        confirmation += "✅ CHANGELOG Unreleased-Sektion bleibt erhalten"
        
        if test_mode:
            confirmation = "TEST-MODUS: Keine Änderungen werden vorgenommen!\n\n" + confirmation
        
        if not messagebox.askyesno("Bestätigung", confirmation):
            return
        
        try:
            print(f"\n{'TEST: ' if test_mode else ''}Dokumentations-Commit wird erstellt...")
            print(f"  Commit-Message: {commit_msg}")
            
            # Git Operations
            if not test_mode:
                print("  Git add...")
                subprocess.run(['git', 'add', '.'], check=True)
                
                print("  Git commit...")
                subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
                
                print("  Git push...")
                subprocess.run(['git', 'push', 'origin', 'main'], check=True)
            
            print("\n✅ Dokumentations-Commit erfolgreich!" + (" (simuliert)" if test_mode else ""))
            
            messagebox.showinfo(
                "✅ Erfolg",
                f"Dokumentations-Commit {'simuliert' if test_mode else 'erstellt'}!\n\n"
                f"Commit: {commit_msg}\n\n"
                f"📝 CHANGELOG.md Unreleased-Sektion bleibt erhalten.\n"
                f"📦 Keine neue Version erstellt.\n"
                f"🏷️ Kein Git-Tag erstellt."
            )
            
        except subprocess.CalledProcessError as e:
            messagebox.showerror("❌ Fehler", f"Git-Operation fehlgeschlagen:\n{str(e)}")
        except Exception as e:
            messagebox.showerror("❌ Fehler", f"Fehler beim Commit:\n{str(e)}")

    def prompt_for_changelog_inputs(self, test_mode=False):
        """Zeigt ein Modal zur Eingabe von Changelog-Texten und Commit-Bemerkung."""
        # Lese vorhandene Unreleased-Texte
        existing = read_unreleased_changes("CHANGELOG.md")
        dialog = tk.Toplevel(self.root)
        dialog.title("Changelog & Commit-Bemerkung")
        dialog.grab_set()
        frame = ttk.Frame(dialog, padding="10")
        frame.grid(row=0, column=0, sticky=(tk.N, tk.S, tk.E, tk.W))
        dialog.columnconfigure(0, weight=1)
        dialog.rowconfigure(0, weight=1)
        
        # Eingabefelder
        ttk.Label(frame, text="Hinzugefügt:").grid(row=0, column=0, sticky=tk.W)
        added_widget = ScrolledText(frame, width=60, height=4)
        added_widget.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        added_widget.insert("1.0", existing.get("added", ""))
        
        ttk.Label(frame, text="Geändert:").grid(row=2, column=0, sticky=tk.W)
        changed_widget = ScrolledText(frame, width=60, height=4)
        changed_widget.grid(row=3, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        changed_widget.insert("1.0", existing.get("changed", ""))
        
        ttk.Label(frame, text="Fehlerbehebungen:").grid(row=4, column=0, sticky=tk.W)
        fixed_widget = ScrolledText(frame, width=60, height=4)
        fixed_widget.grid(row=5, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        fixed_widget.insert("1.0", existing.get("fixed", ""))
        
        ttk.Label(frame, text="Bekannte Probleme:").grid(row=6, column=0, sticky=tk.W)
        known_widget = ScrolledText(frame, width=60, height=4)
        known_widget.grid(row=7, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        known_widget.insert("1.0", existing.get("known", ""))
        
        ttk.Label(frame, text="Upgrade-Hinweise:").grid(row=8, column=0, sticky=tk.W)
        upgrade_widget = ScrolledText(frame, width=60, height=4)
        upgrade_widget.grid(row=9, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        upgrade_widget.insert("1.0", existing.get("upgrade", ""))
        
        ttk.Label(frame, text="Commit-Bemerkung:").grid(row=10, column=0, sticky=tk.W)
        remark_var = tk.StringVar()
        remark_entry = ttk.Entry(frame, textvariable=remark_var, width=60)
        remark_entry.grid(row=11, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # Buttons
        btn_frame = ttk.Frame(frame)
        btn_frame.grid(row=12, column=0, sticky=tk.E)
        
        def on_ok():
            self._changelog_inputs = {
                "added": added_widget.get("1.0", tk.END).strip(),
                "changed": changed_widget.get("1.0", tk.END).strip(),
                "fixed": fixed_widget.get("1.0", tk.END).strip(),
                "known": known_widget.get("1.0", tk.END).strip(),
                "upgrade": upgrade_widget.get("1.0", tk.END).strip(),
                "remark": remark_var.get().strip()
            }
            dialog.destroy()
        
        def on_cancel():
            self._changelog_inputs = None
            dialog.destroy()
        
        ttk.Button(btn_frame, text="OK", command=on_ok).grid(row=0, column=0, padx=5)
        ttk.Button(btn_frame, text="Abbrechen", command=on_cancel).grid(row=0, column=1)
        
        self.root.wait_window(dialog)
        return self._changelog_inputs

    def execute_release(self, test_mode=False):
        """Führt den vollständigen Release-Prozess aus (wie bisher)."""
        # Modal zur Eingabe von Changelog
        inputs = self.prompt_for_changelog_inputs(test_mode)
        if inputs is None:
            return
        
        added = inputs["added"]
        changed = inputs["changed"]
        fixed = inputs["fixed"]
        known = inputs["known"]
        upgrade = inputs["upgrade"]
        remark = inputs["remark"]
        new_version = self.get_new_version()
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        print(f"\nStarte {'Test-' if test_mode else ''}Release-Prozess für Version {new_version}")
        
        # Bestätigung
        confirmation = f"Release für Version {new_version} erstellen?\n\n"
        if test_mode:
            confirmation = "TEST-MODUS: Keine Dateien werden geändert!\n\n" + confirmation
        
        if not messagebox.askyesno("Bestätigung", confirmation):
            return
        
        try:
            # 1. Konstantendatei aktualisieren
            if self.update_constants_var.get():
                print("\n1. Aktualisiere Version in scripts/constants.cjs...")
                if not test_mode:
                    update_version_in_file("scripts/constants.cjs", new_version)
                    self.refresh_version_display()
                print("  OK constants.cjs erfolgreich aktualisiert" + (" (simuliert)" if test_mode else ""))
            
            # 2. Metadaten aktualisieren
            if self.run_build_var.get():
                print("\n2. Aktualisiere Metadaten...")
                if not test_mode:
                    update_metadata(new_version)
                    if not verify_metadata_update(new_version):
                        raise Exception("Fehler beim Aktualisieren der Metadaten!")
                print("  OK Metadaten erfolgreich aktualisiert" + (" (simuliert)" if test_mode else ""))
            
            # 3. BOM entfernen
            if self.remove_bom_var.get():
                print("\n3. Entferne BOM aus Projektdateien...")
                if not test_mode:
                    remove_bom_in_paths(["src", "dist", "templates", "styles", "module.json", "package.json"])
                print("  OK BOM-Entfernung abgeschlossen" + (" (simuliert)" if test_mode else ""))
            
            # 4. Dokumentation aktualisieren
            if self.update_docs_var.get():
                print("\n4. Wende GUI-Änderungen auf CHANGELOG.md an...")
                if not test_mode:
                    write_unreleased_changes("CHANGELOG.md", added, changed, fixed, known, upgrade)
                print("  OK Unreleased-Sektion in CHANGELOG.md aktualisiert" + (" (simuliert)" if test_mode else ""))

                print("\n5. Aktualisiere Dokumentation...")
                if not test_mode:
                    update_documentation(new_version, current_date)
                print("  OK Dokumentation erfolgreich aktualisiert" + (" (simuliert)" if test_mode else ""))

                print("\n6. Generiere CHANGELOG.md aus Release-Notes...")
                if not test_mode:
                    if not run_command("python scripts/generate_changelog.py"):
                        raise Exception("Changelog-Regenerierung fehlgeschlagen")
                print("  OK CHANGELOG.md erfolgreich regeneriert" + (" (simuliert)" if test_mode else ""))
            
            # 7. Git-Änderungen stagen
            if self.git_add_var.get():
                print("\n7. Git-Änderungen stagen...")
                if not test_mode:
                    if not run_command("git add ."):
                        raise Exception("Git add fehlgeschlagen")
                print("  OK Git add erfolgreich" + (" (simuliert)" if test_mode else ""))
            
            # 8. Git-Änderungen committen
            if self.git_commit_var.get():
                print("\n8. Git-Änderungen committen...")
                if not test_mode:
                    commit_message = f"release: v{new_version}"
                    if remark:
                        commit_message += f" - {remark}"
                    commit_message += "\n\n"
                    if added and added.strip():
                        commit_message += "### Hinzugefügt\n" + added + "\n\n"
                    if changed and changed.strip():
                        commit_message += "### Geändert\n" + changed + "\n\n"
                    if fixed and fixed.strip():
                        commit_message += "### Fehlerbehebungen\n" + fixed + "\n\n"
                    
                    # Schreibe Commit-Message in temporäre Datei (für lange Messages)
                    commit_msg_file = Path(".git/COMMIT_EDITMSG_RELEASE")
                    commit_msg_file.write_text(commit_message, encoding='utf-8')
                    
                    if not run_command(f'git commit -F "{commit_msg_file}"'):
                        lock_file = Path(".git/index.lock")
                        error_msg = "Git commit fehlgeschlagen"
                        if lock_file.exists():
                            error_msg += f"\n\nUrsache: Git-Lock-Datei gefunden ({lock_file})\n"
                            error_msg += "Mögliche Lösungen:\n"
                            error_msg += "1. Warten Sie, bis alle Git-Prozesse beendet sind\n"
                            error_msg += "2. Prüfen Sie, ob ein Editor oder Git-Client geöffnet ist\n"
                            error_msg += "3. Falls kein Prozess läuft, entfernen Sie die Lock-Datei manuell"
                        raise Exception(error_msg)
                print("  OK Git commit erfolgreich" + (" (simuliert)" if test_mode else ""))
            
            # 9. Git-Tag erstellen
            if self.git_tag_var.get():
                print("\n9. Git-Tag erstellen...")
                if not test_mode:
                    tag_message = f"Release v{new_version}"
                    if remark:
                        tag_message += f" - {remark}"
                    if not run_command(f'git tag -f -a v{new_version} -m "{tag_message}"'):
                        raise Exception("Git tag fehlgeschlagen")
                print("  OK Git tag erfolgreich" + (" (simuliert)" if test_mode else ""))
            
            # 10. Änderungen hochladen
            if self.git_push_var.get():
                print("\n10. Änderungen hochladen...")
                if not test_mode:
                    if not run_command("git push origin main --tags"):
                        raise Exception("Git push fehlgeschlagen")
                print("  OK Git push erfolgreich" + (" (simuliert)" if test_mode else ""))
            
            print("\nRelease-Prozess erfolgreich abgeschlossen!" + (" (TEST-MODUS)" if test_mode else ""))
            messagebox.showinfo("Erfolg", 
                              "Test-Simulation erfolgreich!" if test_mode else f"Release für Version {new_version} erfolgreich!")
        except Exception as e:
            print(f"\nFehler beim Release-Prozess: {str(e)}")
            messagebox.showerror("Fehler", f"Release fehlgeschlagen: {str(e)}")

def main():
    print("Starte Release Manager GUI...")
    root = tk.Tk()
    app = ReleaseGUI(root)
    print("GUI initialisiert, starte Event-Loop...")
    root.mainloop()
    print("GUI beendet.")

if __name__ == "__main__":
    main()
