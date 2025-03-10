import numpy as np
import logging
from pathlib import Path
from ase.io import read
import matplotlib.pyplot as plt
from ase import Atoms
import re

class ASEService:
    """Service for analyzing molecular dynamics simulations using ASE."""
    
    def __init__(self):
        """Initialize the ASE service."""
        self.logger = logging.getLogger(__name__)
    
    def analyze_trajectory(self, trajectory_path, velocity_path=None):
        """
        Analyze a molecular dynamics trajectory.
        
        Args:
            trajectory_path (Path): Path to the trajectory file (xyz, lammps dump, etc.)
            velocity_path (Path, optional): Path to the velocity file (lammps dump with velocities)
            
        Returns:
            dict: A dictionary with the analysis results.
        """
        try:
            # Try to read the trajectory with ASE
            trajectory = None
            
            # Check file extension (handling both .xyz and cases wheresuffix is not set properly)
            if trajectory_path.suffix.lower() == '.xyz' or str(trajectory_path).endswith('.xyz'):
                try:
                    trajectory = read(str(trajectory_path), index=':', format='xyz')
                    self.logger.info(f"Successfully read {len(trajectory)} frames with standard XYZ format")
                except Exception as e:
                    self.logger.warning(f"Failed to read with standard XYZ format: {str(e)}")
                    
                    # Try manual parsing
                    trajectory = self._parse_xyz_manually(trajectory_path)
                    if trajectory:
                        self.logger.info(f"Successfully read {len(trajectory)} frames with manual parsing")
            else:
                # Try to read as LAMMPS dump file
                try:
                    trajectory = read(str(trajectory_path), index=':', format='lammps-dump')
                    self.logger.info(f"Successfully read {len(trajectory)} frames with LAMMPS dump format")
                except Exception as e:
                    self.logger.warning(f"Failed to read with LAMMPS dump format: {str(e)}")
                    
                    # Try manual parsing if possible
                    trajectory = self._parse_xyz_manually(trajectory_path)
                    if trajectory:
                        self.logger.info(f"Successfully read {len(trajectory)} frames with manual parsing")
            
            if not trajectory:
                self.logger.error("Failed to read trajectory file")
                return {"error": "Failed to parse trajectory file"}
            
            # Read velocity file if provided
            velocities = None
            if velocity_path and velocity_path.exists():
                try:
                    velocities = self._parse_velocity_file(velocity_path)
                    self.logger.info(f"Successfully read velocities for {len(velocities)} frames")
                    
                    # Add velocities to trajectory atoms objects
                    if len(velocities) == len(trajectory):
                        for i, (atoms, vels) in enumerate(zip(trajectory, velocities)):
                            if len(vels) == len(atoms):
                                atoms.set_velocities(vels)
                                self.logger.info(f"Added velocities to frame {i}")
                            else:
                                self.logger.warning(f"Velocity frame {i} has {len(vels)} atoms but trajectory has {len(atoms)} atoms")
                    else:
                        self.logger.warning(f"Velocity file has {len(velocities)} frames but trajectory has {len(trajectory)} frames")
                except Exception as e:
                    self.logger.warning(f"Failed to read velocity file: {str(e)}")
            
            # Calculate mean square displacement
            msd = self._calculate_msd(trajectory)
            
            # Calculate kinetic energy
            kinetic_energy = self._calculate_kinetic_energy(trajectory)
            
            # Return the results
            return {
                "msd": msd.tolist() if msd is not None else None,
                "kinetic_energy": kinetic_energy.tolist() if kinetic_energy is not None else None,
                "frames": len(trajectory),
                "atoms": len(trajectory[0])
            }
        except Exception as e:
            self.logger.exception(f"Error analyzing trajectory: {str(e)}")
            return {"error": f"Failed to analyze trajectory: {str(e)}"}
    
    def _calculate_msd(self, trajectory: list) -> np.ndarray:
        """
        Calculate the mean square displacement (MSD) relative to the initial frame.
        
        Args:
            trajectory (list): List of ASE Atoms objects.
            
        Returns:
            numpy.ndarray: Mean square displacement values.
        """
        try:
            initial_positions = trajectory[0].get_positions()
            msd = np.zeros(len(trajectory))
            for i, atoms in enumerate(trajectory):
                positions = atoms.get_positions()
                displacement = positions - initial_positions
                # 各原子ごとの変位の2乗を計算して平均値を算出
                square_displacement = np.sum(displacement**2, axis=1)
                msd[i] = np.mean(square_displacement)
            return msd
        except Exception as e:
            self.logger.exception(f"Error calculating MSD: {str(e)}")
            return None
    
    def _calculate_kinetic_energy(self, trajectory: list) -> np.ndarray:
        """
        Calculate the kinetic energy from the trajectory.
        
        Args:
            trajectory (list): List of ASE Atoms objects.
            
        Returns:
            numpy.ndarray: Kinetic energy for each frame.
        """
        try:
            kinetic_energy = np.zeros(len(trajectory))
            for i, atoms in enumerate(trajectory):
                energy = None
                try:
                    velocities = atoms.get_velocities()
                    if velocities is not None:
                        masses = atoms.get_masses()
                        # より明示的に計算: 各原子の速度の二乗の和を質量と掛け、全体を合計
                        velocity_squared = np.sum(velocities**2, axis=1)
                        energy = 0.5 * np.sum(masses * velocity_squared)
                except Exception as e:
                    self.logger.warning(f"Kinetic energy calculation failed for frame {i}: {str(e)}")
                
                if energy is None:
                    if 'kinetic_energy' in atoms.info:
                        energy = atoms.info['kinetic_energy']
                    else:
                        self.logger.warning(f"Kinetic energy not available for frame {i}. Setting as NaN.")
                        energy = np.nan
                        
                kinetic_energy[i] = energy
            return kinetic_energy
        except Exception as e:
            self.logger.exception(f"Error calculating kinetic energy: {str(e)}")
            return None
    
    def _parse_xyz_manually(self, trajectory_path: Path) -> list:
        """
        Parse an XYZ file manually.
        
        Args:
            trajectory_path (Path): Path to the XYZ file.
            
        Returns:
            list: List of ASE Atoms objects or None if parsing fails.
        """
        try:
            with open(trajectory_path, 'r') as f:
                lines = f.readlines()
            
            trajectory = []
            total_lines = len(lines)
            i = 0
            while i < total_lines:
                # skip any leading empty lines
                while i < total_lines and not lines[i].strip():
                    i += 1
                if i >= total_lines:
                    break
                
                # Parse number of atoms
                try:
                    n_atoms = int(lines[i].strip())
                    self.logger.debug(f"Found frame with {n_atoms} atoms at line {i}")
                except ValueError:
                    self.logger.debug(f"Skipping non-numeric line at index {i}: {lines[i].strip()}")
                    i += 1
                    continue
                i += 1  # Move past the atoms count line
                
                # Skip comment line (XYZフォーマットでは2行目がコメント)
                if i < total_lines:
                    i += 1
                    
                # Skip any blank lines followingコメント
                while i < total_lines and not lines[i].strip():
                    i += 1
                
                positions = []
                symbols = []
                for j in range(n_atoms):
                    if i + j >= total_lines:
                        self.logger.warning("Unexpected end of file while reading atom data")
                        break
                    line = lines[i + j].strip()
                    if not line:
                        continue
                    parts = line.split()
                    if len(parts) < 4:
                        self.logger.debug(f"Skipped line due to insufficient data: {line}")
                        continue
                    symbol = parts[0]
                    try:
                        # 原子種が数字の場合、対応する記号に変換
                        atom_type = int(symbol)
                        symbol = self._get_symbol_from_type(atom_type)
                    except ValueError:
                        # 数字でなければそのまま利用
                        pass
                    try:
                        x, y, z = float(parts[1]), float(parts[2]), float(parts[3])
                    except ValueError:
                        self.logger.debug(f"Invalid coordinate values in line: {line}")
                        continue
                    symbols.append(symbol)
                    positions.append([x, y, z])
                i += n_atoms  # Move index past原子情報行
                
                if len(positions) == n_atoms and len(symbols) == n_atoms:
                    atoms = Atoms(symbols=symbols, positions=positions)
                    trajectory.append(atoms)
                    self.logger.debug(f"Added frame with {n_atoms} atoms")
                else:
                    self.logger.warning("Frame skipped due to missing or invalid atom data")
            if not trajectory:
                self.logger.warning("No frames were parsed from the trajectory file")
                return None
            return trajectory
        except Exception as e:
            self.logger.exception(f"Error parsing XYZ manually: {str(e)}")
            return None
    
    def _get_symbol_from_type(self, atom_type: int) -> str:
        """
        Get the element symbol from the atom type.
        
        Args:
            atom_type (int): Atom type.
            
        Returns:
            str: Element symbol.
        """
        type_to_symbol = {
            1: 'Ar',  # 例: 一般的なLJシミュレーションでは1をArgonとする
            2: 'He',
            3: 'Li',
            4: 'Be',
            5: 'B',
            6: 'C',
            7: 'N',
            8: 'O',
            9: 'F',
            10: 'Ne',
            11: 'Na',
            12: 'Mg',
            13: 'Al',
            14: 'Si',
            15: 'P',
            16: 'S',
            17: 'Cl',
            18: 'Ar',
            19: 'K',
            20: 'Ca',
        }
        return type_to_symbol.get(atom_type, 'X')
    
    def _parse_velocity_file(self, velocity_path):
        """
        Parse a LAMMPS velocity dump file.
        
        Args:
            velocity_path (Path): Path to the velocity dump file.
            
        Returns:
            list: List of velocity arrays for each frame.
        """
        try:
            with open(velocity_path, 'r') as f:
                lines = f.readlines()
            
            velocities = []
            i = 0
            while i < len(lines):
                # Look for ITEM: TIMESTEP
                if i < len(lines) and "ITEM: TIMESTEP" in lines[i]:
                    i += 2  # Skip timestep line
                    
                    # Look for ITEM: NUMBER OF ATOMS
                    if i < len(lines) and "ITEM: NUMBER OF ATOMS" in lines[i]:
                        i += 1
                        num_atoms = int(lines[i].strip())
                        i += 1
                        
                        # Skip box bounds
                        while i < len(lines) and "ITEM: ATOMS" not in lines[i]:
                            i += 1
                        
                        # Parse atom velocities
                        if i < len(lines) and "ITEM: ATOMS" in lines[i]:
                            # Get column indices for id, vx, vy, vz
                            header = lines[i].strip().split()
                            id_idx = header.index("id") - 2  # -2 because "ITEM: ATOMS" counts as 2 words
                            vx_idx = header.index("vx") - 2
                            vy_idx = header.index("vy") - 2
                            vz_idx = header.index("vz") - 2
                            
                            i += 1
                            frame_velocities = np.zeros((num_atoms, 3))
                            atom_ids = []
                            
                            # Read num_atoms lines
                            for j in range(num_atoms):
                                if i + j < len(lines):
                                    parts = lines[i + j].strip().split()
                                    atom_id = int(parts[id_idx]) - 1  # Convert to 0-based index
                                    vx = float(parts[vx_idx])
                                    vy = float(parts[vy_idx])
                                    vz = float(parts[vz_idx])
                                    
                                    atom_ids.append(atom_id)
                                    frame_velocities[atom_id] = [vx, vy, vz]
                            
                            velocities.append(frame_velocities)
                            i += num_atoms
                        else:
                            i += 1
                    else:
                        i += 1
                else:
                    i += 1
            
            self.logger.info(f"Parsed {len(velocities)} velocity frames")
            return velocities
        except Exception as e:
            self.logger.exception(f"Error parsing velocity file: {str(e)}")
            return None
