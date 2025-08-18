# PyInstaller hook for rhino3dm
from PyInstaller.utils.hooks import collect_submodules, collect_data_files, collect_dynamic_libs

hiddenimports = collect_submodules('rhino3dm')

datas = []
datas += collect_data_files('rhino3dm', include_py_files=True)

binaries = []
binaries += collect_dynamic_libs('rhino3dm')
