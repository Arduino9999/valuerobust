# build.py
import os

def build_project_from_allcode(allcode_path="allcode"):
    if not os.path.exists(allcode_path):
        print(f"Error: {allcode_path} not found.")
        return

    with open(allcode_path, "r", encoding="utf-8") as f:
        all_code = f.read()

    # Debug: Print the content read from the file.
    print("Allcode content loaded:")
    print(repr(all_code))

    # Split the file into blocks using our custom delimiter.
    blocks = all_code.split("<<<FILE:")
    print(f"Number of blocks found: {len(blocks)}")
    
    file_count = 0

    for block in blocks:
        block = block.strip()
        if not block:
            continue

        # Debug: Print the block header (first 50 characters)
        print("Processing block:", block[:50])

        # Find the header delimiter ">>>"
        end_of_header = block.find(">>>")
        if end_of_header == -1:
            print("Warning: Header delimiter '>>>' not found; skipping block.")
            continue

        # Extract the relative file path.
        file_path = block[:end_of_header].strip()
        
        # The remainder is the file content, ending with the "<<<ENDFILE>>>" marker.
        content_with_end = block[end_of_header + 3:].strip()
        end_marker = "<<<ENDFILE>>>"
        if content_with_end.endswith(end_marker):
            content = content_with_end[:-len(end_marker)].rstrip()
        else:
            content = content_with_end

        # Create the directory if it doesn't exist.
        target_dir = os.path.dirname(file_path)
        if target_dir and not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
            print(f"Created directory: {target_dir}")

        # Write the content to the file.
        try:
            with open(file_path, "w", encoding="utf-8") as out_file:
                out_file.write(content)
            print(f"Wrote file: {file_path}")
            file_count += 1
        except Exception as e:
            print(f"Error writing file {file_path}: {e}")

    print(f"Build complete. {file_count} files were written.")

if __name__ == "__main__":
    build_project_from_allcode()
