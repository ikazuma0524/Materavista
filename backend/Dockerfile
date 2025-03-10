FROM ubuntu:22.04

# Install required packages
RUN apt-get update && apt-get install -y \
    build-essential \
    wget \
    git \
    python3 \
    python3-pip \
    python3-dev \
    libopenmpi-dev \
    libfftw3-dev \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Install ASE and other Python dependencies
RUN pip3 install ase numpy matplotlib

# Install LAMMPS
WORKDIR /opt
RUN wget https://github.com/lammps/lammps/archive/stable_29Sep2021_update2.tar.gz \
    && tar -xzf stable_29Sep2021_update2.tar.gz \
    && cd lammps-stable_29Sep2021_update2 \
    && mkdir build \
    && cd build \
    && cmake ../cmake -DPKG_MOLECULE=yes -DPKG_MANYBODY=yes -DPKG_KSPACE=yes \
    && make -j$(nproc) \
    && make install

# Create working directory for simulation files
WORKDIR /simulations

# Define volume for input/output
VOLUME ["/simulations"]

# Set environment variables
ENV PATH="/opt/lammps-stable_29Sep2021_update2/build:${PATH}"

# Default command
CMD ["lmp", "-help"] 