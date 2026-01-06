import sys
import os
import subprocess
import signal
import psutil
from PyQt6.QtWidgets import QApplication, QMainWindow
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtCore import QUrl

# ===== CONFIG =====
URL = "http://localhost:5000"
NODE_COMMAND = ["npm", "run", "start"]

# ===== Start Node App =====
node_process = subprocess.Popen(
    NODE_COMMAND,
    cwd=os.getcwd(),
    shell=True
)

# ===== Create PyQt Application =====
app = QApplication(sys.argv)

# ===== Main Window with WebEngine =====
window = QMainWindow()
window.setWindowTitle("My Node App")
window.resize(1200, 800)

webview = QWebEngineView()
webview.load(QUrl(URL))
window.setCentralWidget(webview)

# ===== Handle Window Close =====
def on_close():
    print("GUI closed. Killing Node app...")
    for proc in psutil.process_iter(["pid", "name"]):
        if proc.info["name"] and "node" in proc.info["name"].lower():
            proc.kill()
    sys.exit(0)

window.closeEvent = lambda event: on_close()

# ===== Show Window =====
window.show()
sys.exit(app.exec())
