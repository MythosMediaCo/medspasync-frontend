#!/usr/bin/env python3
"""
MedSpaSync Pro Ecosystem Terminal Dashboard
Unified monitoring for backend, frontends, and infrastructure
"""

import os
import sys
import time
import requests
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich.align import Align
from rich.text import Text
from rich.layout import Layout
from rich import box

console = Console()

# Service endpoints
SERVICES = [
    {
        'name': 'Backend API Gateway',
        'url': 'http://localhost:8000/health/quick',
        'version_url': 'http://localhost:8000/status',
        'type': 'backend',
    },
    {
        'name': 'Main Frontend',
        'url': 'http://localhost:3000',
        'type': 'frontend',
    },
    {
        'name': 'Demo Frontend',
        'url': 'http://localhost:3001',
        'type': 'frontend',
    },
]

INFRA = [
    {
        'name': 'Redis',
        'cmd': 'redis-cli ping',
        'type': 'infra',
    },
    {
        'name': 'PostgreSQL',
        'cmd': 'pg_isready',
        'type': 'infra',
    },
]

LOG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../logs'))

REFRESH_INTERVAL = 5  # seconds


def check_service(service):
    try:
        resp = requests.get(service['url'], timeout=2)
        if resp.status_code == 200:
            if service['type'] == 'backend':
                data = resp.json()
                return 'RUNNING', data.get('version', ''), data.get('status', 'healthy')
            return 'RUNNING', '', ''
        else:
            return 'ERROR', '', ''
    except Exception:
        return 'DOWN', '', ''

def check_version(service):
    try:
        resp = requests.get(service['version_url'], timeout=2)
        if resp.status_code == 200:
            data = resp.json()
            return data.get('version', '')
        return ''
    except Exception:
        return ''

def check_infra(infra):
    try:
        result = os.popen(infra['cmd']).read().strip()
        if infra['name'] == 'Redis':
            return 'RUNNING' if result == 'PONG' else 'DOWN'
        if infra['name'] == 'PostgreSQL':
            return 'RUNNING' if 'accepting connections' in result else 'DOWN'
        return 'UNKNOWN'
    except Exception:
        return 'DOWN'

def get_recent_alerts():
    alerts = []
    audit_log = os.path.join(LOG_DIR, 'audit.log')
    if os.path.exists(audit_log):
        with open(audit_log, 'r') as f:
            lines = f.readlines()[-50:]
            for line in lines:
                if any(x in line for x in ['LOGIN_FAILED', 'PHI_ACCESS', 'SECURITY_VIOLATION']):
                    alerts.append(line.strip())
    return alerts[-5:]

def build_dashboard():
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="main", ratio=2),
        Layout(name="alerts", size=8),
        Layout(name="footer", size=2),
    )

    # Header
    layout["header"].update(Align.center(Text("MedSpaSync Pro Ecosystem Dashboard", style="bold cyan")))

    # Service Table
    table = Table(title="Service Status", box=box.SIMPLE_HEAVY)
    table.add_column("Service", style="bold")
    table.add_column("Status")
    table.add_column("Version")
    table.add_column("Health")

    for svc in SERVICES:
        status, version, health = check_service(svc)
        if svc['type'] == 'backend' and not version:
            version = check_version(svc)
        color = {
            'RUNNING': 'green',
            'DOWN': 'red',
            'ERROR': 'yellow',
        }.get(status, 'white')
        table.add_row(svc['name'], f'[{color}]{status}[/{color}]', version, health)

    for infra in INFRA:
        status = check_infra(infra)
        color = 'green' if status == 'RUNNING' else 'red'
        table.add_row(infra['name'], f'[{color}]{status}[/{color}]', '', '')

    layout["main"].update(table)

    # Alerts
    alerts = get_recent_alerts()
    if alerts:
        alert_panel = Panel("\n".join(alerts), title="Recent Security Alerts", style="yellow")
    else:
        alert_panel = Panel("No recent security alerts.", title="Recent Security Alerts", style="green")
    layout["alerts"].update(alert_panel)

    # Footer
    layout["footer"].update(Align.center(Text("[r] Refresh   [q] Quit   [Ctrl+C] Quit", style="dim")))

    return layout

def main():
    console.clear()
    with Live(build_dashboard(), refresh_per_second=1, screen=True) as live:
        while True:
            try:
                key = console.input("")
                if key.lower() == 'q':
                    break
                elif key.lower() == 'r':
                    live.update(build_dashboard())
                else:
                    time.sleep(REFRESH_INTERVAL)
                    live.update(build_dashboard())
            except KeyboardInterrupt:
                break

if __name__ == "__main__":
    main() 