import os
from PIL import Image

image_path = r"C:\Users\edgar\.gemini\antigravity\brain\5b96343a-763f-4072-b19a-66f9f062437b\media__1780428180872.jpg"

if not os.path.exists(image_path):
    print("Image not found at:", image_path)
else:
    with Image.open(image_path) as img:
        print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
