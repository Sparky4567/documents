from pathlib import Path
from pathlib import PurePath
# import random
import shutil
def get_md_files(passed_dir):
    files = Path(passed_dir).rglob("*.md")
    return files

def get_list_to_copy():
    files = get_md_files("../blog")
    path_list = []
    for file in files:
        path_list.append({"file_name":file.name,"file_path":file.resolve().as_posix()})
    return path_list

def file_copy_function():
    try:        
        files_from_astro = get_list_to_copy()
        for ob in files_from_astro:
            file_name = Path(f"/mnt/chromeos/GoogleDrive/MyDrive/DOCS_STORAGE/{ob["file_name"]}").resolve()
            if(not file_name.is_file()):
                print(f"{file_name} does not exist. ❌")
                shutil.copy(ob["file_path"],file_name)
                print(f"{file_name} was copied to {file_name}. ✅")
            else:
                print(f"{file_name} does exist. Skipping. ✅")


    except Exception as e:
        print(f"Error: {e}")

file_copy_function()
