import os
import threading
import tkinter as tk
from tkinter import messagebox, scrolledtext, filedialog
from .agent_runner import run_agent_server_with_logger

# Common browser paths (will be auto-detected)
BROWSERS = {
    "Chrome (Default)": "",
    "Chrome": "chrome",
    "Firefox": "firefox",
    "Edge": "edge",
    "Opera": "opera",
    "Custom...": "custom"
}

def load_settings():
    settings = {
        "browser": "",
        "browser_path": ""
    }
    try:
        with open(os.path.join(os.path.dirname(__file__), ".env"), "r") as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith("BROWSER_PATH="):
                    settings["browser_path"] = line.split('=')[1].strip()
    except FileNotFoundError:
        pass
    return settings

def save_settings():
    browser = browser_var.get()
    browser_path = browser_path_var.get()
    
    # Handle browser path
    if browser == "Custom...":
        browser_path = filedialog.askopenfilename(
            title="Select Browser Executable",
            filetypes=[("Executable files", "*.exe"), ("All files", "*.*")]
        )
        if not browser_path:
            return
        browser_path_var.set(browser_path)
    elif browser != "Chrome (Default)":
        browser_path = browser.lower()

    # Save to .env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_path, "w") as f:
        if browser_path:
            f.write(f"BROWSER_PATH={browser_path}\n")

    status_label.config(text="✅ Settings saved successfully!")
    log_to_ui(f"Settings saved - Browser: {browser}")
    
    # Start the FastAPI server if not already running
    if not hasattr(save_settings, "server_started"):
        threading.Thread(target=run_agent_server_with_logger, args=(log_to_ui,), daemon=True).start()
        save_settings.server_started = True

def log_to_ui(message):
    log_area.configure(state='normal')
    log_area.insert(tk.END, message + "\n")
    log_area.configure(state='disabled')
    log_area.yview(tk.END)
    root.update()

def browse_custom_path():
    path = filedialog.askopenfilename(
        title="Select Browser Executable",
        filetypes=[("Executable files", "*.exe"), ("All files", "*.*")]
    )
    if path:
        browser_path_var.set(path)

# UI Setup
root = tk.Tk()
root.title("Browser Agent Setup")
root.geometry("800x600")

# Settings Frame
settings_frame = tk.LabelFrame(root, text="Settings", padx=10, pady=10)
settings_frame.pack(fill="x", padx=10, pady=5)

# Browser Selection
tk.Label(settings_frame, text="Browser:").grid(row=0, column=0, sticky="w")
browser_var = tk.StringVar(value="Chrome (Default)")
browser_menu = tk.OptionMenu(settings_frame, browser_var, *BROWSERS.keys())
browser_menu.grid(row=0, column=1, sticky="w", padx=5, pady=2)

# Browser Path
tk.Label(settings_frame, text="Browser Path:").grid(row=1, column=0, sticky="w")
browser_path_var = tk.StringVar()
browser_path_entry = tk.Entry(settings_frame, width=60, textvariable=browser_path_var)
browser_path_entry.grid(row=1, column=1, padx=5, pady=2)
browse_button = tk.Button(settings_frame, text="Browse...", command=browse_custom_path)
browse_button.grid(row=1, column=2, padx=5)

# Save Button
save_button = tk.Button(root, text="💾 Save & 🚀 Start Agent", command=save_settings)
save_button.pack(pady=10)

# Status label
status_label = tk.Label(root, text="", fg="green")
status_label.pack()

# Log Frame
log_frame = tk.LabelFrame(root, text="Agent Logs", padx=10, pady=10)
log_frame.pack(fill="both", expand=True, padx=10, pady=5)

log_area = scrolledtext.ScrolledText(log_frame, height=15, width=90, state='disabled', bg="#f7f7f7")
log_area.pack(fill="both", expand=True)

# Load existing settings
settings = load_settings()
if settings["browser_path"]:
    browser_path_var.set(settings["browser_path"])
    # Try to determine which browser was selected
    for name, path in BROWSERS.items():
        if path and path in settings["browser_path"].lower():
            browser_var.set(name)
            break
    else:
        browser_var.set("Custom...")

# Start server
status_label.config(text="✅ Starting agent...")
threading.Thread(target=run_agent_server_with_logger, args=(log_to_ui,), daemon=True).start()

root.mainloop()
