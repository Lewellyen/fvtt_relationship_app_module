@echo off
REM Release GUI für WH40K Deathwatch starten

REM Wechsle in das Verzeichnis der Batch-Datei
pushd "%~dp0"

REM Aktiviere die Python-Virtual-Umgebung
call ".\.venv\Scripts\activate.bat"

REM Starte die Release-GUI
python scripts\release_gui.py %*

REM Zurück ins ursprüngliche Verzeichnis
popd 