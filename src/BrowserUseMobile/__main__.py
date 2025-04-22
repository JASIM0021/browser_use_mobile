import os
import threading
import tkinter as tk
from tkinter import messagebox, scrolledtext
from .agent_runner import run_agent_server_with_logger
# Check if API key exists
def load_api_key():
    try:
        with open(os.path.join(os.path.dirname(__file__), ".env"), "r") as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith("OPENAI_API_KEY"):
                    return line.split('=')[1].strip()
    except FileNotFoundError:
        return None
    return None

# Save the .env file with API key
def save_env_and_start():
    api_key = api_key_input.get().strip()
    
    # If the key is empty, show error
    if not api_key:
        messagebox.showerror("Error", "API Key cannot be empty!")
        return

    # Save to .env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_path, "w") as f:
        f.write(f"OPENAI_API_KEY={api_key}\n")

    status_label.config(text="✅ API Key saved successfully!")

    # Start the FastAPI server in a background thread
    threading.Thread(target=run_agent_server_with_logger, args=(log_to_ui,), daemon=True).start()

# Append messages to the log panel
def log_to_ui(message):
    log_area.configure(state='normal')
    log_area.insert(tk.END, message + "\n")
    log_area.configure(state='disabled')
    log_area.yview(tk.END)

# UI Setup
root = tk.Tk()
root.title("Browser Agent Setup")
root.geometry("700x500")

# Label to guide user
tk.Label(root, text="Enter your OPENAI API Key (will only be set once):").pack()

# Input box for API Key
api_key_input = tk.Entry(root, width=80, show="*")
api_key_input.pack(padx=10, pady=5)

# Button to save and start the server
tk.Button(root, text="💾 Save & 🚀 Start Agent", command=save_env_and_start).pack(pady=10)

# Status label for feedback
status_label = tk.Label(root, text="", fg="green")
status_label.pack()

# Show current logs of agent
tk.Label(root, text="Agent Logs:").pack()

log_area = scrolledtext.ScrolledText(root, height=15, width=80, state='disabled', bg="#f7f7f7")
log_area.pack(padx=10, pady=5)

# Load API Key if it's already set
api_key = load_api_key()
if api_key:
    status_label.config(text="✅ API Key already set. Starting agent...")
    threading.Thread(target=run_agent_server_with_logger, args=(log_to_ui,), daemon=True).start()

root.mainloop()
