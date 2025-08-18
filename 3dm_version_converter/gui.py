#!/usr/bin/env python3
"""
3DM Version Converter GUI
Browse for files or a folder, choose target Rhino version, select output location, and convert.
"""
import os
import threading
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

import rhino3dm  # ensure installed via requirements.txt

# Import functions from converter.py
import converter as conv

APP_TITLE = "TANGBL.3dm File Downsaver"

# Dark mode colors
DARK_BG = "#121212"
DARK_FRAME_BG = "#1E1E1E"
DARK_TEXT = "#E0E0E0"
DARK_ACCENT = "#3A3A3A"
DARK_HIGHLIGHT = "#505050"
DARK_BUTTON = "#2A2A2A"
DARK_BUTTON_ACTIVE = "#404040"

class ConverterGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("700x520")
        self.minsize(640, 480)
        
        # Set dark mode
        self.configure(bg=DARK_BG)
        self.dark_mode = True
        
        # Apply dark theme
        self._apply_dark_theme()

        self.input_files = []  # list[Path]
        self.input_dir = None  # Path or None
        self.output_dir = None # Path or None
        self.recursive = tk.BooleanVar(value=False)
        self.mode = tk.StringVar(value="files")  # 'files' or 'folder'
        self.version = tk.StringVar(value='7')

        self._build_ui()

    def _apply_dark_theme(self):
        """Apply dark theme to ttk widgets"""
        style = ttk.Style(self)
        
        # Configure ttk styles for dark mode
        style.configure('TFrame', background=DARK_BG)
        style.configure('TLabel', background=DARK_BG, foreground=DARK_TEXT)
        style.configure('TButton', background=DARK_BUTTON, foreground=DARK_TEXT)
        style.map('TButton', 
                  background=[('active', DARK_BUTTON_ACTIVE), ('disabled', DARK_BG)],
                  foreground=[('disabled', DARK_ACCENT)])
        style.configure('TCheckbutton', background=DARK_BG, foreground=DARK_TEXT)
        style.configure('TRadiobutton', background=DARK_BG, foreground=DARK_TEXT)
        style.configure('TEntry', fieldbackground=DARK_FRAME_BG, foreground=DARK_TEXT)
        style.configure('TCombobox', fieldbackground=DARK_FRAME_BG, foreground=DARK_TEXT)
        style.map('TCombobox', fieldbackground=[('readonly', DARK_FRAME_BG)])
        style.configure('TProgressbar', background=DARK_HIGHLIGHT, troughcolor=DARK_FRAME_BG)
        style.configure('TLabelframe', background=DARK_BG, foreground=DARK_TEXT)
        style.configure('TLabelframe.Label', background=DARK_BG, foreground=DARK_TEXT)
        
    def _build_ui(self):
        pad = {'padx': 10, 'pady': 8}

        # Mode selector
        mode_frame = ttk.LabelFrame(self, text="Input Mode")
        mode_frame.pack(fill='x', **pad)
        ttk.Radiobutton(mode_frame, text="Select files", value="files", variable=self.mode, command=self._refresh_state).pack(side='left', padx=10, pady=6)
        ttk.Radiobutton(mode_frame, text="Select folder", value="folder", variable=self.mode, command=self._refresh_state).pack(side='left', padx=10, pady=6)
        ttk.Checkbutton(mode_frame, text="Recursive (for folder)", variable=self.recursive).pack(side='left', padx=10, pady=6)

        # Input selection
        input_frame = ttk.LabelFrame(self, text="Input")
        input_frame.pack(fill='x', **pad)
        self.input_entry = ttk.Entry(input_frame)
        self.input_entry.pack(side='left', fill='x', expand=True, padx=10, pady=6)
        ttk.Button(input_frame, text="Browse...", command=self._browse_input).pack(side='left', padx=10, pady=6)

        # Output selection
        out_frame = ttk.LabelFrame(self, text="Output directory")
        out_frame.pack(fill='x', **pad)
        self.output_entry = ttk.Entry(out_frame)
        self.output_entry.pack(side='left', fill='x', expand=True, padx=10, pady=6)
        ttk.Button(out_frame, text="Choose...", command=self._browse_output).pack(side='left', padx=10, pady=6)

        # Options
        opts_frame = ttk.LabelFrame(self, text="Options")
        opts_frame.pack(fill='x', **pad)
        ttk.Label(opts_frame, text="Target Rhino version:").pack(side='left', padx=10, pady=6)
        self.version_combo = ttk.Combobox(opts_frame, values=list(conv.RHINO_VERSIONS.keys()), textvariable=self.version, state='readonly', width=6)
        self.version_combo.pack(side='left', padx=10, pady=6)

        # Run controls
        run_frame = ttk.Frame(self)
        run_frame.pack(fill='x', **pad)
        self.run_btn = ttk.Button(run_frame, text="Convert", command=self._start_convert)
        self.run_btn.pack(side='left', padx=10)
        self.cancel_btn = ttk.Button(run_frame, text="Cancel", command=self._cancel, state='disabled')
        self.cancel_btn.pack(side='left')

        # Progress
        prog_frame = ttk.Frame(self)
        prog_frame.pack(fill='x', **pad)
        self.prog = ttk.Progressbar(prog_frame, mode='determinate')
        self.prog.pack(fill='x', padx=10)
        self.status_var = tk.StringVar(value="Idle")
        ttk.Label(prog_frame, textvariable=self.status_var).pack(anchor='w', padx=12, pady=4)

        # Log
        log_frame = ttk.LabelFrame(self, text="Log")
        log_frame.pack(fill='both', expand=True, **pad)
        self.log = tk.Text(log_frame, height=12, wrap='word', bg=DARK_FRAME_BG, fg=DARK_TEXT, insertbackground=DARK_TEXT)
        self.log.pack(fill='both', expand=True, padx=10, pady=8)
        self._refresh_state()

        # Worker control
        self._worker = None
        self._cancel_flag = threading.Event()

    def _refresh_state(self):
        mode = self.mode.get()
        if mode == 'files':
            self.input_entry.delete(0, 'end')
            if self.input_files:
                self.input_entry.insert(0, "; ".join(str(p) for p in self.input_files))
        else:
            self.input_entry.delete(0, 'end')
            if self.input_dir:
                self.input_entry.insert(0, str(self.input_dir))

    def _browse_input(self):
        if self.mode.get() == 'files':
            paths = filedialog.askopenfilenames(title='Select 3DM files', filetypes=[('Rhino 3DM', '*.3dm')])
            if paths:
                self.input_files = [Path(p) for p in paths]
                self.input_dir = None
                self._refresh_state()
        else:
            path = filedialog.askdirectory(title='Select folder containing 3DM files')
            if path:
                self.input_dir = Path(path)
                self.input_files = []
                self._refresh_state()

    def _browse_output(self):
        path = filedialog.askdirectory(title='Select output directory')
        if path:
            self.output_dir = Path(path)
            self.output_entry.delete(0, 'end')
            self.output_entry.insert(0, str(self.output_dir))

    def _start_convert(self):
        # Validate inputs
        mode = self.mode.get()
        if mode == 'files' and not self.input_files:
            messagebox.showerror(APP_TITLE, 'Please select one or more .3dm files.')
            return
        if mode == 'folder' and not self.input_dir:
            messagebox.showerror(APP_TITLE, 'Please select an input folder.')
            return
        if not self.output_dir:
            messagebox.showerror(APP_TITLE, 'Please select an output directory.')
            return

        # Prepare list of files to process
        files = []
        try:
            if mode == 'files':
                files = [p for p in self.input_files if p.suffix.lower() == '.3dm']
            else:
                if self.recursive.get():
                    files = list(Path(self.input_dir).rglob('*.3dm'))
                else:
                    files = list(Path(self.input_dir).glob('*.3dm'))
        except Exception as e:
            messagebox.showerror(APP_TITLE, f'Error reading inputs: {e}')
            return

        if not files:
            messagebox.showwarning(APP_TITLE, 'No .3dm files found to convert.')
            return

        # Target version
        target_version = conv.get_version_number(self.version.get())

        # UI state
        self._set_running(True)
        self.prog['value'] = 0
        self.prog['maximum'] = len(files)
        self.status_var.set(f"Converting {len(files)} files to Rhino {self.version.get()}...")
        self.log.delete('1.0', 'end')
        self._cancel_flag.clear()

        # Run in background thread
        def worker():
            processed = 0
            errors = 0
            for src in files:
                if self._cancel_flag.is_set():
                    break
                try:
                    # Build output path preserving structure if folder mode
                    if mode == 'folder':
                        rel = src.relative_to(self.input_dir)
                        out_path = Path(self.output_dir) / rel
                    else:
                        out_path = Path(self.output_dir) / src.name

                    out_path.parent.mkdir(parents=True, exist_ok=True)

                    ok, err = conv.convert_file(src, out_path, target_version)
                    processed += 1 if ok else 0
                    errors += 0 if ok else 1

                    self._append_log(f"{'OK' if ok else 'ERR'}: {src} -> {out_path}\n" + (f"    {err}\n" if err else ""))
                except Exception as ex:
                    errors += 1
                    self._append_log(f"ERR: {src} -> {ex}\n")
                finally:
                    self._step_progress()

            self.after(0, self._finish, processed, errors)

        self._worker = threading.Thread(target=worker, daemon=True)
        self._worker.start()

    def _set_running(self, running: bool):
        self.run_btn.config(state='disabled' if running else 'normal')
        self.cancel_btn.config(state='normal' if running else 'disabled')
        self.version_combo.config(state='disabled' if running else 'readonly')

    def _cancel(self):
        if self._worker and self._worker.is_alive():
            self._cancel_flag.set()
            self.status_var.set('Cancelling...')

    def _append_log(self, text: str):
        def _do():
            self.log.insert('end', text)
            self.log.see('end')
        self.after(0, _do)

    def _step_progress(self):
        def _do():
            self.prog.step(1)
        self.after(0, _do)

    def _finish(self, ok_count: int, err_count: int):
        if self._cancel_flag.is_set():
            self.status_var.set(f"Cancelled. Converted: {ok_count}, Errors: {err_count}")
        else:
            self.status_var.set(f"Done. Converted: {ok_count}, Errors: {err_count}")
        self._set_running(False)


def main():
    app = ConverterGUI()
    app.mainloop()

if __name__ == '__main__':
    main()
