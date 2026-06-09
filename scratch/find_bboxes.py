import os
from PIL import Image

image_path = r"C:\Users\edgar\.gemini\antigravity\brain\5b96343a-763f-4072-b19a-66f9f062437b\media__1780428180872.jpg"

with Image.open(image_path) as img:
    img = img.convert("RGB")
    width, height = img.size
    
    # Threshold to identify non-white pixels
    threshold = 245
    non_white_pixels = []
    
    for y in range(height):
        for x in range(width):
            r, g, b = img.getpixel((x, y))
            if r < threshold or g < threshold or b < threshold:
                non_white_pixels.append((x, y))
                
    if not non_white_pixels:
        print("No non-white pixels found!")
        exit()
        
    min_x = min(p[0] for p in non_white_pixels)
    max_x = max(p[0] for p in non_white_pixels)
    min_y = min(p[1] for p in non_white_pixels)
    max_y = max(p[1] for p in non_white_pixels)
    
    print(f"Entire logo bbox: X: {min_x} to {max_x}, Y: {min_y} to {max_y}")
    
    # Let's find the vertical columns profile to find the gap between the mark and the text
    col_profile = [0] * width
    for x, y in non_white_pixels:
        col_profile[x] += 1
        
    # Let's print regions of columns with non-white pixels
    active_ranges = []
    start = None
    for x in range(width):
        if col_profile[x] > 0 and start is None:
            start = x
        elif col_profile[x] == 0 and start is not None:
            active_ranges.append((start, x - 1))
            start = None
    if start is not None:
        active_ranges.append((start, width - 1))
        
    print("Horizontal segments (mark vs text gap):")
    for idx, (s, e) in enumerate(active_ranges):
        # Find min/max Y for this horizontal segment
        seg_y = [p[1] for p in non_white_pixels if s <= p[0] <= e]
        min_seg_y = min(seg_y)
        max_seg_y = max(seg_y)
        print(f"  Segment {idx+1}: X: {s} to {e} (width {e-s+1}), Y: {min_seg_y} to {max_seg_y} (height {max_seg_y-min_seg_y+1})")
