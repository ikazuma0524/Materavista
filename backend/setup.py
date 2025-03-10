from setuptools import setup, find_packages

setup(
    name="lammps-simulation-platform",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.95.1",
        "uvicorn==0.22.0",
        "pytest==7.3.1",
        "httpx==0.24.0",
        "python-multipart==0.0.6",
        "ase==3.22.1",
        "numpy==1.24.3",
        "matplotlib==3.7.1",
        "pydantic==1.10.7",
        "docker==6.1.2",
        "python-dotenv==1.0.0",
    ],
) 