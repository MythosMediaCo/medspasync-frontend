#!/usr/bin/env python3
"""
Development Script for MedSpaSync Pro Backend
Comprehensive development tools and utilities
"""

import os
import sys
import subprocess
import argparse
import time
from pathlib import Path
from typing import List, Dict, Any

class DevScript:
    """Development script for backend development tasks"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.python_path = sys.executable
        
    def run_command(self, command: List[str], cwd: Path = None, capture_output: bool = False) -> subprocess.CompletedProcess:
        """Run a shell command"""
        if cwd is None:
            cwd = self.project_root
            
        print(f"Running: {' '.join(command)}")
        print(f"Working directory: {cwd}")
        
        try:
            result = subprocess.run(
                command,
                cwd=cwd,
                capture_output=capture_output,
                text=True,
                check=True
            )
            return result
        except subprocess.CalledProcessError as e:
            print(f"Command failed with exit code {e.returncode}")
            if e.stdout:
                print(f"STDOUT: {e.stdout}")
            if e.stderr:
                print(f"STDERR: {e.stderr}")
            raise
    
    def install_dependencies(self):
        """Install Python dependencies"""
        print("Installing Python dependencies...")
        self.run_command([self.python_path, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependencies installed successfully!")
    
    def run_tests(self, test_type: str = "all", coverage: bool = True, verbose: bool = True):
        """Run tests with specified options"""
        print(f"Running {test_type} tests...")
        
        cmd = [self.python_path, "-m", "pytest"]
        
        if test_type == "unit":
            cmd.extend(["-m", "unit"])
        elif test_type == "integration":
            cmd.extend(["-m", "integration"])
        elif test_type == "security":
            cmd.extend(["-m", "security"])
        elif test_type == "fast":
            cmd.extend(["-m", "not slow"])
        
        if coverage:
            cmd.extend(["--cov=.", "--cov-report=term-missing"])
        
        if verbose:
            cmd.append("-v")
        
        try:
            self.run_command(cmd)
            print("Tests completed successfully!")
        except subprocess.CalledProcessError:
            print("Tests failed!")
            sys.exit(1)
    
    def run_linting(self):
        """Run code linting with flake8"""
        print("Running code linting...")
        try:
            self.run_command([self.python_path, "-m", "flake8", ".", "--max-line-length=100"])
            print("Linting passed!")
        except subprocess.CalledProcessError:
            print("Linting failed!")
            sys.exit(1)
    
    def run_formatting(self, check_only: bool = False):
        """Run code formatting with black"""
        print("Running code formatting...")
        cmd = [self.python_path, "-m", "black", "."]
        
        if check_only:
            cmd.append("--check")
        
        try:
            self.run_command(cmd)
            if check_only:
                print("Code formatting check passed!")
            else:
                print("Code formatted successfully!")
        except subprocess.CalledProcessError:
            if check_only:
                print("Code formatting check failed!")
            else:
                print("Code formatting failed!")
            sys.exit(1)
    
    def run_type_checking(self):
        """Run type checking with mypy"""
        print("Running type checking...")
        try:
            self.run_command([self.python_path, "-m", "mypy", ".", "--ignore-missing-imports"])
            print("Type checking passed!")
        except subprocess.CalledProcessError:
            print("Type checking failed!")
            sys.exit(1)
    
    def run_security_checks(self):
        """Run security checks"""
        print("Running security checks...")
        
        # Check for common security issues
        security_issues = []
        
        # Check for hardcoded secrets
        for py_file in self.project_root.rglob("*.py"):
            try:
                with open(py_file, 'r') as f:
                    content = f.read()
                    if any(secret in content.lower() for secret in ['password', 'secret', 'key', 'token']):
                        if any(hardcoded in content for hardcoded in ['password123', 'secret123', 'key123']):
                            security_issues.append(f"Potential hardcoded secret in {py_file}")
            except Exception:
                continue
        
        if security_issues:
            print("Security issues found:")
            for issue in security_issues:
                print(f"  - {issue}")
            sys.exit(1)
        else:
            print("Security checks passed!")
    
    def run_performance_tests(self):
        """Run performance tests"""
        print("Running performance tests...")
        try:
            self.run_command([self.python_path, "-m", "pytest", "-m", "performance", "-v"])
            print("Performance tests completed!")
        except subprocess.CalledProcessError:
            print("Performance tests failed!")
            sys.exit(1)
    
    def generate_documentation(self):
        """Generate documentation"""
        print("Generating documentation...")
        try:
            # Create docs directory if it doesn't exist
            docs_dir = self.project_root / "docs"
            docs_dir.mkdir(exist_ok=True)
            
            # Generate API documentation
            self.run_command([self.python_path, "-m", "pydoc", "-w", "."], capture_output=True)
            
            print("Documentation generated successfully!")
        except subprocess.CalledProcessError:
            print("Documentation generation failed!")
            sys.exit(1)
    
    def run_coverage_report(self):
        """Generate detailed coverage report"""
        print("Generating coverage report...")
        try:
            self.run_command([self.python_path, "-m", "coverage", "html"])
            print("Coverage report generated in htmlcov/")
        except subprocess.CalledProcessError:
            print("Coverage report generation failed!")
            sys.exit(1)
    
    def clean_project(self):
        """Clean project artifacts"""
        print("Cleaning project...")
        
        # Remove Python cache files
        for cache_dir in self.project_root.rglob("__pycache__"):
            import shutil
            shutil.rmtree(cache_dir)
        
        # Remove coverage files
        coverage_files = ["htmlcov", ".coverage", "coverage.xml"]
        for file in coverage_files:
            file_path = self.project_root / file
            if file_path.exists():
                if file_path.is_dir():
                    import shutil
                    shutil.rmtree(file_path)
                else:
                    file_path.unlink()
        
        print("Project cleaned successfully!")
    
    def run_development_server(self, port: int = 8000, debug: bool = True):
        """Run development server"""
        print(f"Starting development server on port {port}...")
        
        env = os.environ.copy()
        if debug:
            env['DEBUG'] = 'true'
            env['ENVIRONMENT'] = 'development'
        
        try:
            self.run_command([
                self.python_path, "-m", "uvicorn", 
                "api_server:medspa_api.app", 
                "--host", "0.0.0.0", 
                "--port", str(port),
                "--reload"
            ], env=env)
        except KeyboardInterrupt:
            print("\nDevelopment server stopped.")
        except subprocess.CalledProcessError:
            print("Failed to start development server!")
            sys.exit(1)
    
    def run_health_check(self):
        """Run health check on the system"""
        print("Running health check...")
        
        health_status = {
            'python_version': sys.version,
            'project_root': str(self.project_root),
            'requirements_file': (self.project_root / "requirements.txt").exists(),
            'tests_directory': (self.project_root / "tests").exists(),
            'api_server': (self.project_root / "api_server.py").exists(),
        }
        
        print("Health Check Results:")
        for key, value in health_status.items():
            status = "✓" if value else "✗"
            print(f"  {status} {key}: {value}")
        
        return all(health_status.values())
    
    def run_full_check(self):
        """Run full development check"""
        print("Running full development check...")
        
        checks = [
            ("Health Check", self.run_health_check),
            ("Code Formatting", lambda: self.run_formatting(check_only=True)),
            ("Linting", self.run_linting),
            ("Type Checking", self.run_type_checking),
            ("Security Checks", self.run_security_checks),
            ("Unit Tests", lambda: self.run_tests("unit", coverage=True)),
        ]
        
        results = []
        for check_name, check_func in checks:
            print(f"\n--- {check_name} ---")
            try:
                result = check_func()
                results.append((check_name, True, None))
                print(f"✓ {check_name} passed")
            except Exception as e:
                results.append((check_name, False, str(e)))
                print(f"✗ {check_name} failed: {e}")
        
        print("\n--- Full Check Summary ---")
        passed = sum(1 for _, success, _ in results if success)
        total = len(results)
        
        for check_name, success, error in results:
            status = "✓" if success else "✗"
            print(f"{status} {check_name}")
            if not success and error:
                print(f"    Error: {error}")
        
        print(f"\nOverall: {passed}/{total} checks passed")
        
        if passed < total:
            sys.exit(1)
    
    def setup_pre_commit(self):
        """Setup pre-commit hooks"""
        print("Setting up pre-commit hooks...")
        try:
            self.run_command([self.python_path, "-m", "pre_commit", "install"])
            print("Pre-commit hooks installed successfully!")
        except subprocess.CalledProcessError:
            print("Failed to install pre-commit hooks!")
            sys.exit(1)

def main():
    """Main function for the development script"""
    parser = argparse.ArgumentParser(description="MedSpaSync Pro Backend Development Script")
    parser.add_argument("command", choices=[
        "install", "test", "lint", "format", "typecheck", "security", 
        "performance", "docs", "coverage", "clean", "server", "health", 
        "full-check", "pre-commit"
    ], help="Development command to run")
    
    parser.add_argument("--test-type", choices=["all", "unit", "integration", "security", "fast"], 
                       default="all", help="Type of tests to run")
    parser.add_argument("--no-coverage", action="store_true", help="Disable coverage reporting")
    parser.add_argument("--check-only", action="store_true", help="Check formatting without modifying files")
    parser.add_argument("--port", type=int, default=8000, help="Port for development server")
    parser.add_argument("--no-debug", action="store_true", help="Disable debug mode for server")
    
    args = parser.parse_args()
    
    dev_script = DevScript()
    
    try:
        if args.command == "install":
            dev_script.install_dependencies()
        elif args.command == "test":
            dev_script.run_tests(args.test_type, coverage=not args.no_coverage)
        elif args.command == "lint":
            dev_script.run_linting()
        elif args.command == "format":
            dev_script.run_formatting(check_only=args.check_only)
        elif args.command == "typecheck":
            dev_script.run_type_checking()
        elif args.command == "security":
            dev_script.run_security_checks()
        elif args.command == "performance":
            dev_script.run_performance_tests()
        elif args.command == "docs":
            dev_script.generate_documentation()
        elif args.command == "coverage":
            dev_script.run_coverage_report()
        elif args.command == "clean":
            dev_script.clean_project()
        elif args.command == "server":
            dev_script.run_development_server(args.port, debug=not args.no_debug)
        elif args.command == "health":
            dev_script.run_health_check()
        elif args.command == "full-check":
            dev_script.run_full_check()
        elif args.command == "pre-commit":
            dev_script.setup_pre_commit()
    
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 